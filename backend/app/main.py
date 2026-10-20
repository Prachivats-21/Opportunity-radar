import json
import logging
import os
from pathlib import Path
from urllib.parse import urlsplit
from typing import Any
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from .schemas import Opportunity, MatchRequest, MatchResult, ExtractRequest, ExtractResponse, SyncResponse
from .matcher import rank_opportunities
from .ai import AIServiceError, extract_opportunity, semantic_match_batch
from .ingest import sync_all_opportunities

ROOT = Path(__file__).resolve().parents[1]
DATA_FILE = ROOT / "data" / "opportunities.json"
logger = logging.getLogger(__name__)

def parse_cors_origins(value: str) -> list[str]:
    origins = []
    for entry in value.split(","):
        entry = entry.strip()
        if not entry:
            continue
        try:
            parsed = urlsplit(entry)
            port = parsed.port
        except ValueError as exc:
            raise RuntimeError("CORS_ORIGINS must contain valid HTTP(S) origins.") from exc
        if (
            entry == "*"
            or parsed.scheme not in {"http", "https"}
            or not parsed.hostname
            or any(char.isspace() for char in parsed.netloc)
            or parsed.username is not None
            or parsed.password is not None
            or parsed.path not in {"", "/"}
            or parsed.query
            or parsed.fragment
            or (port is not None and not 1 <= port <= 65535)
        ):
            raise RuntimeError("CORS_ORIGINS must contain valid HTTP(S) origins, without paths or wildcards.")
        origin = f"{parsed.scheme}://{parsed.netloc}"
        if origin not in origins:
            origins.append(origin)
    if not origins:
        raise RuntimeError("CORS_ORIGINS must contain at least one allowed origin.")
    return origins

origins = parse_cors_origins(
    os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174")
)
app = FastAPI(
    title="Opportunity Radar API",
    version="0.1.0",
    description="Explainable opportunity matching with optional local Gemma inference.",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response

@app.exception_handler(RequestValidationError)
async def handle_request_validation_error(
    request: Request,
    exc: RequestValidationError,
) -> JSONResponse:
    errors = [
        {
            "loc": error["loc"],
            "msg": error["msg"],
            "type": error["type"],
        }
        for error in exc.errors()[:20]
    ]
    return JSONResponse(
        status_code=422,
        content={"detail": "Request validation failed.", "errors": errors},
    )

def load_opportunities() -> list[Opportunity]:
    try:
        raw = json.loads(DATA_FILE.read_text(encoding="utf-8"))
        if not isinstance(raw, list):
            raise ValueError("Opportunity data must be a list.")
        return [Opportunity.model_validate(item) for item in raw]
    except (OSError, json.JSONDecodeError, TypeError, ValueError) as exc:
        logger.exception("Opportunity data could not be loaded.")
        raise HTTPException(status_code=500, detail="Opportunity data is temporarily unavailable.") from exc


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "opportunity-radar-api"}


@app.get("/ready")
def readiness() -> dict[str, str | int]:
    try:
        count = len(load_opportunities())
    except HTTPException as exc:
        raise HTTPException(status_code=503, detail="Opportunity data is not ready.") from exc
    return {"status": "ready", "service": "opportunity-radar-api", "opportunities": count}

@app.get("/api/opportunities", response_model=list[Opportunity])
def get_opportunities() -> list[Opportunity]:
    return load_opportunities()

@app.post("/api/match", response_model=list[MatchResult])
def match(request: MatchRequest) -> list[MatchResult]:
    opportunities = request.opportunities if request.opportunities is not None else load_opportunities()
    results = rank_opportunities(opportunities, request.profile)
    semantic = semantic_match_batch([result.opportunity for result in results], request.profile)
    if semantic:
        for result in results:
            extra = semantic.get(result.opportunity.id)
            if extra and extra.get("reasons"):
                result.reasons = list(dict.fromkeys(result.reasons + extra["reasons"]))
                result.explanation = " ".join(result.reasons)
    return results

@app.post("/api/extract", response_model=ExtractResponse)
def extract(request: ExtractRequest) -> ExtractResponse:
    try:
        data = extract_opportunity(request.raw_text, request.title_hint, str(request.source_url))
    except AIServiceError as exc:
        logger.warning("Opportunity extraction failed with upstream status %d.", exc.status_code)
        raise HTTPException(status_code=exc.status_code, detail=exc.public_message) from exc
    try:
        opportunity = Opportunity.model_validate(data)
    except ValueError as exc:
        logger.warning("Opportunity extraction returned data that failed schema validation.")
        raise HTTPException(status_code=502, detail="The AI service could not extract a valid opportunity.") from exc

    warnings = []
    if opportunity.deadline is None:
        warnings.append("No deadline was extracted. Confirm it on the original source.")
    if not opportunity.eligible_years and not opportunity.eligible_fields:
        warnings.append("Eligibility was not explicit in the source text. Confirm it with the organizer.")
    return ExtractResponse(opportunity=opportunity, warnings=warnings, ai_used=True)


@app.post("/api/sync", response_model=SyncResponse)
def sync_opportunities() -> SyncResponse:
    try:
        result = sync_all_opportunities(DATA_FILE)
        return SyncResponse.model_validate(result)
    except Exception as exc:
        logger.exception("Opportunity synchronization failed.")
        raise HTTPException(status_code=500, detail="Failed to sync live opportunities.") from exc

