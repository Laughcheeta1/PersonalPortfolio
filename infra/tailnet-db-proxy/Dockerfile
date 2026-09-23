# syntax=docker/dockerfile:1.7

ARG GO_VERSION=1.24.6
ARG GO_ALPINE_VERSION=3.22
ARG RUNTIME_ALPINE_VERSION=3.22.2
ARG TAILSCALE_VERSION=1.102.4

FROM golang:${GO_VERSION}-alpine${GO_ALPINE_VERSION} AS builder

WORKDIR /src

COPY go.mod ./
RUN go mod download

COPY main.go ./

ARG TARGETOS
ARG TARGETARCH
RUN CGO_ENABLED=0 \
    GOOS="${TARGETOS:-linux}" \
    GOARCH="${TARGETARCH:-amd64}" \
    go build \
      -trimpath \
      -ldflags="-s -w" \
      -o /out/tailnet-db-proxy \
      .

FROM docker.io/tailscale/tailscale:v${TAILSCALE_VERSION} AS tailscale

FROM alpine:${RUNTIME_ALPINE_VERSION}

RUN apk add --no-cache bash ca-certificates

COPY --from=builder /out/tailnet-db-proxy /usr/local/bin/tailnet-db-proxy
COPY --from=tailscale /usr/local/bin/tailscale /usr/local/bin/tailscale
COPY --from=tailscale /usr/local/bin/tailscaled /usr/local/bin/tailscaled
COPY entrypoint.sh /usr/local/bin/tailnet-db-proxy-entrypoint

RUN chmod 0755 /usr/local/bin/tailnet-db-proxy \
      /usr/local/bin/tailnet-db-proxy-entrypoint \
    && mkdir -p /var/run/tailscale /var/lib/tailscale \
    && chmod 0700 /var/run/tailscale /var/lib/tailscale

# Cloud Run has no /dev/net/tun. The entrypoint enforces userspace mode and
# publishes the SOCKS5 proxy only on the shared container loopback interface.
ENV TS_USERSPACE=true \
    TS_SOCKET=/var/run/tailscale/tailscaled.sock \
    TS_STATE_DIR=/var/lib/tailscale \
    TS_SOCKS5_SERVER=127.0.0.1:1055 \
    LOCAL_DB_PROXY_ADDR=127.0.0.1 \
    LOCAL_DB_PROXY_PORT=15432 \
    PROXY_HEALTH_ADDR=0.0.0.0 \
    PROXY_HEALTH_PORT=18080

STOPSIGNAL SIGTERM
ENTRYPOINT ["/usr/local/bin/tailnet-db-proxy-entrypoint"]

