from __future__ import annotations

import json
import re
from collections.abc import Mapping
from typing import Any

from pydantic import BaseModel, ValidationError

from .portfolio import PortfolioRepository
from .prompt import render_system_prompt, render_user_prompt
from .providers.base import LLMProvider
from .schemas import ChatReply, ChatRequest

LANDMARKS = (
    "starship",
    "f22",
    "neural-network",
    "roses",
    "victory-statue",
    "squat-rack",
    "pergamon-library",
)

NAVIGATION_EXPLANATION_TAILS = (
    "donde podrás explorar los proyectos de Santiago.",
    "where Santiago's companies, entrepreneurship, and independent work are showcased.",
    "donde están los honores y premios de Santiago.",
    "—your gateway to Santiago's knowledge and achievements.",
)


class InvalidProviderResponse(RuntimeError):
    """Raised when a provider does not return the required chat contract."""


class PortfolioChat:
    def __init__(self, provider: LLMProvider, portfolio: PortfolioRepository) -> None:
        self.provider = provider
        self.portfolio = portfolio

    async def answer(self, request: ChatRequest) -> ChatReply:
        messages = [
            {
                "role": "system",
                "content": self._system_prompt(),
            },
            {
                "role": "user",
                "content": render_user_prompt(request.messages),
            },
        ]
        raw = await self.provider.complete(
            messages,
            response_model=ChatReply,
        )
        return self._parse_reply(raw)

    def _system_prompt(self) -> str:
        return render_system_prompt(
            self.portfolio.data,
            allowed_destinations=LANDMARKS,
        )

    @staticmethod
    def _parse_reply(raw: Any) -> ChatReply:
        try:
            if isinstance(raw, ChatReply):
                return PortfolioChat._clean_navigation_reply(raw)
            if isinstance(raw, BaseModel):
                payload: Any = raw.model_dump()
            elif isinstance(raw, Mapping):
                payload: Any = raw
            elif isinstance(raw, str):
                candidate = raw.strip()
                if candidate.startswith("```") and candidate.endswith("```"):
                    candidate = (
                        candidate.split("\n", 1)[-1]
                        .rsplit("```", 1)[0]
                        .strip()
                    )
                payload = json.loads(candidate)
            else:
                raise TypeError("The provider returned an unsupported result.")
            reply = ChatReply.model_validate(payload)
            return PortfolioChat._clean_navigation_reply(reply)
        except (json.JSONDecodeError, ValidationError, TypeError) as exc:
            raise InvalidProviderResponse(
                "The configured LLM returned an invalid chat response."
            ) from exc

    @staticmethod
    def _clean_navigation_reply(reply: ChatReply) -> ChatReply:
        if reply.destination_object_id is None:
            return reply
        message = reply.message
        for tail in NAVIGATION_EXPLANATION_TAILS:
            message = message.replace(tail, ".")
        message = re.sub(r"[,\s]+(?=\.)", "", message).strip()
        if message == reply.message:
            return reply
        return ChatReply(
            message=message,
            destination_object_id=reply.destination_object_id,
        )
