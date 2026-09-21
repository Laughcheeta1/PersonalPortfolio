from __future__ import annotations

import json
from pathlib import Path
from typing import Any

DATA_PATH = Path(__file__).parent / "data" / "portfolio.json"
REQUIRED_SECTIONS = {"personal", "projects", "work", "education", "skills", "honors"}


class PortfolioDataError(RuntimeError):
    """Raised when the checked-in portfolio snapshot cannot be loaded."""


class PortfolioRepository:
    def __init__(self, path: Path = DATA_PATH) -> None:
        try:
            with path.open(encoding="utf-8") as source:
                payload = json.load(source)
        except (OSError, json.JSONDecodeError) as exc:
            raise PortfolioDataError(f"Could not load portfolio data from {path}.") from exc

        if not isinstance(payload, dict) or not REQUIRED_SECTIONS.issubset(payload):
            raise PortfolioDataError(
                f"Portfolio data must contain: {', '.join(sorted(REQUIRED_SECTIONS))}."
            )
        self.data: dict[str, Any] = payload

    def prompt_context(self) -> str:
        return json.dumps(self.data, ensure_ascii=False, indent=2)
