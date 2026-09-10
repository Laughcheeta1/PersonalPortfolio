from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

MAX_CHAT_MESSAGE_LENGTH = 300
MAX_CHAT_USER_MESSAGES = 10
MAX_CHAT_REQUEST_MESSAGES = MAX_CHAT_USER_MESSAGES * 2

LandmarkId = Literal[
    "starship",
    "f22",
    "neural-network",
    "roses",
    "victory-statue",
    "squat-rack",
    "pergamon-library",
]

class ConversationMessage(BaseModel):
    """One user or assistant message included in the guide context."""

    model_config = ConfigDict(extra="forbid")

    role: Literal["user", "assistant"] = Field(
        description="The author of this conversation message.",
    )
    content: str = Field(
        min_length=1,
        max_length=MAX_CHAT_MESSAGE_LENGTH,
        description="The message text, limited to 300 characters.",
    )

    @field_validator("content")
    @classmethod
    def content_must_not_be_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("content must not be blank")
        return value


class ChatRequest(BaseModel):
    """Bounded conversation context sent to the portfolio guide."""

    model_config = ConfigDict(extra="forbid")

    messages: list[ConversationMessage] = Field(
        min_length=1,
        max_length=MAX_CHAT_REQUEST_MESSAGES,
        description=(
            "Recent conversation messages. The request may contain at most "
            "10 user messages."
        ),
    )

    @model_validator(mode="after")
    def user_message_count_must_be_bounded(self) -> "ChatRequest":
        user_messages = sum(message.role == "user" for message in self.messages)
        if user_messages > MAX_CHAT_USER_MESSAGES:
            raise ValueError(
                f"requests may contain at most {MAX_CHAT_USER_MESSAGES} user messages"
            )
        return self


class ChatReply(BaseModel):
    """The guide's text and optional navigation instruction."""

    model_config = ConfigDict(extra="forbid")

    message: str = Field(
        min_length=1,
        max_length=MAX_CHAT_MESSAGE_LENGTH,
        description=(
            "One concise, natural guide response. Keep it within 300 "
            "characters."
        ),
    )
    destination_object_id: LandmarkId | None = Field(
        default=None,
        description=(
            "The landmark the companion should guide the visitor to, or null "
            "when no navigation was requested."
        ),
    )

    @field_validator("message")
    @classmethod
    def reply_must_not_be_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("message must not be blank")
        return value