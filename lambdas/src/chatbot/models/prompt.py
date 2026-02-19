from __future__ import annotations

from pydantic import BaseModel, Field


class Prompt(BaseModel):
    """Prompt container with formatting helpers for system and user messages."""

    system_prompt: str = Field(min_length=1)
    user_prompt: str = Field(min_length=1)

    def format_system_prompt(self, **kwargs: object) -> str:
        return self.system_prompt.format(**kwargs) if kwargs else self.system_prompt

    def format_user_prompt(self, **kwargs: object) -> str:
        return self.user_prompt.format(**kwargs) if kwargs else self.user_prompt

    def to_messages(self) -> list[dict[str, str]]:
        return [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": self.user_prompt},
        ]
