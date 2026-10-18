import json
import os
import secrets
from pathlib import Path
from urllib.parse import urlsplit

from fastapi import BackgroundTasks, FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .schemas import Opportunity, MatchRequest, MatchResult, ExtractRequest, ExtractResponse
from .matcher import rank_opportunities
from .ai import extract_opportunity, semantic_match_batch
from .sources import (
    maybe_auto_sync_sources,
    read_imported_opportunities,
    source_overview,
    sync_configured_sources,
)

ROOT = Path(__file__).resolve().parents[1]
DATA_FILE = ROOT / "data" / "opportunities.json"

app = FastAPI(
    title="Opportunity Radar API",
    version="0.2.0",
    description="Student opportunity discovery, source syncing, explainable matching, and optional local Gemma inference.",
)
origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in origins],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


class SourceSyncRequest(BaseModel):
    source_ids: list[str] | None = Field(default=None, max_length=20)


def _url_dedupe_key(url: str) -> str:
    """Normalize URLs for duplicate detection while preserving original application URLs."""
    parts = urlsplit(url)
    return f"{parts.scheme.lower()}://{parts.netloc.lower()}{parts.path.rstrip('/')}"


def load_opportunities() -> list[Opportunity]:
    """Load curated seeds plus successfully imported listings; seeds win duplicates."""
    try:
        raw = json.loads(DATA_FILE.read_text(encoding="utf-8"))
        curated = [Opportunity.model_validate(item) for item in raw]
    except (OSError, json.JSONDecodeError, ValueError) as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Opportunity data could not be loaded: {type(exc).__name__}",
        ) from exc

    merged: list[Opportunity] = []
    seen_ids: set[str] = set()
    seen_urls: set[str] = set()
    for opportunity in [*curated, *read_imported_opportunities()]:
        url_key = _url_dedupe_key(str(opportunity.source_url))
        if opportunity.id in seen_ids or url_key in seen_urls:
            continue
        seen_ids.add(opportunity.id)
        seen_urls.add(url_key)
        merged.append(opportunity)
    return merged


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "opportunity-radar-api"}


@app.get("/api/sources")
def get_sources() -> dict:
    """List data-source readiness, cached data counts, and the last sync time."""
    return source_overview()


@app.post("/api/sources/sync")
def sync_sources(
    payload: SourceSyncRequest | None = None,
    request: Request = None,  # FastAPI injects the request; default keeps OpenAPI body optional.
    x_source_sync_token: str | None = Header(default=None),
) -> dict:
    """Synchronize configured sources. Protect remote deployments with a server-side token."""
    sync_token = os.getenv("OPPORTUNITY_RADAR_SYNC_TOKEN", "").strip()
    remote_host = request.client.host if request and request.client else ""
    if sync_token:
        if not x_source_sync_token or not secrets.compare_digest(x_source_sync_token, sync_token):
            raise HTTPException(status_code=403, detail="A valid source-sync token is required.")
    elif remote_host not in {"127.0.0.1", "::1", "testclient"}:
        raise HTTPException(
            status_code=403,
            detail="Set OPPORTUNITY_RADAR_SYNC_TOKEN before enabling source sync on a remote deployment.",
        )

    requested_sources = payload.source_ids if payload else None
    result = sync_configured_sources(requested_sources)
    if result.get("status") == "invalid_source_ids":
        raise HTTPException(status_code=400, detail=result)
    return result


@app.get("/api/opportunities", response_model=list[Opportunity])
def get_opportunities(background_tasks: BackgroundTasks) -> list[Opportunity]:
    # Never delay the initial feed request while external providers respond.
    # Only configured sources are considered and each keeps its own last good cache.
    background_tasks.add_task(maybe_auto_sync_sources)
    return load_opportunities()


@app.post("/api/match", response_model=list[MatchResult])
def match(request: MatchRequest) -> list[MatchResult]:
    opportunities = request.opportunities if request.opportunities is not None else load_opportunities()
    results = rank_opportunities(opportunities, request.profile)
    # One model request for the result set. Rules remain the authority for eligibility.
    semantic = semantic_match_batch([result.opportunity for result in results], request.profile)
    if semantic:
        for result in results:
            extra = semantic.get(result.opportunity.id)
            if extra and extra.get("reasons"):
                rule_notes = [
                    reason for reason in result.reasons
                    if "eligibility" in reason.lower()
                    or "deadline" in reason.lower()
                    or "requirement" in reason.lower()
                ]
                result.reasons = extra["reasons"] + rule_notes[:1]
                result.skill_gaps = extra.get("skill_gaps", result.skill_gaps)
                result.explanation = " ".join(result.reasons)
    return results


@app.post("/api/extract", response_model=ExtractResponse)
def extract(request: ExtractRequest) -> ExtractResponse:
    data, error = extract_opportunity(request.raw_text, request.title_hint, str(request.source_url))
    if error or data is None:
        raise HTTPException(status_code=503, detail=error or "AI extraction unavailable")
    try:
        opportunity = Opportunity.model_validate(data)
    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail=f"Model output failed schema validation: {exc}",
        ) from exc

    warnings = []
    if opportunity.deadline is None:
        warnings.append("No deadline was extracted. Confirm it on the original source.")
    if not opportunity.eligible_years and not opportunity.eligible_fields:
        warnings.append("Eligibility was not explicit in the source text. Confirm it with the organizer.")
    return ExtractResponse(opportunity=opportunity, warnings=warnings, ai_used=True)
