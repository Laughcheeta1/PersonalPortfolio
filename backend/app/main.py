from __future__ import annotations

import asyncio
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse

from .chat import InvalidProviderResponse, PortfolioChat
from .config import Settings, get_settings
from .database import (
    connect_database,
    create_database_engine,
    dispose_database_engine,
)
from .panel_documents import read_panel_document
from .portfolio import PortfolioRepository
from .providers.base import ProviderError, ProviderUnavailable, LLMProvider
from .providers.ollama import OllamaProvider
from .schemas import ChatReply, ChatRequest


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
        api_key=(
            resolved_settings.ollama_api_key.get_secret_value()
            if resolved_settings.ollama_api_key is not None
            else None
        ),
    )
    chat = PortfolioChat(resolved_provider, resolved_portfolio)
    database_engine = create_database_engine(
        resolved_settings.database_url.get_secret_value()
        if resolved_settings.database_url is not None
        else None
    )

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        connection_task = asyncio.create_task(connect_database(database_engine))
        app.state.database_connection_task = connection_task
        try:
            yield
        finally:
            if not connection_task.done():
                connection_task.cancel()
            try:
                await connection_task
            except asyncio.CancelledError:
                pass
            dispose_database_engine(database_engine)

    app = FastAPI(
        title="Personal Portfolio API",
        version="0.1.0",
        lifespan=lifespan,
    )
    app.state.database_engine = database_engine

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

    @app.get("/api/panels/{panel_id}", response_class=HTMLResponse)
    async def panel(panel_id: str) -> HTMLResponse:
        try:
            return HTMLResponse(read_panel_document(panel_id))
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
