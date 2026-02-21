from __future__ import annotations

import json
import logging
import os
from typing import Literal

from openai import OpenAI
from pydantic import BaseModel, ConfigDict, Field, PrivateAttr, model_validator

from llm_providers.base import LLMModel, TStructured
from models.prompt import Prompt

LOGGER = logging.getLogger(__name__)


class OpenAIModel(LLMModel):
    """OpenAI-backed LLM model implementation."""

    model_config = ConfigDict(arbitrary_types_allowed=True)

    api_key: str = Field(default_factory=lambda: os.getenv("OPENAI_API_KEY", ""))
    _client: OpenAI = PrivateAttr()

    def __init__(
        self,
        *,
        model_name: str,
        reasoning_effort: Literal["low", "medium", "high"] | None = None,
        temperature: float | None = None,
        top_p: float | None = None,
        api_key: str | None = None,
    ) -> None:
        super().__init__(
            model_name=model_name,
            reasoning_effort=reasoning_effort,
            temperature=temperature,
            top_p=top_p,
            api_key=api_key or os.getenv("OPENAI_API_KEY", ""),
        )

    @model_validator(mode="after")
    def _initialize_client(self) -> "OpenAIModel":
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY is required for OpenAIModel.")
        self._client = OpenAI(api_key=self.api_key)
        return self

    def call(
        self,
        prompt: Prompt,
        structured_output: type[TStructured] | None = None,
    ) -> TStructured | str:
        LOGGER.debug(
            "OpenAI call. model=%s structured=%s",
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
        if self.reasoning_effort is not None:
            request_kwargs["reasoning_effort"] = self.reasoning_effort

        if not structured_output:
            completion = self._client.chat.completions.create(**request_kwargs)
            content = completion.choices[0].message.content
            if content is None:
                raise ValueError("OpenAI response content is empty.")
            return content

        if not issubclass(structured_output, BaseModel):
            raise TypeError(
                "structured_output must be a Pydantic BaseModel subclass for OpenAIModel."
            )

        request_kwargs["response_format"] = {
            "type": "json_schema",
            "json_schema": {
                "name": structured_output.__name__.lower(),
                "strict": True,
                "schema": structured_output.model_json_schema(),
            },
        }

        completion = self._client.chat.completions.create(**request_kwargs)
        content = completion.choices[0].message.content
        if content is None:
            raise ValueError("OpenAI structured response content is empty.")
        payload = json.loads(content)
        return structured_output.model_validate(payload)
