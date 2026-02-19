from __future__ import annotations

from pydantic import BaseModel, Field


class Prompt(BaseModel):
    """Prompt container with formatting helpers for system and user messages."""

    system_prompt: str = Field(default="")
    user_prompt: str = Field(default="")

    def format_system_prompt(self, **kwargs: object) -> "Prompt":
        self.system_prompt = (
            self.system_prompt.format(**kwargs) if kwargs else self.system_prompt
        )
        return self

    def format_user_prompt(self, **kwargs: object) -> "Prompt":
        self.user_prompt = self.user_prompt.format(**kwargs) if kwargs else self.user_prompt
        return self

    def to_messages(self) -> list[dict[str, str]]:
        return [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": self.user_prompt},
        ]
