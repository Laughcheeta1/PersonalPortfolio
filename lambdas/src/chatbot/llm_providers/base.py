from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Generic, Literal, TypeVar

from pydantic import BaseModel, ConfigDict, Field

try:
    from ..models.prompt import Prompt
except ImportError:  # pragma: no cover - Lambda runtime import path
    from models.prompt import Prompt

TStructured = TypeVar("TStructured")


class LLMModel(BaseModel, ABC):
    """Abstract base model for LLM providers."""

    model_config = ConfigDict(arbitrary_types_allowed=True)

    model_name: str = Field(min_length=1)
    reasoning_effort: Literal["low", "medium", "high"] | None = None
    temperature: float | None = Field(default=None, ge=0.0, le=2.0)
    top_p: float | None = Field(default=None, ge=0.0, le=1.0)
    top_k: int | None = Field(default=None, ge=1)

    @abstractmethod
    def call(
        self,
        prompt: Prompt,
        structured_output: type[TStructured] | None = None,
    ) -> TStructured | str:
        """Call the model API with a prompt.

        Return parsed structured output if requested, else plain text output.
        """
