from __future__ import annotations

from pathlib import Path

PANEL_DOCUMENTS_ROOT = Path(__file__).parent / "panel_documents"
LANDMARK_IDS = frozenset(
    {
        "starship",
        "f22",
        "neural-network",
        "roses",
        "victory-statue",
        "squat-rack",
        "pergamon-library",
    }
)
PANEL_SIDES = frozenset({"front", "back"})


def _document_path(panel_id: str) -> Path:
    try:
        landmark_id, side = panel_id.split(":", maxsplit=1)
    except ValueError as exc:
        raise KeyError(panel_id) from exc
    if landmark_id not in LANDMARK_IDS or side not in PANEL_SIDES:
        raise KeyError(panel_id)

    path = PANEL_DOCUMENTS_ROOT / landmark_id / f"{side}.html"
    if not path.is_file():
        raise KeyError(panel_id)
    return path


def read_panel_document(panel_id: str) -> str:
    try:
        return _document_path(panel_id).read_text(encoding="utf-8")
    except OSError as exc:
        raise KeyError(panel_id) from exc
