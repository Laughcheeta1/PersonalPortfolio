from __future__ import annotations

from dataclasses import dataclass


@dataclass(slots=True)
class ChatbotHttpError(Exception):
    status_code: int
    error_code: str
    message: str
    detail: str | None = None

    def to_payload(self) -> dict[str, str]:
        payload = {
            "error": self.message,
            "error_code": self.error_code,
        }
        if self.detail:
            payload["detail"] = self.detail
        return payload

