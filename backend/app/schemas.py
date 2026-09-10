from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

LandmarkId = Literal[
    "starship",
    "f22",
    "neural-network",
    "roses",
    "victory-statue",
    "squat-rack",
    "pergamon-library",
]

PanelType = Literal["html", "none"]


class ConversationMessage(BaseModel):
    model_config = ConfigDict(extra="forbid")

    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=4000)

    @field_validator("content")
    @classmethod
    def content_must_not_be_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("content must not be blank")
        return value


class ChatRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    messages: list[ConversationMessage] = Field(min_length=1, max_length=40)


class ChatReply(BaseModel):
    model_config = ConfigDict(extra="forbid")

    message: str = Field(min_length=1, max_length=8000)
    destination_object_id: LandmarkId | None = None

    @field_validator("message")
    @classmethod
    def reply_must_not_be_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("message must not be blank")
        return value


class PanelDefinition(BaseModel):
    model_config = ConfigDict(extra="forbid")

    type: PanelType
    html: str | None = None
    localize: bool = False

    @classmethod
    def html_panel(cls, html: str) -> "PanelDefinition":
        return cls(type="html", html=html, localize=False)
