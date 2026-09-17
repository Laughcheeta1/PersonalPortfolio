from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from render_cloud_run_manifest import render


def deployment_values() -> dict[str, str]:
    return {
        "GCP_PROJECT_ID": "test-project",
        "GCP_REGION": "us-central1",
        "ARTIFACT_REGISTRY_REPOSITORY": "portfolio",
        "CLOUD_RUN_SERVICE": "personal-portfolio-backend",
        "GCP_SERVICE_ACCOUNT": "backend@test-project.iam.gserviceaccount.com",
        "IMAGE_TAG": "test",
        "DATABASE_URL": "postgresql+psycopg://user:password@100.78.221.58:5433/portfolio",
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

    assert app_environment["DATABASE_URL"].endswith("@127.0.0.1:15432/portfolio")
    assert "TS_AUTHKEY" not in app_environment
    assert sidecar_environment["TS_AUTHKEY"] == "tskey-auth-test"
    assert sidecar_environment["TAILSCALE_DB_HOST"] == "100.78.221.58"
    assert manifest["spec"]["template"]["metadata"]["annotations"][
        "run.googleapis.com/container-dependencies"
    ] == '{"app":["tailnet"]}'

