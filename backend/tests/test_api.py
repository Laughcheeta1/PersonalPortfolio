import json
from collections.abc import Mapping, Sequence
from typing import Any

import httpx
import pytest
from pydantic import BaseModel

from app.chat import PortfolioChat
from app.config import Settings
from app.main import create_app
from app.providers.base import ProviderUnavailable
from app.providers.ollama import OllamaProvider
from app.schemas import ChatReply


class FakeProvider:
    def __init__(self, response: str) -> None:
        self.response = response
        self.messages: Sequence[Mapping[str, str]] = []
        self.response_model: type[BaseModel] | None = None

    async def complete(
        self,
        messages: Sequence[Mapping[str, str]],
        *,
        response_model: type[BaseModel] | None = None,
    ) -> str:
        self.messages = messages
        self.response_model = response_model
        return self.response


def client_for(
    provider: FakeProvider,
    *,
    cors_origins: list[str] | None = None,
) -> httpx.AsyncClient:
    app = create_app(
        provider=provider,
        settings=Settings(cors_origins=[] if cors_origins is None else cors_origins),
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
        secret = await client.get("/api/panels/starship:back")
        missing = await client.get("/api/panels/unknown:front")

    assert health.json() == {"status": "ok"}
    assert library.status_code == 200
    assert library.headers["content-type"].startswith("text/html")
    assert "Empire construction in progress" in library.text
    assert "NAO Aeronautics" in projects.text
    assert "Legal_IA" in projects.text
    assert "Review VS Code Extension" in projects.text
    assert "No astronauts were harmed" in secret.text
    assert "Legal_IA" not in secret.text
    assert missing.status_code == 404


@pytest.mark.asyncio
async def test_cors_allows_only_the_configured_origin() -> None:
    allowed_origin = "https://allowed.example"
    provider = FakeProvider("{}")
    preflight_headers = {
        "Origin": allowed_origin,
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type",
    }
    async with client_for(provider, cors_origins=[allowed_origin]) as client:
        allowed = await client.options("/api/chat", headers=preflight_headers)
        blocked = await client.options(
            "/api/chat",
            headers={**preflight_headers, "Origin": "https://blocked.example"},
        )

    assert allowed.status_code == 200
    assert allowed.headers["access-control-allow-origin"] == allowed_origin
    assert blocked.status_code == 400
    assert "access-control-allow-origin" not in blocked.headers


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
    assert provider.response_model is ChatReply
    assert provider.messages[0]["role"] == "system"
    assert "<portfolio_guide>" in provider.messages[0]["content"]
    assert "NAO Aeronautics" in provider.messages[0]["content"]
    assert "Legal_IA" in provider.messages[0]["content"]
    assert "Review VS Code Extension" in provider.messages[0]["content"]
    assert "do not append category" in provider.messages[0]["content"]
    assert "<conversation_messages>" in provider.messages[1]["content"]


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("message", "destination", "expected"),
    [
        (
            "¡Claro! Vamos al Starship, donde podrás explorar los proyectos de Santiago.",
            "starship",
            "¡Claro! Vamos al Starship.",
        ),
        (
            "Sure! Heading to the Work (F22) area where Santiago's companies, entrepreneurship, and independent work are showcased.",
            "f22",
            "Sure! Heading to the Work (F22) area.",
        ),
        (
            "¡Vamos! Te llevo al monumento Victory Statue donde están los honores y premios de Santiago.",
            "victory-statue",
            "¡Vamos! Te llevo al monumento Victory Statue.",
        ),
        (
            "Absolutely! Let’s walk over to the Pergamon Library—your gateway to Santiago's knowledge and achievements.",
            "pergamon-library",
            "Absolutely! Let’s walk over to the Pergamon Library.",
        ),
    ],
)
async def test_chat_route_removes_navigation_explanations(
    message: str,
    destination: str,
    expected: str,
) -> None:
    provider = FakeProvider(
        json.dumps({"message": message, "destination_object_id": destination})
    )
    async with client_for(provider) as client:
        response = await client.post(
            "/api/chat",
            json={"messages": [{"role": "user", "content": "Take me there"}]},
        )

    assert response.status_code == 200
    assert response.json()["message"] == expected
    assert response.json()["destination_object_id"] == destination


def test_structured_chat_reply_is_sanitized() -> None:
    reply = PortfolioChat._parse_reply(
        ChatReply(
            message="Absolutely! Let’s walk over to the Pergamon Library—your gateway to Santiago's knowledge and achievements.",
            destination_object_id="pergamon-library",
        )
    )

    assert reply == ChatReply(
        message="Absolutely! Let’s walk over to the Pergamon Library.",
        destination_object_id="pergamon-library",
    )


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
async def test_chat_route_rejects_oversized_messages() -> None:
    provider = FakeProvider(json.dumps({"message": "No", "destination_object_id": None}))
    async with client_for(provider) as client:
        response = await client.post(
            "/api/chat",
            json={"messages": [{"role": "user", "content": "x" * 301}]},
        )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_chat_route_rejects_more_than_ten_user_messages() -> None:
    provider = FakeProvider(json.dumps({"message": "No", "destination_object_id": None}))
    async with client_for(provider) as client:
        response = await client.post(
            "/api/chat",
            json={
                "messages": [
                    {"role": "user", "content": f"Question {index}"}
                    for index in range(11)
                ]
            },
        )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_ollama_provider_uses_langchain_structured_output() -> None:
    class FakeRunnable:
        def __init__(self) -> None:
            self.messages: list[tuple[str, str]] = []

        async def ainvoke(self, messages: list[tuple[str, str]]) -> ChatReply:
            self.messages = messages
            return ChatReply(message="Hi")

    class FakeChatModel:
        def __init__(self) -> None:
            self.schema: Mapping[str, Any] | None = None
            self.method: str | None = None
            self.runnable = FakeRunnable()

        def with_structured_output(
            self,
            schema: type[BaseModel] | Mapping[str, Any],
            *,
            method: str,
        ) -> FakeRunnable:
            self.schema = schema
            self.method = method
            return self.runnable

        async def ainvoke(self, messages: list[tuple[str, str]]) -> Any:
            return await self.runnable.ainvoke(messages)

    chat_model = FakeChatModel()
    provider = OllamaProvider(
        base_url="http://ollama",
        model="llama3.2",
        chat_model=chat_model,
    )
    response = await provider.complete(
        [
            {"role": "system", "content": "Be concise."},
            {"role": "user", "content": "Hello"},
            {"role": "assistant", "content": "Hi there."},
        ],
        response_model=ChatReply,
    )

    assert response == ChatReply(message="Hi")
    assert chat_model.schema is ChatReply
    assert chat_model.method == "json_schema"
    assert chat_model.runnable.messages == [
        ("system", "Be concise."),
        ("human", "Hello"),
        ("ai", "Hi there."),
    ]


def test_ollama_provider_configures_langchain_client(monkeypatch: pytest.MonkeyPatch) -> None:
    captured: dict[str, Any] = {}

    class FakeChatOllama:
        def __init__(self, **kwargs: Any) -> None:
            captured.update(kwargs)

    monkeypatch.setattr("app.providers.ollama.ChatOllama", FakeChatOllama)

    OllamaProvider(
        base_url="http://ollama/",
        model="llama3.2",
        timeout_seconds=42,
        api_key="secret",
    )

    assert captured == {
        "model": "llama3.2",
        "base_url": "http://ollama",
        "client_kwargs": {
            "timeout": 42,
            "headers": {"Authorization": "Bearer secret"},
        },
    }


@pytest.mark.asyncio
async def test_ollama_provider_maps_connection_errors() -> None:
    class FailingChatModel:
        def with_structured_output(
            self,
            schema: Mapping[str, Any],
            *,
            method: str,
        ) -> "FailingChatModel":
            return self

        async def ainvoke(self, messages: list[tuple[str, str]]) -> Any:
            raise httpx.ConnectError("offline")

    provider = OllamaProvider(
        base_url="http://ollama",
        model="llama3.2",
        chat_model=FailingChatModel(),
    )

    with pytest.raises(ProviderUnavailable):
        await provider.complete(
            [{"role": "user", "content": "Hello"}],
            response_model=ChatReply,
        )
