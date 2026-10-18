import json
import os
import secrets
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env")

from .schemas import Opportunity, MatchRequest, MatchResult, ExtractRequest, ExtractResponse
from .matcher import rank_opportunities
from .ai import extract_opportunity, semantic_match_batch
from .sources import fetch_configured_opportunities, get_source_statuses

DATA_FILE = ROOT / "data" / "opportunities.json"
IMPORTED_FILE = ROOT / "data" / "imported_opportunities.json"

app = FastAPI(
    title="Opportunity Radar API",
    version="0.2.0",
    description="Student-opportunity discovery, explainable matching, AI extraction, and configured source integrations.",
)
origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in origins],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

_last_sync: dict[str, Any] = {"last_sync_at": None, "providers": []}


def _read_imported_opportunities() -> list[Opportunity]:
    if not IMPORTED_FILE.exists():
        return []
    try:
        raw = json.loads(IMPORTED_FILE.read_text(encoding="utf-8"))
        if not isinstance(raw, list):
            raise ValueError("Imported opportunity cache must be a JSON list")
        return [Opportunity.model_validate(item) for item in raw]
    except (OSError, json.JSONDecodeError, ValueError) as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Imported opportunity cache could not be loaded: {type(exc).__name__}",
        ) from exc


def load_opportunities() -> list[Opportunity]:
    try:
        raw = json.loads(DATA_FILE.read_text(encoding="utf-8"))
        if not isinstance(raw, list):
            raise ValueError("Seed opportunity data must be a JSON list")
        seed = [Opportunity.model_validate(item) for item in raw]
    except (OSError, json.JSONDecodeError, ValueError) as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Opportunity data could not be loaded: {type(exc).__name__}",
        ) from exc

    # Imported records take precedence by stable provider-derived ID.
    combined: dict[str, Opportunity] = {item.id: item for item in seed}
    for item in _read_imported_opportunities():
        combined[item.id] = item
    return list(combined.values())


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "opportunity-radar-api"}


@app.get("/api/opportunities", response_model=list[Opportunity])
def get_opportunities() -> list[Opportunity]:
    """Return seed records plus any records saved by successful source syncs."""
    return load_opportunities()


@app.get("/api/sources")
def list_sources() -> dict[str, Any]:
    """Show provider capabilities and configuration state without exposing secrets."""
    return {
        "sources": get_source_statuses(),
        "last_sync": _last_sync,
        "cached_import_count": len(_read_imported_opportunities()),
    }


@app.post("/api/sources/sync")
async def sync_sources(x_sync_token: str | None = Header(default=None, alias="X-Sync-Token")) -> dict[str, Any]:
    """Refresh configured sources. Protected by a server-side sync token."""
    expected_token = os.getenv("SOURCE_SYNC_TOKEN", "").strip()
    if not expected_token:
        raise HTTPException(
            status_code=503,
            detail="Source sync is disabled until SOURCE_SYNC_TOKEN is configured on the backend.",
        )
    if not x_sync_token or not secrets.compare_digest(x_sync_token, expected_token):
        raise HTTPException(status_code=401, detail="Invalid or missing source sync token.")

    imported, provider_states = await fetch_configured_opportunities()
    cached_by_id = {item.id: item for item in _read_imported_opportunities()}
    for item in imported:
        cached_by_id[item.id] = item
    updated = list(cached_by_id.values())

    try:
        IMPORTED_FILE.parent.mkdir(parents=True, exist_ok=True)
        temporary_file = IMPORTED_FILE.with_suffix(".json.tmp")
        temporary_file.write_text(
            json.dumps([item.model_dump(mode="json") for item in updated], ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        temporary_file.replace(IMPORTED_FILE)
    except OSError as exc:
        raise HTTPException(status_code=500, detail=f"Could not save imported opportunity cache: {type(exc).__name__}") from exc

    _last_sync = {
        "last_sync_at": datetime.now(timezone.utc).isoformat(),
        "providers": provider_states,
        "fetched_this_sync": len(imported),
        "cached_import_count": len(updated),
    }
    return _last_sync


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
                    r for r in result.reasons
                    if "eligibility" in r.lower() or "deadline" in r.lower() or "requirement" in r.lower()
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
            detail=f"Model output failed schema validation: {exc}"
        ) from exc

    warnings = []
    if opportunity.deadline is None:
        warnings.append("No deadline was extracted. Confirm it on the original source.")
    if not opportunity.eligible_years and not opportunity.eligible_fields:
        warnings.append("Eligibility was not explicit in the source text. Confirm it with the organizer.")
    return ExtractResponse(opportunity=opportunity, warnings=warnings, ai_used=True)
