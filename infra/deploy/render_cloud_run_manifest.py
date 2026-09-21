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


def resolve_image(
    values: dict[str, str],
    name: str,
    tag_name: str,
    image_prefix: str,
    image_name: str,
) -> str:
    image = os.environ.get(name, values.get(name))
    if image is not None and image.strip():
        return image.strip()
    tag = optional_setting(values, tag_name, "local")
    return f"{image_prefix}/{image_name}:{tag}"


def positive_port(values: dict[str, str], name: str) -> str:
    value = setting(values, name)
    try:
        port = int(value)
    except ValueError as exc:
        raise SystemExit(f"{name} must be a positive integer") from exc
    if not 1 <= port <= 65535:
        raise SystemExit(f"{name} must be between 1 and 65535")
    return str(port)


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
    image_prefix = f"{region}-docker.pkg.dev/{project}/{repository}"
    backend_image = resolve_image(
        values,
        "BACKEND_IMAGE",
        "BACKEND_IMAGE_TAG",
        image_prefix,
        "personal-portfolio-backend",
    )
    proxy_image = resolve_image(
        values,
        "TAILNET_PROXY_IMAGE",
        "TAILNET_IMAGE_TAG",
        image_prefix,
        "tailnet-db-proxy",
    )

    local_db_proxy_port = positive_port(values, "LOCAL_DB_PROXY_PORT")
    health_port = int(positive_port(values, "PROXY_HEALTH_PORT"))
    socks_port = positive_port(values, "TAILSCALE_SOCKS_PORT")
    cors_origin = setting(values, "ALLOWED_CORS_ORIGIN")
    parsed_cors_origin = urlsplit(cors_origin)
    if (
        parsed_cors_origin.scheme != "https"
        or not parsed_cors_origin.netloc
        or parsed_cors_origin.path
        or parsed_cors_origin.query
        or parsed_cors_origin.fragment
    ):
        raise SystemExit("ALLOWED_CORS_ORIGIN must be an HTTPS origin without a path")

    database_url = rewrite_database_url(setting(values, "DATABASE_URL"), local_db_proxy_port)
    tailscale_hostname = optional_setting(
        values, "TS_HOSTNAME", f"{service}-cloud-run"
    )
    tailnet_db_host = setting(values, "TAILSCALE_DB_HOST")
    tailnet_db_port = positive_port(values, "TAILSCALE_DB_PORT")
    ts_authkey = setting(values, "TS_AUTHKEY")
    ollama_timeout_seconds = setting(values, "OLLAMA_TIMEOUT_SECONDS")
    try:
        if float(ollama_timeout_seconds) <= 0:
            raise ValueError
    except ValueError as exc:
        raise SystemExit("OLLAMA_TIMEOUT_SECONDS must be positive") from exc

    app_environment = [
        env_entry("DATABASE_URL", database_url),
        env_entry("OLLAMA_BASE_URL", setting(values, "OLLAMA_BASE_URL")),
        env_entry("OLLAMA_MODEL", setting(values, "OLLAMA_MODEL")),
        env_entry("OLLAMA_API_KEY", setting(values, "OLLAMA_API_KEY")),
        env_entry("OLLAMA_TIMEOUT_SECONDS", ollama_timeout_seconds),
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
        "metadata": {
            "name": service,
            "annotations": {
                "run.googleapis.com/minScale": "0",
                "run.googleapis.com/maxScale": "1",
            },
        },
        "spec": {
            "template": {
                "metadata": {
                    "annotations": {
                        "run.googleapis.com/container-dependencies": json.dumps(
                            {"app": ["tailnet"]}, separators=(",", ":")
                        ),
                        "run.googleapis.com/cpu-throttling": "true",
                        "run.googleapis.com/execution-environment": "gen1",
                        "run.googleapis.com/startup-cpu-boost": "false",
                    }
                },
                "spec": {
                    "containerConcurrency": 1,
                    "timeoutSeconds": 300,
                    "serviceAccountName": service_account,
                    "containers": [
                        {
                            "name": "app",
                            "image": backend_image,
                            "ports": [{"name": "http1", "containerPort": 8080}],
                            "env": app_environment,
                            "resources": {
                                "limits": {"cpu": "0.75", "memory": "512Mi"}
                            },
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
                            "resources": {
                                "limits": {"cpu": "0.25", "memory": "256Mi"}
                            },
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
        json.dumps(manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8"
    )


if __name__ == "__main__":
    main()
