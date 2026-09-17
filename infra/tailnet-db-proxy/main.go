package main

import (
	"context"
	"encoding/binary"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"strings"
	"sync"
	"sync/atomic"
	"syscall"
	"time"
)

const (
	socks5Version       = 5
	socks5NoAuthMethod  = 0
	socks5Connect       = 1
	socks5IPv4Address   = 1
	socks5DomainAddress = 3
	socks5IPv6Address   = 4
)

type config struct {
	localListenAddress string
	socks5Address      string
	databaseHost       string
	databasePort       int
	dialTimeout        time.Duration
	healthListenAddr   string
	healthTimeout      time.Duration
}

type forwarder struct {
	config config
	ready  atomic.Bool
	wg     sync.WaitGroup
}

func main() {
	configuration, err := loadConfig()
	if err != nil {
		log.Fatal(err)
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	if err := (&forwarder{config: configuration}).run(ctx); err != nil {
		log.Fatal(err)
	}
}

func loadConfig() (config, error) {
	databaseHost := strings.TrimSpace(os.Getenv("TAILSCALE_DB_HOST"))
	if databaseHost == "" {
		return config{}, errors.New("TAILSCALE_DB_HOST must be set")
	}

	databasePort, err := envPort("TAILSCALE_DB_PORT", 5432)
	if err != nil {
		return config{}, err
	}
	localPort, err := envPort("LOCAL_DB_PROXY_PORT", 15432)
	if err != nil {
		return config{}, err
	}
	healthPort, err := envPort("PROXY_HEALTH_PORT", 18080)
	if err != nil {
		return config{}, err
	}

	socks5Address := strings.TrimSpace(firstNonEmpty(
		os.Getenv("TAILSCALE_SOCKS5_ADDR"),
		os.Getenv("TS_SOCKS5_SERVER"),
	))
	if socks5Address == "" {
		socks5Port, portErr := envPort("TAILSCALE_SOCKS_PORT", 1055)
		if portErr != nil {
			return config{}, portErr
		}
		socks5Address = net.JoinHostPort("127.0.0.1", strconv.Itoa(socks5Port))
	} else if strings.HasPrefix(socks5Address, ":") {
		socks5Address = net.JoinHostPort("127.0.0.1", strings.TrimPrefix(socks5Address, ":"))
	}

	dialTimeout, err := envDuration("PROXY_DIAL_TIMEOUT", 10*time.Second)
	if err != nil {
		return config{}, err
	}
	healthTimeout, err := envDuration("PROXY_HEALTH_TIMEOUT", 3*time.Second)
	if err != nil {
		return config{}, err
	}

	localAddress := envOrDefault("LOCAL_DB_PROXY_ADDR", "127.0.0.1")
	healthAddress := envOrDefault("PROXY_HEALTH_ADDR", "0.0.0.0")
	if localPort == healthPort && localAddress == healthAddress {
		return config{}, errors.New("LOCAL_DB_PROXY_PORT and PROXY_HEALTH_PORT must be different on the same address")
	}

	return config{
		localListenAddress: net.JoinHostPort(localAddress, strconv.Itoa(localPort)),
		socks5Address:      socks5Address,
		databaseHost:       databaseHost,
		databasePort:       databasePort,
		dialTimeout:        dialTimeout,
		healthListenAddr:   net.JoinHostPort(healthAddress, strconv.Itoa(healthPort)),
		healthTimeout:      healthTimeout,
	}, nil
}

func (f *forwarder) run(ctx context.Context) error {
	localListener, err := net.Listen("tcp", f.config.localListenAddress)
	if err != nil {
		return fmt.Errorf("listen for database proxy on %s: %w", f.config.localListenAddress, err)
	}
	defer localListener.Close()

	healthListener, err := net.Listen("tcp", f.config.healthListenAddr)
	if err != nil {
		return fmt.Errorf("listen for health checks on %s: %w", f.config.healthListenAddr, err)
	}
	defer healthListener.Close()

	server := &http.Server{
		Handler:           f.healthHandler(),
		ReadHeaderTimeout: 2 * time.Second,
	}
	runContext, cancel := context.WithCancel(ctx)
	defer cancel()

	f.ready.Store(true)
	log.Printf(
		"ready: database listener=%s SOCKS5=%s target=%s",
		f.config.localListenAddress,
		f.config.socks5Address,
		net.JoinHostPort(f.config.databaseHost, strconv.Itoa(f.config.databasePort)),
	)

	acceptErrors := make(chan error, 1)
	go func() {
		acceptErrors <- f.acceptConnections(runContext, localListener)
	}()

	serverErrors := make(chan error, 1)
	go func() {
		if serveErr := server.Serve(healthListener); serveErr != nil && !errors.Is(serveErr, http.ErrServerClosed) {
			serverErrors <- serveErr
		}
	}()

	var runErr error
	select {
	case runErr = <-acceptErrors:
	case runErr = <-serverErrors:
	case <-ctx.Done():
	}

	f.ready.Store(false)
	cancel()
	_ = localListener.Close()
	_ = healthListener.Close()

	shutdownContext, shutdownCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer shutdownCancel()
	_ = server.Shutdown(shutdownContext)
	f.wg.Wait()

	if ctx.Err() != nil {
		return nil
	}
	if errors.Is(runErr, net.ErrClosed) {
		return nil
	}
	return runErr
}

func (f *forwarder) acceptConnections(ctx context.Context, listener net.Listener) error {
	for {
		connection, err := listener.Accept()
		if err != nil {
			return err
		}

		f.wg.Add(1)
		go func() {
			defer f.wg.Done()
			f.handleConnection(ctx, connection)
		}()
	}
}

func (f *forwarder) handleConnection(ctx context.Context, local net.Conn) {
	defer local.Close()

	upstream, err := dialSOCKS5(
		ctx,
		f.config.socks5Address,
		f.config.databaseHost,
		f.config.databasePort,
		f.config.dialTimeout,
	)
	if err != nil {
		log.Printf("database proxy upstream connection failed: %v", err)
		return
	}
	defer upstream.Close()

	closeOnCancellation := make(chan struct{})
	defer close(closeOnCancellation)
	go func() {
		select {
		case <-ctx.Done():
			_ = local.Close()
			_ = upstream.Close()
		case <-closeOnCancellation:
		}
	}()

	if err := proxyBidirectionally(local, upstream); err != nil && !errors.Is(err, net.ErrClosed) {
		log.Printf("database proxy connection closed with error: %v", err)
	}
}

func proxyBidirectionally(local, upstream net.Conn) error {
	errorsFromCopies := make(chan error, 2)

	go func() {
		errorsFromCopies <- copyAndHalfClose(upstream, local)
	}()
	go func() {
		errorsFromCopies <- copyAndHalfClose(local, upstream)
	}()

	firstError := <-errorsFromCopies
	if firstError != nil {
		_ = local.Close()
		_ = upstream.Close()
	}
	secondError := <-errorsFromCopies

	if firstError != nil {
		return firstError
	}
	return secondError
}

func copyAndHalfClose(destination, source net.Conn) error {
	_, copyErr := io.Copy(destination, source)
	closeWriteErr := closeWrite(destination)
	if copyErr != nil {
		return copyErr
	}
	return closeWriteErr
}

func closeWrite(connection net.Conn) error {
	if halfCloser, ok := connection.(interface{ CloseWrite() error }); ok {
		return halfCloser.CloseWrite()
	}
	return nil
}

func (f *forwarder) healthHandler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("/healthz", f.healthz)
	return mux
}

func (f *forwarder) healthz(response http.ResponseWriter, request *http.Request) {
	if request.Method != http.MethodGet {
		response.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	if !f.ready.Load() {
		writeHealthResponse(response, http.StatusServiceUnavailable, map[string]any{
			"ok":     false,
			"reason": "forwarder_not_ready",
		})
		return
	}

	checkContext, cancel := context.WithTimeout(request.Context(), f.config.healthTimeout)
	defer cancel()
	connection, err := dialSOCKS5(
		checkContext,
		f.config.socks5Address,
		f.config.databaseHost,
		f.config.databasePort,
		f.config.healthTimeout,
	)
	if err != nil {
		writeHealthResponse(response, http.StatusServiceUnavailable, map[string]any{
			"ok":     false,
			"reason": "tailnet_destination_unreachable",
		})
		return
	}
	_ = connection.Close()

	writeHealthResponse(response, http.StatusOK, map[string]any{"ok": true})
}

func writeHealthResponse(response http.ResponseWriter, status int, body map[string]any) {
	response.Header().Set("Cache-Control", "no-store")
	response.Header().Set("Content-Type", "application/json")
	response.WriteHeader(status)
	if err := json.NewEncoder(response).Encode(body); err != nil {
		log.Printf("health response write failed: %v", err)
	}
}

func dialSOCKS5(ctx context.Context, proxyAddress, targetHost string, targetPort int, timeout time.Duration) (net.Conn, error) {
	dialer := net.Dialer{Timeout: timeout}
	connection, err := dialer.DialContext(ctx, "tcp", proxyAddress)
	if err != nil {
		return nil, fmt.Errorf("connect to SOCKS5 proxy %s: %w", proxyAddress, err)
	}

	deadline := time.Now().Add(timeout)
	if err := connection.SetDeadline(deadline); err != nil {
		_ = connection.Close()
		return nil, fmt.Errorf("set SOCKS5 handshake deadline: %w", err)
	}
	if err := negotiateSOCKS5(connection, targetHost, targetPort); err != nil {
		_ = connection.Close()
		return nil, err
	}
	if err := connection.SetDeadline(time.Time{}); err != nil {
		_ = connection.Close()
		return nil, fmt.Errorf("clear SOCKS5 handshake deadline: %w", err)
	}
	return connection, nil
}

func negotiateSOCKS5(connection io.ReadWriter, targetHost string, targetPort int) error {
	if targetPort < 1 || targetPort > 65535 {
		return fmt.Errorf("target port %d is outside the valid TCP port range", targetPort)
	}

	if err := writeAll(connection, []byte{socks5Version, 1, socks5NoAuthMethod}); err != nil {
		return fmt.Errorf("write SOCKS5 greeting: %w", err)
	}
	var greetingResponse [2]byte
	if _, err := io.ReadFull(connection, greetingResponse[:]); err != nil {
		return fmt.Errorf("read SOCKS5 greeting response: %w", err)
	}
	if greetingResponse[0] != socks5Version {
		return fmt.Errorf("SOCKS5 proxy returned unsupported version %d", greetingResponse[0])
	}
	if greetingResponse[1] != socks5NoAuthMethod {
		return fmt.Errorf("SOCKS5 proxy does not support unauthenticated connections")
	}

	addressType, address, err := socks5Address(targetHost)
	if err != nil {
		return err
	}
	request := []byte{socks5Version, socks5Connect, 0, addressType}
	request = append(request, address...)
	var portBytes [2]byte
	binary.BigEndian.PutUint16(portBytes[:], uint16(targetPort))
	request = append(request, portBytes[:]...)
	if err := writeAll(connection, request); err != nil {
		return fmt.Errorf("write SOCKS5 CONNECT request: %w", err)
	}

	var responseHeader [4]byte
	if _, err := io.ReadFull(connection, responseHeader[:]); err != nil {
		return fmt.Errorf("read SOCKS5 CONNECT response: %w", err)
	}
	if responseHeader[0] != socks5Version {
		return fmt.Errorf("SOCKS5 proxy returned unsupported response version %d", responseHeader[0])
	}
	if responseHeader[1] != 0 {
		return fmt.Errorf("SOCKS5 CONNECT request rejected with reply code %d", responseHeader[1])
	}
	if err := discardSOCKS5Address(connection, responseHeader[3]); err != nil {
		return fmt.Errorf("read SOCKS5 bound address: %w", err)
	}
	var boundPort [2]byte
	if _, err := io.ReadFull(connection, boundPort[:]); err != nil {
		return fmt.Errorf("read SOCKS5 bound port: %w", err)
	}
	return nil
}

func socks5Address(host string) (byte, []byte, error) {
	if ipAddress := net.ParseIP(host); ipAddress != nil {
		if ipv4Address := ipAddress.To4(); ipv4Address != nil {
			return socks5IPv4Address, ipv4Address, nil
		}
		return socks5IPv6Address, ipAddress.To16(), nil
	}

	if host == "" || len(host) > 255 {
		return 0, nil, errors.New("SOCKS5 target hostname must be between 1 and 255 bytes")
	}
	return socks5DomainAddress, append([]byte{byte(len(host))}, []byte(host)...), nil
}

func discardSOCKS5Address(reader io.Reader, addressType byte) error {
	var addressLength int
	switch addressType {
	case socks5IPv4Address:
		addressLength = net.IPv4len
	case socks5IPv6Address:
		addressLength = net.IPv6len
	case socks5DomainAddress:
		var length [1]byte
		if _, err := io.ReadFull(reader, length[:]); err != nil {
			return err
		}
		addressLength = int(length[0])
	default:
		return fmt.Errorf("SOCKS5 proxy returned unsupported address type %d", addressType)
	}

	address := make([]byte, addressLength)
	_, err := io.ReadFull(reader, address)
	return err
}

func writeAll(writer io.Writer, data []byte) error {
	for len(data) > 0 {
		written, err := writer.Write(data)
		if err != nil {
			return err
		}
		if written == 0 {
			return io.ErrShortWrite
		}
		data = data[written:]
	}
	return nil
}

func envPort(name string, defaultValue int) (int, error) {
	value := envOrDefault(name, strconv.Itoa(defaultValue))
	port, err := strconv.Atoi(value)
	if err != nil || port < 1 || port > 65535 {
		return 0, fmt.Errorf("%s must be a TCP port between 1 and 65535", name)
	}
	return port, nil
}

func envDuration(name string, defaultValue time.Duration) (time.Duration, error) {
	value := envOrDefault(name, defaultValue.String())
	duration, err := time.ParseDuration(value)
	if err != nil || duration <= 0 {
		return 0, fmt.Errorf("%s must be a positive duration such as 3s or 500ms", name)
	}
	return duration, nil
}

func envOrDefault(name, defaultValue string) string {
	if value := strings.TrimSpace(os.Getenv(name)); value != "" {
		return value
	}
	return defaultValue
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if trimmed := strings.TrimSpace(value); trimmed != "" {
			return trimmed
		}
	}
	return ""
}

