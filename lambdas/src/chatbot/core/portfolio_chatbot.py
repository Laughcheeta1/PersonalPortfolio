from __future__ import annotations

import json
import logging

from pydantic import BaseModel, ConfigDict, Field

from llm_providers.base import LLMModel
from llm_providers.groq_model import GroqModel
from models.prompt import Prompt
from models.request import ConversationMessage
from models.response import ChatbotStructuredResponse
from prompts.basic import SYSTEM_PROMPT, USER_PROMPT

LOGGER = logging.getLogger(__name__)

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

    def execute(self, messages: list[ConversationMessage] | None = None) -> dict[str, object]:
        payload_messages = [message.model_dump() for message in (messages or [])]
        LOGGER.debug("PortfolioChatbot.execute called with %s messages.", len(payload_messages))
        payload = {"messages": payload_messages}
        self.prompt.format_system_prompt()
        self.prompt.format_user_prompt(messages=json.dumps(payload, ensure_ascii=False))
        LOGGER.debug(
            "Prompt prepared. system_len=%s user_len=%s",
            len(self.prompt.system_prompt),
            len(self.prompt.user_prompt),
        )

        return self._get_structured_response()

    def _get_structured_response(self) -> dict[str, object]:
        errors: list[str] = []
        for index, model in enumerate(self.llm_models, start=1):
            LOGGER.debug(
                "Trying model %s/%s: %s",
                index,
                len(self.llm_models),
                model.model_name,
            )
            try:
                response = model.call(
                    self.prompt, structured_output=ChatbotStructuredResponse
                )
                if not isinstance(response, ChatbotStructuredResponse):
                    raise TypeError("Structured output did not return ChatbotStructuredResponse.")
                LOGGER.debug("Model succeeded: %s", model.model_name)
                return response.model_dump()
            except Exception as exc:
                LOGGER.warning("Model failed (%s): %s", model.model_name, exc)
                errors.append(f"{model.__class__.__name__}: {exc}")

        LOGGER.error("All models failed: %s", errors)
        raise RuntimeError(
            "All configured LLM providers failed. "
            f"Attempted models: {[model.model_name for model in self.llm_models]}. "
            f"Errors: {' | '.join(errors)}"
        )
