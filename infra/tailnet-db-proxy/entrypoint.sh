#!/usr/bin/env bash
set -Eeuo pipefail

if [[ -z "${TS_AUTHKEY:-}" && -n "${TAILSCALE_AUTHKEY:-}" ]]; then
  TS_AUTHKEY="$TAILSCALE_AUTHKEY"
fi
: "${TS_AUTHKEY:?TS_AUTHKEY must be provided in the owning service .env.deploy}"
: "${TAILSCALE_DB_HOST:?TAILSCALE_DB_HOST must be set}"

if [[ "${TS_USERSPACE:-true}" != "true" ]]; then
  echo "TS_USERSPACE must remain true for Cloud Run; kernel-mode Tailscale requires /dev/net/tun" >&2
  exit 1
fi

TS_SOCKET="${TS_SOCKET:-/var/run/tailscale/tailscaled.sock}"
TS_STATE_DIR="${TS_STATE_DIR:-/var/lib/tailscale}"
TS_SOCKS5_SERVER="${TS_SOCKS5_SERVER:-127.0.0.1:${TAILSCALE_SOCKS_PORT:-1055}}"
TS_HOSTNAME="${TS_HOSTNAME:-tailnet-db-proxy-${HOSTNAME:-instance}}"
TS_STARTUP_TIMEOUT_SECONDS="${TS_STARTUP_TIMEOUT_SECONDS:-120}"

if [[ ! "$TS_STARTUP_TIMEOUT_SECONDS" =~ ^[1-9][0-9]*$ ]]; then
  echo "TS_STARTUP_TIMEOUT_SECONDS must be a positive integer" >&2
  exit 1
fi

export TS_SOCKET TS_STATE_DIR TS_SOCKS5_SERVER TS_HOSTNAME

mkdir -p "$(dirname "$TS_SOCKET")" "$TS_STATE_DIR"
chmod 0700 "$(dirname "$TS_SOCKET")" "$TS_STATE_DIR"

tailscaled_args=(
  --tun=userspace-networking
  --socket="$TS_SOCKET"
  --statedir="$TS_STATE_DIR"
  --socks5-server="$TS_SOCKS5_SERVER"
)

if [[ -n "${TS_TAILSCALED_EXTRA_ARGS:-}" ]]; then
  read -r -a tailscaled_extra_args <<< "$TS_TAILSCALED_EXTRA_ARGS"
  tailscaled_args+=("${tailscaled_extra_args[@]}")
fi

/usr/local/bin/tailscaled "${tailscaled_args[@]}" &
tailscaled_pid=$!
forwarder_pid=""

cleanup() {
  local exit_status=$?
  trap - EXIT INT TERM

  for child_pid in "$forwarder_pid" "$tailscaled_pid"; do
    if [[ -n "$child_pid" ]] && kill -0 "$child_pid" 2>/dev/null; then
      kill -TERM "$child_pid" 2>/dev/null || true
    fi
  done

  for child_pid in "$forwarder_pid" "$tailscaled_pid"; do
    if [[ -n "$child_pid" ]]; then
      wait "$child_pid" 2>/dev/null || true
    fi
  done

  exit "$exit_status"
}

trap cleanup EXIT
trap 'exit 143' INT TERM

startup_deadline=$((SECONDS + TS_STARTUP_TIMEOUT_SECONDS))
until /usr/local/bin/tailscale --socket="$TS_SOCKET" status --json >/dev/null 2>&1; do
  if ! kill -0 "$tailscaled_pid" 2>/dev/null; then
    echo "tailscaled exited before its local API became available" >&2
    exit 1
  fi
  if ((SECONDS >= startup_deadline)); then
    echo "timed out waiting for tailscaled local API" >&2
    exit 1
  fi
  sleep 1
done

tailscale_up_args=(
  --socket="$TS_SOCKET"
  up
  --auth-key="$TS_AUTHKEY"
  --hostname="$TS_HOSTNAME"
  --accept-dns=false
)

if [[ -n "${TS_EXTRA_ARGS:-}" ]]; then
  read -r -a tailscale_extra_args <<< "$TS_EXTRA_ARGS"
  tailscale_up_args+=("${tailscale_extra_args[@]}")
fi

# The auth key is deliberately never echoed. Prefer an ephemeral key in the
# Tailscale admin console so each Cloud Run instance is removed automatically.
/usr/local/bin/tailscale "${tailscale_up_args[@]}"

/usr/local/bin/tailnet-db-proxy &
forwarder_pid=$!

if wait -n "$tailscaled_pid" "$forwarder_pid"; then
  child_status=0
else
  child_status=$?
fi

if kill -0 "$tailscaled_pid" 2>/dev/null; then
  echo "tailnet-db-proxy exited; stopping tailscaled" >&2
else
  echo "tailscaled exited; stopping tailnet-db-proxy" >&2
fi

if ((child_status == 0)); then
  exit 1
fi
exit "$child_status"

