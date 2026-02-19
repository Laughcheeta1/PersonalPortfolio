from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field, model_validator


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

        normalized = dict(data)
        normalized["message"] = trimmed_message
        return normalized


class ChatbotRequest(BaseModel):
    messages: list[ConversationMessage] = Field(..., min_length=1)
