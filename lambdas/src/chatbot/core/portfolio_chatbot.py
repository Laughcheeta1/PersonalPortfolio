from __future__ import annotations

from datetime import datetime, timezone
import json
import logging
from pathlib import Path

from pydantic import BaseModel, ConfigDict, Field

from core.errors import ChatbotHttpError
from core.secrets import resolve_secret_value
from llm_providers.base import LLMModel
from llm_providers.groq_model import GroqModel
from models.prompt import Prompt
from models.request import ConversationMessage
from models.response import ChatbotStructuredResponse
from prompts.basic import SYSTEM_PROMPT, USER_PROMPT

LOGGER = logging.getLogger(__name__)
DATA_DIR = Path(__file__).resolve().parent.parent / "data"
CONTEXT_MESSAGES_WINDOW = 5


def _build_default_models() -> list[LLMModel]:
    models: list[LLMModel] = []

    groq_api_key = resolve_secret_value(
        secret_id="GROQ_API_KEY",
        json_key="GROQ_API_KEY",
    )
    if groq_api_key:
        models.extend(
            [
                GroqModel(
                    model_name="openai/gpt-oss-120b",
                    reasoning_effort="low",
                    temperature=0.5,
                    top_p=1.0,
                    api_key=groq_api_key,
                ),
                GroqModel(
                    model_name="meta-llama/llama-4-maverick-17b-128e-instruct",
                    temperature=0.5,
                    top_p=1.0,
                    api_key=groq_api_key,
                ),
            ]
        )

    if not models:
        raise RuntimeError("No LLM providers configured. Set GROQ_API_KEY.")

    return models


class PortfolioChatbot(BaseModel):
    """Runtime orchestrator for fallback model execution."""

    model_config = ConfigDict(arbitrary_types_allowed=True)

    llm_models: list[LLMModel] = Field(
        default_factory=_build_default_models,
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
        prompt_messages = payload_messages[-CONTEXT_MESSAGES_WINDOW:]
        LOGGER.debug(
            "PortfolioChatbot.execute called with %s messages; using last %s for prompt context.",
            len(payload_messages),
            len(prompt_messages),
        )
        self.prompt.format_system_prompt(
            education=self._load_data_section("education.json"),
            honors=self._load_data_section("honors.json"),
            personal=self._load_data_section("personal.json"),
            projects=self._load_data_section("projects.json"),
            skills=self._load_data_section("skills.json"),
            work=self._load_data_section("work.json"),
            date=datetime.now(timezone.utc).date().isoformat(),
        )
        self.prompt.format_user_prompt(messages=json.dumps(prompt_messages, ensure_ascii=False))
        LOGGER.debug(
            "Prompt prepared. system_len=%s user_len=%s",
            len(self.prompt.system_prompt),
            len(self.prompt.user_prompt),
        )

        return self._get_structured_response()

    @staticmethod
    def _load_data_section(filename: str) -> str:
        path = DATA_DIR / filename
        try:
            with path.open("r", encoding="utf-8") as file:
                payload = json.load(file)
        except FileNotFoundError as exc:
            raise RuntimeError(f"Missing chatbot data file: {path}") from exc
        except json.JSONDecodeError as exc:
            raise RuntimeError(f"Invalid JSON in chatbot data file: {path}") from exc

        return json.dumps(payload, ensure_ascii=False, indent=2)

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
            except ChatbotHttpError:
                raise
            except Exception as exc:
                LOGGER.warning("Model failed (%s): %s", model.model_name, exc)
                errors.append(f"{model.__class__.__name__}: {exc}")

        LOGGER.error("All models failed: %s", errors)
        raise RuntimeError(
            "All configured LLM providers failed. "
            f"Attempted models: {[model.model_name for model in self.llm_models]}. "
            f"Errors: {' | '.join(errors)}"
        )
