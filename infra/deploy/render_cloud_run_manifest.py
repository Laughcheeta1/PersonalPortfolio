#!/usr/bin/env python3
"""Render the portfolio backend's Cloud Run app + Tailscale sidecar service."""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit


def parse_env_file(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    if not path.is_file():
        return values
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        name, value = line.split("=", 1)
        name = name.strip()
        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in {'"', "'"}:
            value = value[1:-1]
        values[name] = value
    return values


def setting(values: dict[str, str], name: str, default: str | None = None) -> str:
    value = os.environ.get(name, values.get(name, default))
    if value is None or not value.strip():
        raise SystemExit(f"Missing deployment setting: {name}")
    return value.strip()


def optional_setting(values: dict[str, str], name: str, default: str) -> str:
    return os.environ.get(name, values.get(name, default)).strip()


def rewrite_database_url(database_url: str, local_port: str) -> str:
    parsed = urlsplit(database_url)
    if not parsed.scheme or not parsed.netloc:
        raise SystemExit("DATABASE_URL must be a valid SQLAlchemy URL")

    user_info = ""
    if "@" in parsed.netloc:
        user_info = parsed.netloc.rsplit("@", 1)[0] + "@"

    return urlunsplit(
        parsed._replace(netloc=f"{user_info}127.0.0.1:{local_port}")
    )


def env_entry(name: str, value: str) -> dict[str, str]:
    return {"name": name, "value": value}


def probe(path: str, port: int, *, period: int, timeout: int, failures: int) -> dict:
    return {
        "httpGet": {"path": path, "port": port},
        "periodSeconds": period,
        "timeoutSeconds": timeout,
        "failureThreshold": failures,
    }


def render(values: dict[str, str]) -> dict:
    project = setting(values, "GCP_PROJECT_ID")
    region = setting(values, "GCP_REGION")
    service = setting(values, "CLOUD_RUN_SERVICE")
    service_account = setting(values, "GCP_SERVICE_ACCOUNT")
    repository = setting(values, "ARTIFACT_REGISTRY_REPOSITORY")
    image_tag = optional_setting(values, "IMAGE_TAG", "local")
    backend_name = optional_setting(values, "BACKEND_IMAGE_NAME", "personal-portfolio-backend")
    proxy_name = optional_setting(values, "TAILNET_PROXY_IMAGE_NAME", "tailnet-db-proxy")
    image_prefix = f"{region}-docker.pkg.dev/{project}/{repository}"
    backend_image = optional_setting(
        values, "BACKEND_IMAGE", f"{image_prefix}/{backend_name}:{image_tag}"
    )
    proxy_image = optional_setting(
        values, "TAILNET_PROXY_IMAGE", f"{image_prefix}/{proxy_name}:{image_tag}"
    )

    local_db_proxy_port = setting(values, "LOCAL_DB_PROXY_PORT")
    health_port = int(setting(values, "PROXY_HEALTH_PORT"))
    socks_port = setting(values, "TAILSCALE_SOCKS_PORT")
    cors_origin = setting(values, "ALLOWED_CORS_ORIGIN")
    if not cors_origin.startswith("https://") or "/" in cors_origin.removeprefix("https://"):
        raise SystemExit("ALLOWED_CORS_ORIGIN must be an HTTPS origin without a path")

    database_url = rewrite_database_url(setting(values, "DATABASE_URL"), local_db_proxy_port)
    tailscale_hostname = optional_setting(
        values, "TS_HOSTNAME", f"{service}-cloud-run"
    )
    tailnet_db_host = setting(values, "TAILSCALE_DB_HOST")
    tailnet_db_port = setting(values, "TAILSCALE_DB_PORT")
    ts_authkey = setting(values, "TS_AUTHKEY")

    app_environment = [
        env_entry("DATABASE_URL", database_url),
        env_entry("OLLAMA_BASE_URL", setting(values, "OLLAMA_BASE_URL")),
        env_entry("OLLAMA_MODEL", setting(values, "OLLAMA_MODEL")),
        env_entry("OLLAMA_API_KEY", setting(values, "OLLAMA_API_KEY")),
        env_entry("OLLAMA_TIMEOUT_SECONDS", setting(values, "OLLAMA_TIMEOUT_SECONDS")),
        env_entry("CORS_ORIGINS", json.dumps([cors_origin], separators=(",", ":"))),
    ]
    sidecar_environment = [
        env_entry("TS_AUTHKEY", ts_authkey),
        env_entry("TS_USERSPACE", "true"),
        env_entry("TS_HOSTNAME", tailscale_hostname),
        env_entry("TS_SOCKS5_SERVER", f"127.0.0.1:{socks_port}"),
        env_entry("TAILSCALE_SOCKS_PORT", socks_port),
        env_entry("TAILSCALE_DB_HOST", tailnet_db_host),
        env_entry("TAILSCALE_DB_PORT", tailnet_db_port),
        env_entry("LOCAL_DB_PROXY_PORT", local_db_proxy_port),
        env_entry("PROXY_HEALTH_PORT", str(health_port)),
    ]

    return {
        "apiVersion": "serving.knative.dev/v1",
        "kind": "Service",
        "metadata": {"name": service},
        "spec": {
            "template": {
                "metadata": {
                    "annotations": {
                        "run.googleapis.com/container-dependencies": json.dumps(
                            {"app": ["tailnet"]}, separators=(",", ":")
                        ),
                        "run.googleapis.com/startup-cpu-boost": "true",
                    }
                },
                "spec": {
                    "containerConcurrency": 80,
                    "timeoutSeconds": 300,
                    "serviceAccountName": service_account,
                    "containers": [
                        {
                            "name": "app",
                            "image": backend_image,
                            "ports": [{"name": "http1", "containerPort": 8080}],
                            "env": app_environment,
                            "resources": {"limits": {"cpu": "1", "memory": "512Mi"}},
                            "startupProbe": probe(
                                "/healthz", 8080, period=5, timeout=3, failures=48
                            ),
                            "livenessProbe": probe(
                                "/healthz", 8080, period=30, timeout=5, failures=3
                            ),
                        },
                        {
                            "name": "tailnet",
                            "image": proxy_image,
                            "env": sidecar_environment,
                            "resources": {"limits": {"cpu": "1", "memory": "256Mi"}},
                            "startupProbe": probe(
                                "/healthz",
                                health_port,
                                period=2,
                                timeout=1,
                                failures=60,
                            ),
                            "livenessProbe": probe(
                                "/healthz",
                                health_port,
                                period=30,
                                timeout=2,
                                failures=3,
                            ),
                        },
                    ],
                },
            }
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--env-file", type=Path, default=Path("backend/.env.deploy")
    )
    parser.add_argument("--output", type=Path, required=True)
    arguments = parser.parse_args()

    values = parse_env_file(arguments.env_file)
    manifest = render(values)
    arguments.output.parent.mkdir(parents=True, exist_ok=True)
    arguments.output.write_text(
        json.dumps(manifest, indent=2) + "\n", encoding="utf-8"
    )


if __name__ == "__main__":
    main()
