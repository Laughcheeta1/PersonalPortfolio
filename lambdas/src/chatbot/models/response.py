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
ResponseType = Literal["movement", "text", "main_page"]
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

    action_type: ResponseType = Field(
        ...,
        description=(
            "Type of action. Use 'movement' to navigate the 3d scene to a category/subcategory, "
            "'main_page' to deselect any focused model and return to the main page, "
            "or 'text' to return a textual assistant message."
        ),
    )
    category_to_move_to: PortfolioCategory | None = Field(
        ...,
        description=(
            "Target category for movement actions. Must be null for text actions. "
            "Allowed values: work, education, projects, honors, skills, personal."
        ),
    )
    subcategory_to_move_to: PortfolioSubcategory | None = Field(
        ...,
        description=(
            "Optional target subcategory for movement actions to filter cards in the selected "
            "category. Must be valid for the chosen category and null for text actions."
        ),
    )
    message: str | None = Field(
        ...,
        description=(
            "Assistant text content for text actions. Can be null for movement-only actions."
        ),
    )

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

        if self.action_type == "main_page":
            if self.category_to_move_to is not None:
                raise ValueError(
                    "category_to_move_to must be null when action_type is 'main_page'."
                )

            if self.subcategory_to_move_to is not None:
                raise ValueError(
                    "subcategory_to_move_to must be null when action_type is 'main_page'."
                )

            return self

        if self.category_to_move_to is not None:
            raise ValueError("category_to_move_to must be null when action_type is 'text'.")

        if self.subcategory_to_move_to is not None:
            raise ValueError(
                "subcategory_to_move_to must be null when action_type is 'text'."
            )

        return self


class ChatbotStructuredResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    response: list[ChatbotResponseAction] = Field(
        ...,
        min_length=1,
        description=(
            "Ordered list of actions for the frontend to execute. Actions may combine movement "
            "and text, and are processed in sequence."
        ),
    )
