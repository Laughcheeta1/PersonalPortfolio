from collections.abc import Sequence
from typing import Protocol, TypedDict

from pydantic import BaseModel


class ProviderMessage(TypedDict):
    role: str
    content: str


class ProviderError(RuntimeError):
    """Base error raised when an LLM provider cannot complete a request."""


class ProviderUnavailable(ProviderError):
    """The configured provider cannot currently be reached."""


ProviderResult = BaseModel | str


class LLMProvider(Protocol):
    async def complete(
        self,
        messages: Sequence[ProviderMessage],
        *,
        response_model: type[BaseModel] | None = None,
    ) -> ProviderResult:
        """Return a completion, optionally parsed into a Pydantic model."""
