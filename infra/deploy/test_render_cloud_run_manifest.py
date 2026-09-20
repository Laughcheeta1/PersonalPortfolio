from __future__ import annotations

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parent))

from render_cloud_run_manifest import render


def deployment_values() -> dict[str, str]:
    return {
        "GCP_PROJECT_ID": "test-project",
        "GCP_REGION": "us-central1",
        "ARTIFACT_REGISTRY_REPOSITORY": "portfolio",
        "CLOUD_RUN_SERVICE": "personal-portfolio-backend",
        "GCP_SERVICE_ACCOUNT": "backend@test-project.iam.gserviceaccount.com",
        "BACKEND_IMAGE": (
            "us-central1-docker.pkg.dev/test-project/portfolio/"
            "personal-portfolio-backend:backend-tree"
        ),
        "TAILNET_PROXY_IMAGE": (
            "us-central1-docker.pkg.dev/test-project/portfolio/"
            "tailnet-db-proxy:tailnet-tree"
        ),
        "DATABASE_URL": (
            "postgresql+psycopg://user:password@100.78.221.58:5433/portfolio"
            "?sslmode=require"
        ),
        "TS_AUTHKEY": "tskey-auth-test",
        "TAILSCALE_DB_HOST": "100.78.221.58",
        "TAILSCALE_DB_PORT": "5433",
        "TAILSCALE_SOCKS_PORT": "1055",
        "LOCAL_DB_PROXY_PORT": "15432",
        "PROXY_HEALTH_PORT": "18080",
        "TS_HOSTNAME": "personal-portfolio-backend-cloud-run",
        "OLLAMA_BASE_URL": "https://ollama.com",
        "OLLAMA_MODEL": "gpt-oss:120b",
        "OLLAMA_API_KEY": "ollama-test-key",
        "OLLAMA_TIMEOUT_SECONDS": "60",
        "ALLOWED_CORS_ORIGIN": "https://laughcheeta1.github.io",
    }


def test_manifest_keeps_database_credentials_in_the_app_and_auth_key_in_sidecar() -> None:
    manifest = render(deployment_values())
    containers = {
        container["name"]: container
        for container in manifest["spec"]["template"]["spec"]["containers"]
    }
    app_environment = {item["name"]: item["value"] for item in containers["app"]["env"]}
    sidecar_environment = {
        item["name"]: item["value"] for item in containers["tailnet"]["env"]
    }

    assert (
        app_environment["DATABASE_URL"]
        == "postgresql+psycopg://user:password@127.0.0.1:15432/portfolio"
        "?sslmode=require"
    )
    assert "TS_AUTHKEY" not in app_environment
    assert sidecar_environment["TS_AUTHKEY"] == "tskey-auth-test"
    assert sidecar_environment["TS_USERSPACE"] == "true"
    assert sidecar_environment["TS_SOCKS5_SERVER"] == "127.0.0.1:1055"
    assert sidecar_environment["TAILSCALE_DB_HOST"] == "100.78.221.58"
    assert sidecar_environment["TAILSCALE_DB_PORT"] == "5433"
    assert sidecar_environment["TAILSCALE_SOCKS_PORT"] == "1055"
    assert sidecar_environment["LOCAL_DB_PROXY_PORT"] == "15432"
    assert sidecar_environment["PROXY_HEALTH_PORT"] == "18080"
    assert {
        "DATABASE_URL",
        "OLLAMA_BASE_URL",
        "OLLAMA_MODEL",
        "OLLAMA_API_KEY",
        "OLLAMA_TIMEOUT_SECONDS",
        "CORS_ORIGINS",
    } == set(app_environment)
    assert manifest["spec"]["template"]["metadata"]["annotations"][
        "run.googleapis.com/container-dependencies"
    ] == '{"app":["tailnet"]}'


def test_manifest_uses_requested_cloud_run_resources_and_scaling() -> None:
    manifest = render(deployment_values())
    template = manifest["spec"]["template"]
    template_spec = template["spec"]
    annotations = template["metadata"]["annotations"]
    service_annotations = manifest["metadata"]["annotations"]
    containers = {
        container["name"]: container for container in template_spec["containers"]
    }

    assert containers["app"]["resources"]["limits"] == {
        "cpu": "0.75",
        "memory": "512Mi",
    }
    assert containers["tailnet"]["resources"]["limits"] == {
        "cpu": "0.25",
        "memory": "256Mi",
    }
    assert float(containers["app"]["resources"]["limits"]["cpu"]) + float(
        containers["tailnet"]["resources"]["limits"]["cpu"]
    ) >= 1
    assert template_spec["containerConcurrency"] == 1
    assert template_spec["timeoutSeconds"] == 300
    assert service_annotations["run.googleapis.com/minScale"] == "0"
    assert service_annotations["run.googleapis.com/maxScale"] == "1"
    assert annotations["run.googleapis.com/execution-environment"] == "gen1"
    assert annotations["run.googleapis.com/cpu-throttling"] == "true"
    assert annotations["run.googleapis.com/startup-cpu-boost"] == "false"
    assert "autoscaling.knative.dev/maxScale" not in annotations
    assert "autoscaling.knative.dev/minScale" not in annotations


def test_manifest_uses_exact_images_and_preserves_health_probes() -> None:
    values = deployment_values()
    manifest = render(values)
    containers = {
        container["name"]: container
        for container in manifest["spec"]["template"]["spec"]["containers"]
    }

    assert containers["app"]["image"] == values["BACKEND_IMAGE"]
    assert containers["tailnet"]["image"] == values["TAILNET_PROXY_IMAGE"]
    assert containers["app"]["startupProbe"]["httpGet"] == {
        "path": "/healthz",
        "port": 8080,
    }
    assert containers["app"]["livenessProbe"]["httpGet"]["port"] == 8080
    assert containers["tailnet"]["startupProbe"]["httpGet"]["port"] == 18080
    assert containers["tailnet"]["livenessProbe"]["httpGet"]["port"] == 18080


def test_missing_required_deployment_setting_fails_clearly() -> None:
    values = deployment_values()
    del values["OLLAMA_MODEL"]

    with pytest.raises(SystemExit, match="Missing deployment setting: OLLAMA_MODEL"):
        render(values)
