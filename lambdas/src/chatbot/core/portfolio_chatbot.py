from __future__ import annotations

import json

from pydantic import BaseModel, ConfigDict, Field

from llm_providers.base import LLMModel
from llm_providers.groq_model import GroqModel
from models.prompt import Prompt
from prompts.basic import SYSTEM_PROMPT, USER_PROMPT


class PortfolioChatbot(BaseModel):
    """Runtime orchestrator for fallback model execution."""

    model_config = ConfigDict(arbitrary_types_allowed=True)

    llm_models: list[LLMModel] = Field(
        default_factory=lambda: [
            GroqModel(
                model_name="openai/gpt-oss-120b",
                reasoning_effort="medium",
                temperature=0.5,
                top_p=1.0,
            ),
            GroqModel(
                model_name="meta-llama/llama-4-maverick-17b-128e-instruct",
                temperature=0.5,
                top_p=1.0,
            ),
        ],
        min_length=1,
    )
    prompt: Prompt = Field(
        default_factory=lambda: Prompt(
            system_prompt=SYSTEM_PROMPT,
            user_prompt=USER_PROMPT,
        )
    )

    def execute(self) -> None:
        """Execute full pipeline (placeholder)."""
        return None

    def _get_response(self, messages: list[str]) -> str:
        payload = {"messages": messages}
        self.prompt.format_user_prompt(messages=json.dumps(payload, ensure_ascii=False))

        errors: list[str] = []
        for model in self.llm_models:
            try:
                response = model.call(self.prompt)
                return response if isinstance(response, str) else str(response)
            except Exception as exc:
                errors.append(f"{model.__class__.__name__}: {exc}")

        raise RuntimeError(
            "All configured LLM providers failed. "
            f"Attempted models: {[model.model_name for model in self.llm_models]}. "
            f"Errors: {' | '.join(errors)}"
        )
