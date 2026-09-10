from __future__ import annotations

import json
from typing import Any

from pydantic import ValidationError

from .portfolio import PortfolioRepository
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
            *(
                {
                    "role": message.role,
                    "content": message.content,
                }
                for message in request.messages
            ),
        ]
        raw = await self.provider.complete(
            messages,
            response_format=ChatReply.model_json_schema(),
        )
        return self._parse_reply(raw)

    def _system_prompt(self) -> str:
        ids = ", ".join(LANDMARKS)
        return (
            "You are the calm, helpful guide for Santiago Yepes's personal portfolio. "
            "Answer only from the portfolio data below. Keep replies concise and natural, "
            "use the user's language when possible, and do not invent facts. "
            "Return only a JSON object with exactly two fields: `message` and "
            f"`destination_object_id`. The destination must be null unless the user asks "
            f"to visit a relevant landmark. Allowed destination IDs: {ids}. "
            "Do not return Markdown fences or any text outside the JSON object.\n\n"
            f"Portfolio data:\n{self.portfolio.prompt_context()}"
        )

    @staticmethod
    def _parse_reply(raw: str) -> ChatReply:
        candidate = raw.strip()
        if candidate.startswith("```") and candidate.endswith("```"):
            candidate = candidate.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
        try:
            payload: Any = json.loads(candidate)
            return ChatReply.model_validate(payload)
        except (json.JSONDecodeError, ValidationError, TypeError) as exc:
            raise InvalidProviderResponse(
                "The configured LLM returned an invalid chat response."
            ) from exc
