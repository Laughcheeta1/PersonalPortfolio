from __future__ import annotations

from html import escape
from typing import Any
from urllib.parse import urlparse

from .portfolio import PortfolioRepository
from .schemas import PanelDefinition

LIBRARY_MESSAGE = "Empire construction in progress, you will know it in the news"
PANEL_MODELS = {
    "starship": "projects",
    "f22": "work",
    "neural-network": "skills",
    "roses": "personal",
    "victory-statue": "honors",
    "squat-rack": "hobbies",
    "pergamon-library": "library",
}


def _text(value: Any) -> str:
    return escape(str(value), quote=True)


def _link(value: Any) -> str:
    if not isinstance(value, str):
        return ""
    parsed = urlparse(value)
    if parsed.scheme not in {"http", "https"}:
        return ""
    return f'<a href="{escape(value, quote=True)}" target="_blank" rel="noreferrer">{_text(value)}</a>'


def _metadata(item: dict[str, Any]) -> str:
    values: list[str] = []
    for key in ("companyName", "ventureName", "clientOrProductName", "institution", "provider"):
        if item.get(key):
            values.append(_text(item[key]))
    if item.get("startDate"):
        end = item.get("endDate") or "present"
        values.append(f"{_text(item['startDate'])} – {_text(end)}")
    elif item.get("completionDate"):
        values.append(f"Completed {_text(item['completionDate'])}")
    elif item.get("date"):
        values.append(_text(item["date"]))
    return f'<p class="panel-meta">{" · ".join(values)}</p>' if values else ""


def _entry(item: dict[str, Any], *, details: bool) -> str:
    title = _text(item.get("title", "Untitled"))
    content = [f"<h3>{title}</h3>"]
    if item.get("summary"):
        content.append(f"<p>{_text(item['summary'])}</p>")
    content.append(_metadata(item))
    if details and item.get("details"):
        content.append(f"<p>{_text(item['details'])}</p>")
    if details and item.get("architectureExplanation"):
        content.append(f"<p>{_text(item['architectureExplanation'])}</p>")
    if details and item.get("technologies"):
        technologies = ", ".join(_text(value) for value in item["technologies"])
        content.append(f"<p class=\"panel-meta\">{technologies}</p>")
    links = item.get("links", {})
    if details and isinstance(links, dict):
        rendered_links = [_link(value) for value in links.values()]
        content.extend(link for link in rendered_links if link)
    return f'<article class="panel-entry">{"".join(content)}</article>'


def _entries(items: list[dict[str, Any]], *, details: bool) -> str:
    return "".join(_entry(item, details=details) for item in items)


def _panel(eyebrow: str, title: str, body: str) -> PanelDefinition:
    return PanelDefinition.html_panel(
        f'<p class="eyebrow">{_text(eyebrow)}</p>'
        f"<h2>{_text(title)}</h2>"
        f"{body}"
    )


def _projects(repository: PortfolioRepository, details: bool) -> PanelDefinition:
    projects = repository.data["projects"]
    personal = projects["personalProjects"]
    work = projects["workProjects"]
    body = _entries(personal, details=details)
    if details:
        body += f'<p class="eyebrow">WORK PROJECTS</p>{_entries(work, details=True)}'
    return _panel("PROJECTS", "Personal projects", body)


def _work(repository: PortfolioRepository, details: bool) -> PanelDefinition:
    work = repository.data["work"]
    groups = (
        ("COMPANIES", work["companies"]),
        ("ENTREPRENEURSHIP", work["entrepreneurship"]),
        ("INDEPENDENT WORK", work["independentWork"]),
    )
    body = "".join(
        f'<p class="eyebrow">{_text(eyebrow)}</p>{_entries(items, details=details)}'
        for eyebrow, items in groups
    )
    return _panel("WORK EXPERIENCE", "Work and leadership", body)


def _skills(repository: PortfolioRepository, details: bool) -> PanelDefinition:
    data = repository.data
    skills = list(data["skills"].values())
    education = data["education"]
    work_projects = data["projects"]["workProjects"]
    skill_body = "".join(
        f'<article class="panel-entry"><h3>{_text(item["name"])}</h3>'
        f'<p>{_text(item["summary"])}</p></article>'
        for item in skills
    )
    education_body = _entries(
        education["universityEducations"] + education["courseEducations"],
        details=details,
    )
    work_body = _entries(work_projects, details=details)
    return _panel(
        "SKILLS & EDUCATION",
        "How I keep learning",
        f'<p class="eyebrow">SKILLS</p>{skill_body}'
        f'<p class="eyebrow">EDUCATION</p>{education_body}'
        f'<p class="eyebrow">WORK PROJECTS</p>{work_body}',
    )


def _personal(repository: PortfolioRepository, details: bool) -> PanelDefinition:
    personal = repository.data["personal"]
    links = "".join(
        f"<p>{_link(personal[key])}</p>"
        for key in ("githubUrl", "linkedinUrl")
        if _link(personal.get(key))
    )
    body = (
        f"<p>{_text(personal['headline'])}</p>"
        f"<p>{_text(personal['summary'])}</p>"
        f'<p class="panel-meta">Availability: {_text(personal["availability"].replace("_", " "))}</p>'
        f"{links}"
    )
    if details:
        languages = ", ".join(_text(value) for value in personal["languagesSpoken"])
        body += f"<p>Languages: {languages}</p>"
    return _panel("ABOUT ME", "A curious builder", body)


def _honors(repository: PortfolioRepository, details: bool) -> PanelDefinition:
    honors = repository.data["honors"]
    body = (
        f'<p class="eyebrow">AWARDS</p>{_entries(honors["awards"], details=details)}'
        f'<p class="eyebrow">HONORS</p>{_entries(honors["honors"], details=details)}'
    )
    return _panel("HONORS", "Milestones worth remembering", body)


def _hobbies(repository: PortfolioRepository, details: bool) -> PanelDefinition:
    hobbies = repository.data["personal"]["hobbies"]
    return _panel("HOBBIES", "Life beyond the keyboard", _entries(hobbies, details=details))


def _library() -> PanelDefinition:
    return PanelDefinition.html_panel(f"<p>{_text(LIBRARY_MESSAGE)}</p>")


def render_panel(panel_id: str, repository: PortfolioRepository) -> PanelDefinition:
    try:
        landmark_id, side = panel_id.split(":", maxsplit=1)
    except ValueError as exc:
        raise KeyError(panel_id) from exc
    if landmark_id not in PANEL_MODELS or side not in {"front", "back"}:
        raise KeyError(panel_id)

    model = PANEL_MODELS[landmark_id]
    if model == "library":
        return _library()
    details = side == "back"
    builders = {
        "projects": _projects,
        "work": _work,
        "skills": _skills,
        "personal": _personal,
        "honors": _honors,
        "hobbies": _hobbies,
    }
    return builders[model](repository, details)
