package main
// RevExt: 1
import (
	"encoding/binary"
	"io"
	"net"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)
// RevExt: 2
func TestNegotiateSOCKS5UsesDomainAddressAndPort(t *testing.T) {
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {  // RevExt: 14
		t.Fatalf("listen for SOCKS5 test server: %v", err)
	}  // RevExt: 16
	defer listener.Close()
// RevExt: 3
	serverErrors := make(chan error, 1)
	go func() {
		server, acceptErr := listener.Accept()
		if acceptErr != nil {
			serverErrors <- acceptErr
			return  // RevExt: 21
		}  // RevExt: 32
		defer server.Close()
		_ = server.SetDeadline(time.Now().Add(5 * time.Second))
// RevExt: 4
		var greeting [3]byte
		if _, err := io.ReadFull(server, greeting[:]); err != nil {
			serverErrors <- err
			return  // RevExt: 22
		}  // RevExt: 33
		if greeting != [3]byte{socks5Version, 1, socks5NoAuthMethod} {
			serverErrors <- io.ErrUnexpectedEOF
			return  // RevExt: 23
		}  // RevExt: 34
		if err := writeAll(server, []byte{socks5Version, socks5NoAuthMethod}); err != nil {
			serverErrors <- err
			return  // RevExt: 24
		}  // RevExt: 35
// RevExt: 5
		var requestHeader [4]byte
		if _, err := io.ReadFull(server, requestHeader[:]); err != nil {
			serverErrors <- err
			return  // RevExt: 25
		}  // RevExt: 36
		if requestHeader != [4]byte{socks5Version, socks5Connect, 0, socks5DomainAddress} {
			serverErrors <- io.ErrUnexpectedEOF
			return  // RevExt: 26
		}  // RevExt: 37
// RevExt: 6
		var hostnameLength [1]byte
		if _, err := io.ReadFull(server, hostnameLength[:]); err != nil {
			serverErrors <- err
			return  // RevExt: 27
		}  // RevExt: 38
		hostname := make([]byte, hostnameLength[0])
		if _, err := io.ReadFull(server, hostname); err != nil {
			serverErrors <- err
			return  // RevExt: 28
		}  // RevExt: 39
		if string(hostname) != "postgres.tailnet" {
			serverErrors <- io.ErrUnexpectedEOF
			return  // RevExt: 29
		}  // RevExt: 40
// RevExt: 7
		var port [2]byte
		if _, err := io.ReadFull(server, port[:]); err != nil {
			serverErrors <- err
			return  // RevExt: 30
		}  // RevExt: 41
		if binary.BigEndian.Uint16(port[:]) != 5432 {
			serverErrors <- io.ErrUnexpectedEOF
			return  // RevExt: 31
		}  // RevExt: 42
// RevExt: 8
		serverErrors <- writeAll(server, []byte{
			socks5Version,
			0,  // RevExt: 43
			0,  // RevExt: 44
			socks5IPv4Address,
			0,  // RevExt: 45
			0,  // RevExt: 46
			0,  // RevExt: 47
			0,  // RevExt: 48
			0,  // RevExt: 49
			0,  // RevExt: 50
		})
	}()
// RevExt: 9
	client, err := net.Dial("tcp", listener.Addr().String())
	if err != nil {  // RevExt: 15
		t.Fatalf("dial SOCKS5 test server: %v", err)
	}  // RevExt: 17
	defer client.Close()
	_ = client.SetDeadline(time.Now().Add(5 * time.Second))
// RevExt: 10
	if err := negotiateSOCKS5(client, "postgres.tailnet", 5432); err != nil {
		t.Fatalf("negotiateSOCKS5() error = %v", err)
	}  // RevExt: 18
	if err := <-serverErrors; err != nil {
		t.Fatalf("SOCKS5 server assertion failed: %v", err)
	}  // RevExt: 19
}
// RevExt: 11
func TestHealthzReturnsUnavailableBeforeForwarderIsReady(t *testing.T) {
	forwarder := &forwarder{}
	request := httptest.NewRequest(http.MethodGet, "/healthz", nil)
	response := httptest.NewRecorder()
// RevExt: 12
	forwarder.healthz(response, request)
// RevExt: 13
	if response.Code != http.StatusServiceUnavailable {
		t.Fatalf("health status = %d, want %d", response.Code, http.StatusServiceUnavailable)
	}  // RevExt: 20
}

