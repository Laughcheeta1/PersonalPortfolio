from __future__ import annotations

import json

from pydantic import BaseModel, ConfigDict, Field

from llm_providers.base import LLMModel
from models.prompt import Prompt


class PortfolioChatbot(BaseModel):
    """Runtime orchestrator for fallback model execution."""

    model_config = ConfigDict(arbitrary_types_allowed=True)

    llm_models: list[LLMModel] = Field(min_length=1)
    prompt: Prompt

    def execute(self) -> None:
        """Execute full pipeline (placeholder)."""
        return None

    def _get_response(self, messages: list[str]) -> str:
        payload = {"messages": messages}
        runtime_prompt = Prompt(
            system_prompt=self.prompt.format_system_prompt(),
            user_prompt=self.prompt.format_user_prompt(
                messages=json.dumps(payload, ensure_ascii=False)
            ),
        )

        errors: list[str] = []
        for model in self.llm_models:
            try:
                response = model.call(runtime_prompt)
                return response if isinstance(response, str) else str(response)
            except Exception as exc:
                errors.append(f"{model.__class__.__name__}: {exc}")

        raise RuntimeError(
            "All configured LLM providers failed. "
            f"Attempted models: {[model.model_name for model in self.llm_models]}. "
            f"Errors: {' | '.join(errors)}"
        )
