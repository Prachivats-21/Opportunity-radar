"""Approved opportunity-source adapters for Opportunity Radar.

Only source connectors with a documented/authorized retrieval method are executable.
Other providers are visible in the registry as pending partner/API access; no scraping
or guessed endpoints are used for those providers.
"""
from __future__ import annotations

import hashlib
import html
import json
import os
import re
import threading
import time
import xml.etree.ElementTree as ET
from datetime import date, datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

import httpx

from .schemas import Opportunity

DATA_ROOT = Path(__file__).resolve().parents[1] / "data"
IMPORTS_FILE = DATA_ROOT / "imported_opportunities.json"
HTTP_TIMEOUT = float(os.getenv("OPPORTUNITY_SOURCE_TIMEOUT_SECONDS", "10"))
SYNC_INTERVAL_MINUTES = max(5, int(os.getenv("OPPORTUNITY_SOURCE_SYNC_INTERVAL_MINUTES", "360")))
_AUTO_SYNC_ENABLED = os.getenv("OPPORTUNITY_SOURCE_AUTO_SYNC", "true").strip().lower() not in {"0", "false", "no"}
_LAST_AUTO_SYNC = 0.0
_SYNC_LOCK = threading.Lock()
USER_AGENT = "OpportunityRadar/0.1 (+https://github.com/Prachivats-21/Opportunity-radar)"

# Keep these entries honest: approval-required sources are discoverable but are not
# called until they publish/approve a compatible data feed.
PARTNER_SOURCES: list[dict[str, Any]] = [
    {"id": "unstop", "name": "Unstop", "types": ["hackathons", "internships", "competitions", "fellowships", "scholarships"], "mode": "partner_api", "docs_url": "https://unstop.com/our-partners/become-a-partner/amp", "note": "No public opportunity-listing API verified. Request an authorized catalogue/feed integration."},
    {"id": "devfolio", "name": "Devfolio", "types": ["hackathons"], "mode": "partner_api", "docs_url": "https://devfolio.co/explore", "note": "Public discovery page found; catalogue API access not verified."},
    {"id": "hack2skill", "name": "Hack2Skill", "types": ["hackathons", "challenges", "fellowships"], "mode": "partner_api", "docs_url": "https://hack2skill.com/", "note": "Request authorized listing-feed access."},
    {"id": "internshala", "name": "Internshala", "types": ["internships", "training"], "mode": "partner_api", "docs_url": "https://internshala.com/", "note": "No public opportunity-listing API verified."},
    {"id": "mlh", "name": "Major League Hacking", "types": ["hackathons", "fellowships"], "mode": "partner_api", "docs_url": "https://www.mlh.com/developers/docs", "note": "Documented API covers MyMLH use cases, not a universal public event catalogue."},
    {"id": "devpost", "name": "Devpost", "types": ["hackathons"], "mode": "partner_api", "docs_url": "https://info.devpost.com/legal/terms-of-service", "note": "Do not scrape; obtain permission or a supported feed."},
    {"id": "opportunity_desk", "name": "Opportunity Desk", "types": ["fellowships", "scholarships", "grants", "internships"], "mode": "feed_or_partner", "docs_url": "https://opportunitydesk.org/", "note": "No public official listing API verified. Configure only an official feed or approved source."},
    {"id": "national_scholarship_portal", "name": "National Scholarship Portal (India)", "types": ["scholarships"], "mode": "government_data_or_partner", "docs_url": "https://scholarships.gov.in/", "note": "No public listing API verified in this implementation."},
]

def _split_env(name: str) -> list[str]:
    return [value.strip() for value in os.getenv(name, "").split(",") if value.strip()]

def source_statuses() -> list[dict[str, Any]]:
    """Return configuration status without ever exposing keys or secret values."""
    muse_key = bool(os.getenv("THE_MUSE_API_KEY"))
    adzuna_ready = bool(os.getenv("ADZUNA_APP_ID") and os.getenv("ADZUNA_APP_KEY"))
    greenhouse_boards = _split_env("GREENHOUSE_BOARD_TOKENS")
    lever_sites = _split_env("LEVER_SITE_NAMES")
    rss_feeds = _split_env("OPPORTUNITY_RADAR_RSS_FEEDS")
    configured = {
        "the_muse": muse_key,
        "adzuna": adzuna_ready,
        "greenhouse": bool(greenhouse_boards),
        "lever": bool(lever_sites),
        "rss": bool(rss_feeds),
    }
    entries = [
        {"id": "the_muse", "name": "The Muse", "types": ["internships", "jobs"], "mode": "documented_api", "docs_url": "https://www.themuse.com/developers/api/v2", "requirements": ["THE_MUSE_API_KEY"], "configured": configured["the_muse"], "status": "ready" if configured["the_muse"] else "credentials_required", "note": "Fetches public listings and filters for student/early-career opportunities."},
        {"id": "adzuna", "name": "Adzuna", "types": ["internships", "jobs"], "mode": "documented_api", "docs_url": "https://developer.adzuna.com/overview", "requirements": ["ADZUNA_APP_ID", "ADZUNA_APP_KEY"], "configured": configured["adzuna"], "status": "ready" if configured["adzuna"] else "credentials_required", "note": "Country and usage coverage depend on your Adzuna account and terms."},
        {"id": "greenhouse", "name": "Greenhouse public job boards", "types": ["internships", "student programs"], "mode": "public_company_boards", "docs_url": "https://docs.greenhouse.io/job-board", "requirements": ["GREENHOUSE_BOARD_TOKENS"], "configured": configured["greenhouse"], "status": "ready" if configured["greenhouse"] else "board_tokens_required", "note": "Reads published posts only for the company board tokens you configure; not a global job search."},
        {"id": "lever", "name": "Lever public postings", "types": ["internships", "student programs"], "mode": "public_company_boards", "docs_url": "https://github.com/lever/postings-api", "requirements": ["LEVER_SITE_NAMES"], "configured": configured["lever"], "status": "ready" if configured["lever"] else "site_names_required", "note": "Reads published posts only for configured company sites; not a global job search."},
        {"id": "rss", "name": "Configured RSS/Atom feeds", "types": ["hackathons", "internships", "fellowships", "scholarships", "competitions"], "mode": "publisher_feed", "docs_url": "https://validator.w3.org/feed/", "requirements": ["OPPORTUNITY_RADAR_RSS_FEEDS"], "configured": configured["rss"], "status": "ready" if configured["rss"] else "feed_urls_required", "note": "Only publisher-provided or otherwise authorized feed URLs; comma-separated."},
    ]
    for item in PARTNER_SOURCES:
        entries.append({**item, "requirements": ["Provider-approved API/feed access"], "configured": False, "status": "partner_approval_required"})
    return entries

class _HTMLText(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.parts: list[str] = []
    def handle_data(self, data: str) -> None:
        text = data.strip()
        if text:
            self.parts.append(text)

def _plain_text(value: Any, limit: int = 6000) -> str:
    if not isinstance(value, str):
        return ""
    parser = _HTMLText()
    try:
        parser.feed(value)
        parsed = " ".join(parser.parts)
    except Exception:
        parsed = value
    return re.sub(r"\s+", " ", html.unescape(parsed)).strip()[:limit]

def _category(text: str) -> str:
    value = text.casefold()
    if any(word in value for word in ("scholarship", "bursary", "financial aid")):
        return "Scholarship"
    if any(word in value for word in ("fellowship", "mentorship cohort", "mentorship program")):
        return "Fellowship"
    if any(word in value for word in ("hackathon", "hack day", "hack-day")):
        return "Hackathon"
    if any(word in value for word in ("internship", "intern ", " intern", "intern-", "apprentice", "trainee program", "student program")):
        return "Internship"
    if any(word in value for word in ("competition", "contest", "challenge", "olympiad")):
        return "Competition"
    if any(word in value for word in ("workshop", "bootcamp", "boot camp")):
        return "Workshop"
    return "Other"

def _is_relevant(title: str, content: str) -> bool:
    category = _category(title + " " + content[:3000])
    return category != "Other"

def _safe_url(value: Any) -> str | None:
    if not isinstance(value, str):
        return None
    value = value.strip()
    parsed = urlparse(value)
    if parsed.scheme not in {"https", "http"} or not parsed.netloc:
        return None
    return value[:2000]

def _stable_id(prefix: str, value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.casefold()).strip("-")[:48]
    digest = hashlib.sha256(value.encode("utf-8")).hexdigest()[:12]
    return f"{prefix}-{slug or 'listing'}-{digest}"

def _opportunity(
    *, prefix: str, key: str, title: str, organization: str, content: str,
    url: str, source_name: str, location: str = "Not specified", mode: str = "Not specified"
) -> dict[str, Any] | None:
    safe_url = _safe_url(url)
    title = _plain_text(title, 180)
    content = _plain_text(content)
    if not safe_url or len(title) < 2 or not _is_relevant(title, content):
        return None
    summary = content[:400].strip() or f"{_category(title)} listing from {source_name}. Review the original source for details."
    return {
        "id": _stable_id(prefix, key or safe_url),
        "title": title,
        "organization": _plain_text(organization, 180) or source_name,
        "category": _category(title + " " + content[:3000]),
        "summary": summary,
        "description": content,
        "skills": [],
        "eligible_years": [],
        "eligible_fields": [],
        "location": _plain_text(location, 240) or "Not specified",
        "mode": _plain_text(mode, 120) or "Not specified",
        "team_min": None,
        "team_max": None,
        "deadline": None,
        "start_date": None,
        "source_url": safe_url,
        "source_name": source_name,
        "last_verified": date.today().isoformat(),
        "status": "needs_recheck",
        "notes": "Imported listing. Deadline and eligibility were not inferred; verify all details on the original source.",
    }

def _get_json(url: str, params: dict[str, Any] | None = None) -> Any:
    response = httpx.get(url, params=params, timeout=HTTP_TIMEOUT, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
    response.raise_for_status()
    return response.json()

def _fetch_the_muse() -> list[dict[str, Any]]:
    api_key = os.getenv("THE_MUSE_API_KEY")
    if not api_key:
        raise RuntimeError("THE_MUSE_API_KEY is not configured")
    output: list[dict[str, Any]] = []
    for page in range(max(1, min(5, int(os.getenv("THE_MUSE_MAX_PAGES", "3"))))):
        payload = _get_json("https://www.themuse.com/api/public/jobs", {"page": page, "api_key": api_key})
        rows = payload.get("results", []) if isinstance(payload, dict) else []
        if not rows:
            break
        for row in rows:
            company = row.get("company") if isinstance(row.get("company"), dict) else {}
            content = _plain_text(row.get("contents", ""))
            locations = row.get("locations") or []
            location = ", ".join(str(x.get("name", "")) for x in locations if isinstance(x, dict) and x.get("name")) or "Not specified"
            refs = row.get("refs") if isinstance(row.get("refs"), dict) else {}
            opportunity = _opportunity(
                prefix="muse", key=str(row.get("id") or refs.get("landing_page") or row.get("name", "")),
                title=str(row.get("name", "")), organization=str(company.get("name", "The Muse")),
                content=content, url=str(refs.get("landing_page", "")), source_name="The Muse", location=location,
            )
            if opportunity:
                output.append(opportunity)
    return output

def _fetch_adzuna() -> list[dict[str, Any]]:
    app_id, app_key = os.getenv("ADZUNA_APP_ID"), os.getenv("ADZUNA_APP_KEY")
    if not app_id or not app_key:
        raise RuntimeError("ADZUNA_APP_ID and ADZUNA_APP_KEY are not configured")
    country = re.sub(r"[^a-z]", "", os.getenv("ADZUNA_COUNTRY", "in").lower()) or "in"
    query = os.getenv("ADZUNA_INTERNSHIP_QUERY", "internship")
    payload = _get_json(
        f"https://api.adzuna.com/v1/api/jobs/{country}/search/1",
        {"app_id": app_id, "app_key": app_key, "results_per_page": 50, "what": query, "sort_by": "date", "content-type": "application/json"},
    )
    output: list[dict[str, Any]] = []
    for row in payload.get("results", []) if isinstance(payload, dict) else []:
        location = row.get("location") if isinstance(row.get("location"), dict) else {}
        company = row.get("company") if isinstance(row.get("company"), dict) else {}
        opportunity = _opportunity(
            prefix="adzuna", key=str(row.get("id", "")), title=str(row.get("title", "")),
            organization=str(company.get("display_name", "Adzuna listing")), content=str(row.get("description", "")),
            url=str(row.get("redirect_url", "")), source_name="Adzuna",
            location=str(location.get("display_name", "Not specified")), mode="Not specified",
        )
        if opportunity and opportunity["category"] == "Internship":
            output.append(opportunity)
    return output

def _fetch_greenhouse() -> list[dict[str, Any]]:
    boards = _split_env("GREENHOUSE_BOARD_TOKENS")
    if not boards:
        raise RuntimeError("GREENHOUSE_BOARD_TOKENS is not configured")
    output: list[dict[str, Any]] = []
    for board in boards[:20]:
        if not re.fullmatch(r"[A-Za-z0-9_-]+", board):
            continue
        payload = _get_json(f"https://boards-api.greenhouse.io/v1/boards/{board}/jobs", {"content": "true"})
        for row in payload.get("jobs", []) if isinstance(payload, dict) else []:
            content = _plain_text(row.get("content", ""))
            location = row.get("location") if isinstance(row.get("location"), dict) else {}
            opportunity = _opportunity(
                prefix="greenhouse", key=f"{board}:{row.get('id', '')}", title=str(row.get("title", "")),
                organization=board.replace("-", " ").title(), content=content,
                url=str(row.get("absolute_url", "")), source_name=f"Greenhouse · {board}",
                location=str(location.get("name", "Not specified")),
            )
            if opportunity and opportunity["category"] == "Internship":
                output.append(opportunity)
    return output

def _fetch_lever() -> list[dict[str, Any]]:
    sites = _split_env("LEVER_SITE_NAMES")
    if not sites:
        raise RuntimeError("LEVER_SITE_NAMES is not configured")
    output: list[dict[str, Any]] = []
    for site in sites[:20]:
        if not re.fullmatch(r"[A-Za-z0-9_-]+", site):
            continue
        rows = _get_json(f"https://api.lever.co/v0/postings/{site}", {"mode": "json", "limit": 100, "skip": 0})
        for row in rows if isinstance(rows, list) else []:
            categories = row.get("categories") if isinstance(row.get("categories"), dict) else {}
            content = _plain_text(row.get("descriptionPlain") or row.get("description") or "")
            opportunity = _opportunity(
                prefix="lever", key=f"{site}:{row.get('id', '')}", title=str(row.get("text", "")),
                organization=site.replace("-", " ").title(), content=content,
                url=str(row.get("hostedUrl") or row.get("applyUrl") or ""), source_name=f"Lever · {site}",
                location=str(categories.get("location", "Not specified")),
                mode=str(row.get("workplaceType", "Not specified")),
            )
            if opportunity and opportunity["category"] == "Internship":
                output.append(opportunity)
    return output

def _xml_child(element: ET.Element, names: set[str]) -> str:
    for child in list(element):
        local = child.tag.rsplit("}", 1)[-1].casefold()
        if local in names:
            if local == "link":
                href = child.attrib.get("href")
                if href:
                    return href.strip()
            return "".join(child.itertext()).strip()
    return ""

def _fetch_rss() -> list[dict[str, Any]]:
    feeds = _split_env("OPPORTUNITY_RADAR_RSS_FEEDS")
    if not feeds:
        raise RuntimeError("OPPORTUNITY_RADAR_RSS_FEEDS is not configured")
    output: list[dict[str, Any]] = []
    for feed_url in feeds[:20]:
        safe_feed_url = _safe_url(feed_url)
        if not safe_feed_url:
            continue
        response = httpx.get(safe_feed_url, timeout=HTTP_TIMEOUT, headers={"User-Agent": USER_AGENT, "Accept": "application/rss+xml, application/atom+xml, application/xml, text/xml"})
        response.raise_for_status()
        root = ET.fromstring(response.content)
        publisher = urlparse(safe_feed_url).netloc.removeprefix("www.") or "RSS source"
        items = [element for element in root.iter() if element.tag.rsplit("}", 1)[-1].casefold() in {"item", "entry"}]
        for item in items[:100]:
            title = _xml_child(item, {"title"})
            link = _xml_child(item, {"link"})
            description = _xml_child(item, {"description", "summary", "encoded", "content"})
            if link.startswith("/") and urlparse(safe_feed_url).scheme:
                parsed = urlparse(safe_feed_url)
                link = f"{parsed.scheme}://{parsed.netloc}{link}"
            opportunity = _opportunity(
                prefix="rss", key=f"{publisher}:{link or title}", title=title, organization=publisher,
                content=description, url=link, source_name=f"RSS · {publisher}",
            )
            if opportunity:
                output.append(opportunity)
    return output

FETCHERS = {
    "the_muse": _fetch_the_muse,
    "adzuna": _fetch_adzuna,
    "greenhouse": _fetch_greenhouse,
    "lever": _fetch_lever,
    "rss": _fetch_rss,
}

def _read_imports() -> dict[str, list[dict[str, Any]]]:
    try:
        raw = json.loads(IMPORTS_FILE.read_text(encoding="utf-8"))
        if not isinstance(raw, dict) or not isinstance(raw.get("sources"), dict):
            return {}
        result: dict[str, list[dict[str, Any]]] = {}
        for source_id, items in raw["sources"].items():
            if not isinstance(items, list):
                continue
            valid = []
            for item in items:
                try:
                    opp = Opportunity.model_validate(item)
                    valid.append(opp.model_dump(mode="json"))
                except Exception:
                    continue
            result[str(source_id)] = valid
        return result
    except (OSError, json.JSONDecodeError):
        return {}

def read_imported_opportunities() -> list[Opportunity]:
    merged: dict[str, Opportunity] = {}
    for rows in _read_imports().values():
        for row in rows:
            try:
                opportunity = Opportunity.model_validate(row)
                merged[opportunity.id] = opportunity
            except Exception:
                continue
    return list(merged.values())

def _write_imports(by_source: dict[str, list[dict[str, Any]]], synced_at: str) -> None:
    DATA_ROOT.mkdir(parents=True, exist_ok=True)
    temporary = IMPORTS_FILE.with_suffix(".tmp")
    temporary.write_text(json.dumps({"synced_at": synced_at, "sources": by_source}, ensure_ascii=False, indent=2), encoding="utf-8")
    temporary.replace(IMPORTS_FILE)

def configured_source_ids() -> list[str]:
    return [entry["id"] for entry in source_statuses() if entry["id"] in FETCHERS and entry.get("configured")]

def sync_configured_sources(source_ids: list[str] | None = None) -> dict[str, Any]:
    """Sync configured providers and retain cached records when a provider fails."""
    if not _SYNC_LOCK.acquire(blocking=False):
        return {"status": "already_running", "synced_at": None, "results": [], "imported_count": len(read_imported_opportunities())}
    try:
        allowed = configured_source_ids()
        requested = list(dict.fromkeys(source_ids or allowed))
        unknown = [source_id for source_id in requested if source_id not in FETCHERS]
        if unknown:
            return {"status": "invalid_source_ids", "invalid_source_ids": unknown, "synced_at": None, "results": [], "imported_count": len(read_imported_opportunities())}
        cache = _read_imports()
        statuses = {entry["id"]: entry for entry in source_statuses()}
        results: list[dict[str, Any]] = []
        for source_id in requested:
            if source_id not in allowed:
                reason = statuses.get(source_id, {}).get("status", "not_configured")
                results.append({"source_id": source_id, "status": reason, "items_received": 0, "cached_items": len(cache.get(source_id, []))})
                continue
            try:
                items = FETCHERS[source_id]()
                valid: dict[str, dict[str, Any]] = {}
                for item in items:
                    try:
                        opportunity = Opportunity.model_validate(item)
                        valid[opportunity.id] = opportunity.model_dump(mode="json")
                    except Exception:
                        continue
                cache[source_id] = list(valid.values())
                results.append({"source_id": source_id, "status": "ok", "items_received": len(valid), "cached_items": len(valid)})
            except (httpx.HTTPError, ValueError, RuntimeError, ET.ParseError) as exc:
                results.append({"source_id": source_id, "status": "error", "items_received": 0, "cached_items": len(cache.get(source_id, [])), "error": type(exc).__name__})
        synced_at = datetime.now(timezone.utc).isoformat()
        _write_imports(cache, synced_at)
        return {"status": "ok" if all(row["status"] in {"ok", "not_configured", "credentials_required", "board_tokens_required", "site_names_required", "feed_urls_required"} for row in results) else "partial", "synced_at": synced_at, "results": results, "imported_count": len(read_imported_opportunities())}
    finally:
        _SYNC_LOCK.release()

def maybe_auto_sync_sources() -> None:
    global _LAST_AUTO_SYNC
    if not _AUTO_SYNC_ENABLED or not configured_source_ids():
        return
    now = time.monotonic()
    if now - _LAST_AUTO_SYNC < SYNC_INTERVAL_MINUTES * 60:
        return
    # Avoid blocking simultaneous feed requests on separate sync attempts.
    if not _SYNC_LOCK.acquire(blocking=False):
        return
    _SYNC_LOCK.release()
    _LAST_AUTO_SYNC = now
    sync_configured_sources()


def source_overview() -> dict[str, Any]:
    """Provider-safe source status including sync timestamps and cached record counts."""
    try:
        raw = json.loads(IMPORTS_FILE.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        raw = {}
    cached = raw.get("sources", {}) if isinstance(raw, dict) else {}
    statuses = source_statuses()
    for item in statuses:
        rows = cached.get(item["id"], []) if isinstance(cached, dict) else []
        item["cached_items"] = len(rows) if isinstance(rows, list) else 0
        if item["id"] in FETCHERS and item.get("configured") and item["cached_items"] > 0:
            item["status"] = "connected_with_cached_data"
    return {
        "synced_at": raw.get("synced_at") if isinstance(raw, dict) else None,
        "configured_count": len(configured_source_ids()),
        "cached_opportunity_count": len(read_imported_opportunities()),
        "sources": statuses,
        "sync_interval_minutes": SYNC_INTERVAL_MINUTES,
        "automatic_sync_enabled": _AUTO_SYNC_ENABLED,
    }
