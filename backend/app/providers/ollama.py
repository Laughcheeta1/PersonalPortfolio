import json
from collections.abc import Mapping, Sequence
from typing import Any, Protocol

import httpx
from langchain_ollama import ChatOllama
from pydantic import BaseModel

from .base import ProviderError, ProviderMessage, ProviderResult, ProviderUnavailable


class LangChainRunnable(Protocol):
    async def ainvoke(self, messages: Sequence[tuple[str, str]]) -> Any:
        ...


class LangChainChatModel(LangChainRunnable, Protocol):
    def with_structured_output(
        self,
        schema: type[BaseModel] | Mapping[str, Any],
        *,
        method: str,
    ) -> LangChainRunnable:
        ...


class OllamaProvider:
    """LangChain-backed Ollama adapter behind the application provider contract."""

    def __init__(
        self,
        base_url: str,
        model: str,
        timeout_seconds: float = 60.0,
        api_key: str | None = None,
        chat_model: LangChainChatModel | None = None,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.timeout_seconds = timeout_seconds
        client_kwargs: dict[str, Any] = {"timeout": timeout_seconds}
        if api_key:
            client_kwargs["headers"] = {"Authorization": f"Bearer {api_key}"}
        self._chat_model = (
            chat_model
            if chat_model is not None
            else ChatOllama(
                model=model,
                base_url=self.base_url,
                client_kwargs=client_kwargs,
            )
        )

    async def complete(
        self,
        messages: Sequence[ProviderMessage],
        *,
        response_model: type[BaseModel] | None = None,
    ) -> ProviderResult:
        try:
            runnable: LangChainRunnable = self._chat_model
            if response_model is not None:
                runnable = self._chat_model.with_structured_output(
                    response_model,
                    method="json_schema",
                )
            result = await runnable.ainvoke(self._to_langchain_messages(messages))
        except httpx.TimeoutException as exc:
            raise ProviderUnavailable("Ollama timed out while generating a reply.") from exc
        except TimeoutError as exc:
            raise ProviderUnavailable("Ollama timed out while generating a reply.") from exc
        except httpx.RequestError as exc:
            raise ProviderUnavailable("Ollama is unavailable.") from exc
        except Exception as exc:
            raise ProviderError("Ollama failed to generate a reply.") from exc

        return self._serialize_result(result)

    @staticmethod
    def _to_langchain_messages(
        messages: Sequence[ProviderMessage],
    ) -> list[tuple[str, str]]:
        role_map = {
            "system": "system",
            "user": "human",
            "assistant": "ai",
        }
        try:
            return [
                (role_map[message["role"]], message["content"])
                for message in messages
            ]
        except (KeyError, TypeError) as exc:
            raise ProviderError("The chat request contains an invalid message.") from exc

    @staticmethod
    def _serialize_result(result: Any) -> ProviderResult:
        if isinstance(result, BaseModel):
            return result
        if isinstance(result, Mapping):
            content = json.dumps(result, ensure_ascii=False)
        elif isinstance(result, str):
            content = result
        else:
            message_content = getattr(result, "content", None)
            if not isinstance(message_content, str):
                raise ProviderError("Ollama returned an invalid completion.")
            content = message_content

        if not content.strip():
            raise ProviderError("Ollama returned an empty completion.")
        return content.strip()
