from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, model_validator

PortfolioCategory = Literal[
    "work",
    "education",
    "projects",
    "honors",
    "skills",
    "personal",
]
ResponseType = Literal["movement", "text"]


class ChatbotResponseAction(BaseModel):
    action_type: ResponseType
    category_to_move_to: PortfolioCategory | None = None
    message: str | None = None

    @model_validator(mode="after")
    def validate_action_shape(self) -> "ChatbotResponseAction":
        if self.action_type == "movement" and self.category_to_move_to is None:
            raise ValueError(
                "category_to_move_to is required when action_type is 'movement'."
            )
        if self.action_type == "text" and self.category_to_move_to is not None:
            raise ValueError(
                "category_to_move_to must be null when action_type is 'text'."
            )
        return self


class ChatbotStructuredResponse(BaseModel):
    response: list[ChatbotResponseAction] = Field(default_factory=list, min_length=1)
