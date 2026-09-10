from collections.abc import Mapping, Sequence
from typing import Any

import httpx

from .base import ProviderError, ProviderMessage, ProviderUnavailable


class OllamaProvider:
    """Ollama's HTTP adapter behind the application-level provider contract."""

    def __init__(
        self,
        base_url: str,
        model: str,
        timeout_seconds: float = 60.0,
        client: httpx.AsyncClient | None = None,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.timeout_seconds = timeout_seconds
        self._client = client

    async def complete(
        self,
        messages: Sequence[ProviderMessage],
        *,
        response_format: Mapping[str, Any] | None = None,
    ) -> str:
        payload: dict[str, Any] = {
            "model": self.model,
            "messages": list(messages),
            "stream": False,
        }
        if response_format is not None:
            payload["format"] = dict(response_format)

        if self._client is not None:
            return await self._complete_with_client(self._client, payload)

        async with httpx.AsyncClient(
            base_url=self.base_url,
            timeout=self.timeout_seconds,
        ) as client:
            return await self._complete_with_client(client, payload)

    async def _complete_with_client(
        self,
        client: httpx.AsyncClient,
        payload: dict[str, Any],
    ) -> str:
        try:
            response = await client.post("/api/chat", json=payload)
            response.raise_for_status()
        except httpx.TimeoutException as exc:
            raise ProviderUnavailable("Ollama timed out while generating a reply.") from exc
        except httpx.RequestError as exc:
            raise ProviderUnavailable("Ollama is unavailable.") from exc
        except httpx.HTTPStatusError as exc:
            raise ProviderError(
                f"Ollama returned HTTP {exc.response.status_code}."
            ) from exc

        try:
            body = response.json()
            content = body["message"]["content"]
        except (ValueError, KeyError, TypeError) as exc:
            raise ProviderError("Ollama returned an invalid completion.") from exc

        if not isinstance(content, str) or not content.strip():
            raise ProviderError("Ollama returned an empty completion.")
        return content.strip()
