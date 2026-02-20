from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

PortfolioCategory = Literal[
    "work",
    "education",
    "projects",
    "honors",
    "skills",
    "personal",
]
ResponseType = Literal["movement", "text"]
PortfolioSubcategory = Literal[
    "companies",
    "entrepreneurship",
    "independent-work",
    "university",
    "courses",
    "personal-projects",
    "work-projects",
    "awards",
    "honors",
    "skills-list",
    "profile",
    "hobbies",
    "languages",
]

CATEGORY_SUBCATEGORY_MAP: dict[PortfolioCategory, set[PortfolioSubcategory]] = {
    "work": {"companies", "entrepreneurship", "independent-work"},
    "education": {"university", "courses"},
    "projects": {"personal-projects", "work-projects"},
    "honors": {"awards", "honors"},
    "skills": {"skills-list"},
    "personal": {"profile", "hobbies", "languages"},
}


class ChatbotResponseAction(BaseModel):
    model_config = ConfigDict(extra="forbid")

    action_type: ResponseType = Field(...)
    category_to_move_to: PortfolioCategory | None = Field(...)
    subcategory_to_move_to: PortfolioSubcategory | None = Field(...)
    message: str | None = Field(...)

    @model_validator(mode="after")
    def validate_action_shape(self) -> "ChatbotResponseAction":
        if self.action_type == "movement":
            if self.category_to_move_to is None:
                raise ValueError(
                    "category_to_move_to is required when action_type is 'movement'."
                )

            if self.subcategory_to_move_to is not None:
                valid_subcategories = CATEGORY_SUBCATEGORY_MAP[self.category_to_move_to]
                if self.subcategory_to_move_to not in valid_subcategories:
                    raise ValueError(
                        "subcategory_to_move_to is invalid for the selected category_to_move_to."
                    )

            return self

        if self.category_to_move_to is not None:
            raise ValueError(
                "category_to_move_to must be null when action_type is 'text'."
            )

        if self.subcategory_to_move_to is not None:
            raise ValueError(
                "subcategory_to_move_to must be null when action_type is 'text'."
            )

        return self


class ChatbotStructuredResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    response: list[ChatbotResponseAction] = Field(..., min_length=1)
