# Cloud Run Tailscale database sidecar

This image follows the userspace-networking pattern used by the deployment
reference repository. It starts `tailscaled` without a kernel TUN device,
authenticates the ephemeral Cloud Run instance to Tailscale, and exposes a
local TCP database proxy.

The application connects to `127.0.0.1:${LOCAL_DB_PROXY_PORT}`. The sidecar
forwards that stream through its local SOCKS5 listener to
`${TAILSCALE_DB_HOST}:${TAILSCALE_DB_PORT}` on the tailnet. `TS_AUTHKEY` is
sidecar-only and must never be passed to the application container.

`/healthz` checks both the forwarder and the configured tailnet destination,
so Cloud Run starts the application only after the database path is reachable.
