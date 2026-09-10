from collections.abc import Mapping, Sequence
from typing import Any, Protocol, TypedDict


class ProviderMessage(TypedDict):
    role: str
    content: str


class ProviderError(RuntimeError):
    """Base error raised when an LLM provider cannot complete a request."""


class ProviderUnavailable(ProviderError):
    """The configured provider cannot currently be reached."""


class LLMProvider(Protocol):
    async def complete(
        self,
        messages: Sequence[ProviderMessage],
        *,
        response_format: Mapping[str, Any] | None = None,
    ) -> str:
        """Return the provider's textual completion."""
