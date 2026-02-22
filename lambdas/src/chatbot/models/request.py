from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field, model_validator

MAX_USER_MESSAGE_CHARS = 500


class ConversationMessage(BaseModel):
    sender: Literal["user", "model"] = Field(...)
    message: str = Field(..., min_length=1)

    @model_validator(mode="before")
    @classmethod
    def validate_message(cls, data: Any) -> Any:
        if not isinstance(data, dict):
            raise TypeError("ConversationMessage must be an object.")

        message = data.get("message")
        if not isinstance(message, str):
            raise TypeError("message must be a string.")

        trimmed_message = message.strip()
        if not trimmed_message:
            raise ValueError("message must not be empty.")
        if data.get("sender") == "user" and len(trimmed_message) > MAX_USER_MESSAGE_CHARS:
            raise ValueError(
                f"user message exceeds max length of {MAX_USER_MESSAGE_CHARS} characters."
            )

        normalized = dict(data)
        normalized["message"] = trimmed_message
        return normalized


class ChatbotRequest(BaseModel):
    messages: list[ConversationMessage] = Field(..., min_length=1)
