from __future__ import annotations

import json
import logging
import os
from typing import Literal

from openrouter import OpenRouter
from pydantic import BaseModel, ConfigDict, Field, PrivateAttr, model_validator

from core.errors import ChatbotHttpError
from llm_providers.base import LLMModel, TStructured
from models.prompt import Prompt

LOGGER = logging.getLogger(__name__)


def _extract_status_code(error: Exception) -> int | None:
    status_code = getattr(error, "status_code", None)
    if isinstance(status_code, int):
        return status_code

    response = getattr(error, "response", None)
    response_status_code = getattr(response, "status_code", None)
    if isinstance(response_status_code, int):
        return response_status_code

    return None


def _is_credit_limit_error(error: Exception) -> bool:
    message = str(error).lower()
    indicators = (
        "credit limit",
        "insufficient credits",
        "billing",
        "spend limit",
        "payment required",
        "quota exceeded",
    )
    return any(indicator in message for indicator in indicators)


class OpenRouterModel(LLMModel):
    """OpenRouter-backed LLM model implementation via the official OpenRouter SDK."""

    model_config = ConfigDict(arbitrary_types_allowed=True)

    api_key: str = Field(default_factory=lambda: os.getenv("OPEN_ROUTER_API_KEY", ""))
    app_name: str = Field(default="PersonalPortfolio")
    app_url: str = Field(default="")
    _client: OpenRouter = PrivateAttr()

    def __init__(
        self,
        *,
        model_name: str,
        reasoning_effort: Literal["low", "medium", "high"] | None = None,
        temperature: float | None = None,
        top_p: float | None = None,
        top_k: int | None = None,
        api_key: str | None = None,
    ) -> None:
        super().__init__(
            model_name=model_name,
            reasoning_effort=reasoning_effort,
            temperature=temperature,
            top_p=top_p,
            top_k=top_k,
            api_key=api_key or os.getenv("OPEN_ROUTER_API_KEY", ""),
            app_name="PersonalPortfolio",
            app_url="",
        )

    @model_validator(mode="after")
    def _initialize_client(self) -> "OpenRouterModel":
        if not self.api_key:
            raise ValueError("OPEN_ROUTER_API_KEY is required for OpenRouterModel.")

        self._client = OpenRouter(
            api_key=self.api_key,
            x_title=self.app_name,
            http_referer=self.app_url if self.app_url else None,
        )
        return self

    def call(
        self,
        prompt: Prompt,
        structured_output: type[TStructured] | None = None,
    ) -> TStructured | str:
        LOGGER.debug(
            "OpenRouter call. model=%s structured=%s",
            self.model_name,
            structured_output.__name__ if structured_output else None,
        )
        request_kwargs: dict[str, object] = {
            "model": self.model_name,
            "messages": prompt.to_messages(),
        }

        if self.temperature is not None:
            request_kwargs["temperature"] = self.temperature
        if self.top_p is not None:
            request_kwargs["top_p"] = self.top_p
        if self.top_k is not None:
            LOGGER.warning(
                "Open Router SDK does not suppor top_k"
            )
        if self.reasoning_effort is not None:
            request_kwargs["reasoning"] = {
                "effort": self.reasoning_effort
            }

        if not structured_output:
            LOGGER.debug("Sending plain completion request.")
            completion = self._create_completion(request_kwargs)
            content = completion.choices[0].message.content
            if content is None:
                raise ValueError("OpenRouter response content is empty.")
            LOGGER.debug("Plain completion received. content_len=%s", len(content))
            return content

        if not issubclass(structured_output, BaseModel):
            raise TypeError(
                "structured_output must be a Pydantic BaseModel subclass for OpenRouterModel."
            )

        schema_name = structured_output.__name__.lower()
        request_kwargs["response_format"] = {
            "type": "json_schema",
            "json_schema": {
                "name": schema_name,
                "strict": True,
                "schema": structured_output.model_json_schema(),
            },
        }

        completion = self._create_completion(request_kwargs)
        content = completion.choices[0].message.content
        if content is None:
            raise ValueError("OpenRouter structured response content is empty.")
        LOGGER.debug("Structured completion received. content_len=%s", len(content))

        payload = json.loads(content)
        LOGGER.debug("Structured payload parsed.")
        return structured_output.model_validate(payload)

    def _create_completion(self, request_kwargs: dict[str, object]):
        try:
            return self._client.chat.send(**request_kwargs)
        except Exception as exc:
            if _is_credit_limit_error(exc):
                raise ChatbotHttpError(
                    status_code=402,
                    error_code="openrouter_credit_limit_exceeded",
                    message="OpenRouter API credit limit exceeded.",
                ) from exc

            status_code = _extract_status_code(exc)
            if status_code == 402:
                raise ChatbotHttpError(
                    status_code=402,
                    error_code="openrouter_credit_limit_exceeded",
                    message="OpenRouter API credit limit exceeded.",
                ) from exc

            raise
