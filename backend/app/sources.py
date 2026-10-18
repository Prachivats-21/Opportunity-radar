"""Opportunity source adapters.

Only providers with documented, permitted listing endpoints are implemented here.
Unstop/Devfolio/etc. remain approval-gated until the provider grants a supported feed.
Secrets stay server-side in environment variables; never expose them to Vite.
"""
from __future__ import annotations

import asyncio
import html
import os
import re
from datetime import date
from typing import Any
from urllib.parse import urlparse

import httpx
from .schemas import Opportunity

_TIMEOUT = httpx.Timeout(15.0, connect=5.0)
_MAX_RESULTS = 25


def _csv_env(name: str) -> list[str]:
    return [value.strip() for value in os.getenv(name, "").split(",") if value.strip()]


def _clean_text(value: Any) -> str:
    if not isinstance(value, str):
        return ""
    value = re.sub(r"(?is)<(script|style).*?>.*?</\1>", " ", value)
    value = re.sub(r"(?s)<[^>]+>", " ", value)
    return re.sub(r"\s+", " ", html.unescape(value)).strip()


def _slug(value: Any) -> str:
    cleaned = re.sub(r"[^a-z0-9]+", "-", str(value).lower()).strip("-")
    return cleaned[:90] or "listing"


def _category(title: str, description: str = "", default: str = "Other") -> str:
    text = f"{title} {description}".lower()
    if any(word in text for word in ("scholarship", "bursary", "financial aid")):
        return "Scholarship"
    if any(word in text for word in ("fellowship", "fellow ")):
        return "Fellowship"
    if any(word in text for word in ("hackathon", "hack-a-thon")):
        return "Hackathon"
    if any(word in text for word in ("internship", "intern ", "intern-", "co-op", "industrial training")):
        return "Internship"
    if any(word in text for word in ("workshop", "bootcamp", "boot camp")):
        return "Workshop"
    if any(word in text for word in ("challenge", "competition", "contest")):
        return "Competition"
    return default


def _student_role(title: str, description: str = "") -> bool:
    text = f"{title} {description}".lower()
    return any(word in text for word in (
        "intern", "internship", "co-op", "fellowship", "fellow ",
        "graduate program", "graduate programme", "early career",
        "student program", "student programme", "apprentice", "trainee"
    ))


def _make_opportunity(
    *,
    source: str,
    external_id: Any,
    title: str,
    organization: str,
    description: str,
    source_url: str,
    location: str = "Not specified",
    mode: str = "Not specified",
    category: str | None = None,
) -> Opportunity | None:
    title = _clean_text(title)[:180]
    source_url = str(source_url or "").strip()
    if len(title) < 2 or not source_url.startswith(("https://", "http://")):
        return None
    description = _clean_text(description)
    parsed_location = _clean_text(location) or "Not specified"
    return Opportunity(
        id=f"{_slug(source)}-{_slug(external_id or title)}",
        title=title,
        organization=_clean_text(organization) or source,
        category=category or _category(title, description),
        summary=(description[:450] or "Open the original listing to review details."),
        description=description[:8000],
        skills=[],
        eligible_years=[],
        eligible_fields=[],
        location=parsed_location[:240],
        mode=mode or "Not specified",
        source_url=source_url,
        source_name=source,
        deadline=None,
        start_date=None,
        last_verified=date.today(),
        status="needs_recheck",
        notes="Imported from a provider API. Confirm deadline and eligibility on the original listing.",
    )


async def _get_json(client: httpx.AsyncClient, url: str, **kwargs: Any) -> Any:
    response = await client.get(url, **kwargs)
    response.raise_for_status()
    return response.json()


async def _fetch_themuse() -> list[Opportunity]:
    api_key = os.getenv("THEMUSE_API_KEY", "").strip()
    if not api_key:
        return []
    url = "https://www.themuse.com/api/public/jobs"
    async with httpx.AsyncClient(timeout=_TIMEOUT, follow_redirects=True) as client:
        payload = await _get_json(
            client, url,
            params={"api_key": api_key, "page": 0, "level": "Internship"},
        )
    jobs = payload.get("results", []) if isinstance(payload, dict) else []
    results: list[Opportunity] = []
    for job in jobs[:_MAX_RESULTS]:
        if not isinstance(job, dict):
            continue
        refs = job.get("refs") or {}
        locations = job.get("locations") or []
        location = ", ".join(
            str(item.get("name", "")) for item in locations
            if isinstance(item, dict) and item.get("name")
        )
        company = job.get("company") or {}
        description = _clean_text(job.get("contents") or job.get("short_name") or "")
        opportunity = _make_opportunity(
            source="The Muse",
            external_id=job.get("id"),
            title=job.get("name") or job.get("title") or "",
            organization=company.get("name", "The Muse listing") if isinstance(company, dict) else "The Muse listing",
            description=description,
            source_url=refs.get("landing_page") or "",
            location=location,
            mode="Remote" if "remote" in location.lower() else "Not specified",
            category="Internship",
        )
        if opportunity:
            results.append(opportunity)
    return results


async def _fetch_adzuna() -> list[Opportunity]:
    app_id = os.getenv("ADZUNA_APP_ID", "").strip()
    app_key = os.getenv("ADZUNA_APP_KEY", "").strip()
    if not app_id or not app_key:
        return []
    country = os.getenv("ADZUNA_COUNTRY", "in").strip().lower()
    query = os.getenv("ADZUNA_QUERY", "internship").strip() or "internship"
    url = f"https://api.adzuna.com/v1/api/jobs/{country}/search/1"
    async with httpx.AsyncClient(timeout=_TIMEOUT, follow_redirects=True) as client:
        payload = await _get_json(
            client, url,
            params={
                "app_id": app_id,
                "app_key": app_key,
                "results_per_page": _MAX_RESULTS,
                "what": query,
                "content-type": "application/json",
            },
            headers={"Accept": "application/json"},
        )
    jobs = payload.get("results", []) if isinstance(payload, dict) else []
    results: list[Opportunity] = []
    for job in jobs[:_MAX_RESULTS]:
        if not isinstance(job, dict):
            continue
        company = job.get("company") or {}
        location = job.get("location") or {}
        description = _clean_text(job.get("description") or "")
        opportunity = _make_opportunity(
            source="Adzuna",
            external_id=job.get("id"),
            title=job.get("title") or "",
            organization=company.get("display_name", "Adzuna listing") if isinstance(company, dict) else "Adzuna listing",
            description=description,
            source_url=job.get("redirect_url") or "",
            location=location.get("display_name", "Not specified") if isinstance(location, dict) else "Not specified",
            category="Internship" if "intern" in (str(job.get("title", "")) + query).lower() else None,
        )
        if opportunity:
            results.append(opportunity)
    return results


async def _fetch_greenhouse() -> list[Opportunity]:
    boards = _csv_env("GREENHOUSE_BOARD_TOKENS")
    if not boards:
        return []
    async with httpx.AsyncClient(timeout=_TIMEOUT, follow_redirects=True) as client:
        async def board_jobs(token: str) -> list[Opportunity]:
            payload = await _get_json(
                client, f"https://boards-api.greenhouse.io/v1/boards/{token}/jobs",
                params={"content": "true"},
            )
            raw_jobs = payload.get("jobs", []) if isinstance(payload, dict) else []
            items: list[Opportunity] = []
            for job in raw_jobs:
                if not isinstance(job, dict):
                    continue
                description = _clean_text(job.get("content") or "")
                title = job.get("title") or ""
                if not _student_role(title, description):
                    continue
                location = job.get("location") or {}
                opportunity = _make_opportunity(
                    source=f"Greenhouse ({token})",
                    external_id=job.get("id"),
                    title=title,
                    organization=token,
                    description=description,
                    source_url=job.get("absolute_url") or "",
                    location=location.get("name", "Not specified") if isinstance(location, dict) else "Not specified",
                )
                if opportunity:
                    items.append(opportunity)
            return items
        lists = await asyncio.gather(*(board_jobs(token) for token in boards), return_exceptions=True)
    return [item for result in lists if isinstance(result, list) for item in result]


async def _fetch_lever() -> list[Opportunity]:
    sites = _csv_env("LEVER_SITES")
    if not sites:
        return []
    async with httpx.AsyncClient(timeout=_TIMEOUT, follow_redirects=True) as client:
        async def site_jobs(site: str) -> list[Opportunity]:
            payload = await _get_json(
                client, f"https://api.lever.co/v0/postings/{site}",
                params={"mode": "json"},
            )
            if not isinstance(payload, list):
                return []
            items: list[Opportunity] = []
            for job in payload:
                if not isinstance(job, dict):
                    continue
                title = job.get("text") or ""
                description = _clean_text(job.get("descriptionPlain") or job.get("description") or "")
                if not _student_role(title, description):
                    continue
                categories = job.get("categories") or {}
                location = categories.get("location", "Not specified") if isinstance(categories, dict) else "Not specified"
                opportunity = _make_opportunity(
                    source=f"Lever ({site})",
                    external_id=job.get("id"),
                    title=title,
                    organization=site,
                    description=description,
                    source_url=job.get("hostedUrl") or job.get("applyUrl") or "",
                    location=location,
                )
                if opportunity:
                    items.append(opportunity)
            return items
        lists = await asyncio.gather(*(site_jobs(site) for site in sites), return_exceptions=True)
    return [item for result in lists if isinstance(result, list) for item in result]


_PROVIDER_FETCHERS = {
    "themuse": _fetch_themuse,
    "adzuna": _fetch_adzuna,
    "greenhouse": _fetch_greenhouse,
    "lever": _fetch_lever,
}


def get_source_statuses() -> list[dict[str, Any]]:
    muse_configured = bool(os.getenv("THEMUSE_API_KEY", "").strip())
    adzuna_configured = bool(os.getenv("ADZUNA_APP_ID", "").strip() and os.getenv("ADZUNA_APP_KEY", "").strip())
    greenhouse_tokens = _csv_env("GREENHOUSE_BOARD_TOKENS")
    lever_sites = _csv_env("LEVER_SITES")
    return [
        {"id": "themuse", "name": "The Muse", "kind": "jobs_api", "configured": muse_configured,
         "status": "ready" if muse_configured else "needs_credentials",
         "detail": "Documented job API; register an app for ongoing use.", "docs_url": "https://www.themuse.com/developers/api/v2"},
        {"id": "adzuna", "name": "Adzuna", "kind": "jobs_api", "configured": adzuna_configured,
         "status": "ready" if adzuna_configured else "needs_credentials",
         "detail": "Requires app ID/key. Follow attribution, coverage and usage terms.", "docs_url": "https://developer.adzuna.com/overview"},
        {"id": "greenhouse", "name": "Greenhouse job boards", "kind": "company_job_boards", "configured": bool(greenhouse_tokens),
         "status": "ready" if greenhouse_tokens else "needs_board_tokens",
         "detail": "Public job-board API; configure board tokens for specific employers.", "docs_url": "https://developers.greenhouse.io/job-board.html"},
        {"id": "lever", "name": "Lever job boards", "kind": "company_job_boards", "configured": bool(lever_sites),
         "status": "ready" if lever_sites else "needs_site_names",
         "detail": "Public postings API for configured employer sites; not a global job index.", "docs_url": "https://github.com/lever/postings-api"},
        {"id": "unstop", "name": "Unstop", "kind": "hackathons_internships_fellowships",
         "configured": False, "status": "approval_required",
         "detail": "No public catalogue API verified; request an authorized listing feed or partnership.",
         "docs_url": "https://unstop.com/our-partners/become-a-partner/amp"},
        {"id": "devfolio", "name": "Devfolio", "kind": "hackathons", "configured": False,
         "status": "access_unconfirmed", "detail": "Public Explore catalogue exists; a supported listing API was not verified.",
         "docs_url": "https://devfolio.co/explore"},
        {"id": "hack2skill", "name": "Hack2Skill", "kind": "hackathons_challenges", "configured": False,
         "status": "approval_required", "detail": "Request authorized catalogue or partner-feed access.",
         "docs_url": "https://hack2skill.com/"},
        {"id": "mlh", "name": "Major League Hacking", "kind": "hackathons_fellowships", "configured": False,
         "status": "approval_required", "detail": "Documented API focuses on MyMLH user data, not a universal event catalogue.",
         "docs_url": "https://www.mlh.com/developers/docs"},
        {"id": "devpost", "name": "Devpost", "kind": "hackathons", "configured": False,
         "status": "permission_required", "detail": "Terms prohibit automated scraping; use an authorized feed or partnership.",
         "docs_url": "https://info.devpost.com/legal/terms-of-service"},
        {"id": "internshala", "name": "Internshala", "kind": "internships", "configured": False,
         "status": "access_unconfirmed", "detail": "Public listing API not verified; ask for an approved integration.",
         "docs_url": "https://internshala.com/"},
        {"id": "opportunity_desk", "name": "Opportunity Desk", "kind": "fellowships_scholarships_grants",
         "configured": False, "status": "feed_unverified", "detail": "Investigate official feeds and reuse permissions before integration.",
         "docs_url": "https://opportunitydesk.org/"},
        {"id": "buddy4study", "name": "Buddy4Study", "kind": "scholarships", "configured": False,
         "status": "access_unconfirmed", "detail": "Public listing API not verified; request an approved feed.",
         "docs_url": "https://www.buddy4study.com/"},
    ]


async def fetch_configured_opportunities() -> tuple[list[Opportunity], list[dict[str, Any]]]:
    """Fetch enabled providers concurrently; errors are isolated per provider."""
    statuses = {item["id"]: item for item in get_source_statuses()}
    enabled_ids = [source_id for source_id in _PROVIDER_FETCHERS if statuses[source_id]["configured"]]
    tasks = await asyncio.gather(
        *(_PROVIDER_FETCHERS[source_id]() for source_id in enabled_ids),
        return_exceptions=True,
    )
    opportunities: list[Opportunity] = []
    result_states: list[dict[str, Any]] = []
    for source_id, result in zip(enabled_ids, tasks):
        state = dict(statuses[source_id])
        if isinstance(result, BaseException):
            state["status"] = "error"
            state["last_error"] = type(result).__name__
            state["imported"] = 0
        else:
            state["status"] = "connected"
            state["imported"] = len(result)
            opportunities.extend(result)
        result_states.append(state)
    return opportunities, result_states
