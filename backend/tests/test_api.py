import json
from collections.abc import Mapping, Sequence
from typing import Any

import httpx
import pytest

from app.config import Settings
from app.main import create_app
from app.providers.ollama import OllamaProvider


class FakeProvider:
    def __init__(self, response: str) -> None:
        self.response = response
        self.messages: Sequence[Mapping[str, str]] = []
        self.response_format: Mapping[str, Any] | None = None

    async def complete(
        self,
        messages: Sequence[Mapping[str, str]],
        *,
        response_format: Mapping[str, Any] | None = None,
    ) -> str:
        self.messages = messages
        self.response_format = response_format
        return self.response


def client_for(provider: FakeProvider) -> httpx.AsyncClient:
    app = create_app(
        provider=provider,
        settings=Settings(cors_origins=[]),
    )
    return httpx.AsyncClient(
        transport=httpx.ASGITransport(app=app),
        base_url="http://testserver",
    )


@pytest.mark.asyncio
async def test_health_and_panel_routes() -> None:
    provider = FakeProvider("{}")
    async with client_for(provider) as client:
        health = await client.get("/health")
        library = await client.get("/api/panels/pergamon-library:front")
        projects = await client.get("/api/panels/starship:front")
        missing = await client.get("/api/panels/unknown:front")

    assert health.json() == {"status": "ok"}
    assert library.status_code == 200
    assert library.json()["type"] == "html"
    assert "Empire construction in progress, you will know it in the news" in library.json()["html"]
    assert "NAO Aeronautics" in projects.json()["html"]
    assert missing.status_code == 404


@pytest.mark.asyncio
async def test_chat_route_validates_structured_provider_reply() -> None:
    provider = FakeProvider(
        json.dumps(
            {
                "message": "Let's head to the projects.",
                "destination_object_id": "starship",
            }
        )
    )
    async with client_for(provider) as client:
        response = await client.post(
            "/api/chat",
            json={"messages": [{"role": "user", "content": "Show me projects"}]},
        )

    assert response.status_code == 200
    assert response.json()["destination_object_id"] == "starship"
    assert provider.response_format is not None
    assert provider.messages[0]["role"] == "system"
    assert "NAO Aeronautics" in provider.messages[0]["content"]


@pytest.mark.asyncio
async def test_chat_route_rejects_invalid_provider_destination() -> None:
    provider = FakeProvider(
        json.dumps({"message": "Somewhere", "destination_object_id": "unknown"})
    )
    async with client_for(provider) as client:
        response = await client.post(
            "/api/chat",
            json={"messages": [{"role": "user", "content": "Go somewhere"}]},
        )

    assert response.status_code == 502


@pytest.mark.asyncio
async def test_ollama_provider_uses_structured_chat_request() -> None:
    async def handler(request: httpx.Request) -> httpx.Response:
        payload = json.loads(request.content)
        assert request.url.path == "/api/chat"
        assert payload["model"] == "llama3.2"
        assert payload["stream"] is False
        assert payload["format"] == {"type": "object"}
        return httpx.Response(
            200,
            json={"message": {"content": '{"message":"Hi","destination_object_id":null}'}},
        )

    transport = httpx.MockTransport(handler)
    async with httpx.AsyncClient(transport=transport, base_url="http://ollama") as client:
        provider = OllamaProvider(
            base_url="http://ollama",
            model="llama3.2",
            client=client,
        )
        response = await provider.complete(
            [{"role": "user", "content": "Hello"}],
            response_format={"type": "object"},
        )

    assert response == '{"message":"Hi","destination_object_id":null}'
