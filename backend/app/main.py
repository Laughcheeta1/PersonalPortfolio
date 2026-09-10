from __future__ import annotations

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .chat import InvalidProviderResponse, PortfolioChat
from .config import Settings, get_settings
from .panels import render_panel
from .portfolio import PortfolioRepository
from .providers.base import ProviderError, ProviderUnavailable, LLMProvider
from .providers.ollama import OllamaProvider
from .schemas import ChatReply, ChatRequest, PanelDefinition


def create_app(
    *,
    provider: LLMProvider | None = None,
    settings: Settings | None = None,
    portfolio: PortfolioRepository | None = None,
) -> FastAPI:
    resolved_settings = settings or get_settings()
    resolved_portfolio = portfolio or PortfolioRepository()
    resolved_provider = provider or OllamaProvider(
        base_url=str(resolved_settings.ollama_base_url),
        model=resolved_settings.ollama_model,
        timeout_seconds=resolved_settings.ollama_timeout_seconds,
    )
    chat = PortfolioChat(resolved_provider, resolved_portfolio)

    app = FastAPI(title="Personal Portfolio API", version="0.1.0")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=resolved_settings.cors_origins,
        allow_credentials=False,
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type"],
    )

    @app.get("/health")
    @app.get("/healthz")
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.get("/api/panels/{panel_id}", response_model=PanelDefinition)
    async def panel(panel_id: str) -> PanelDefinition:
        try:
            return render_panel(panel_id, resolved_portfolio)
        except KeyError as exc:
            raise HTTPException(status_code=404, detail="Panel not found.") from exc

    @app.post("/api/chat", response_model=ChatReply)
    async def chat_route(request: ChatRequest) -> ChatReply:
        try:
            return await chat.answer(request)
        except ProviderUnavailable as exc:
            raise HTTPException(status_code=503, detail=str(exc)) from exc
        except ProviderError as exc:
            raise HTTPException(status_code=502, detail=str(exc)) from exc
        except InvalidProviderResponse as exc:
            raise HTTPException(status_code=502, detail=str(exc)) from exc

    return app


app = create_app()
