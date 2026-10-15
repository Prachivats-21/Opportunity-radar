import json
import os
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .schemas import Opportunity, MatchRequest, MatchResult, ExtractRequest, ExtractResponse
from .matcher import rank_opportunities
from .ai import extract_opportunity, semantic_match_batch

ROOT = Path(__file__).resolve().parents[1]
DATA_FILE = ROOT / "data" / "opportunities.json"

app = FastAPI(title="Opportunity Radar API", version="0.1.0", description="Explainable opportunity matching with optional local Gemma inference.")
origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
app.add_middleware(CORSMiddleware, allow_origins=[origin.strip() for origin in origins], allow_credentials=False, allow_methods=["GET", "POST", "OPTIONS"], allow_headers=["*"])


def load_opportunities() -> list[Opportunity]:
    try:
        raw = json.loads(DATA_FILE.read_text(encoding="utf-8"))
        return [Opportunity.model_validate(item) for item in raw]
    except (OSError, json.JSONDecodeError, ValueError) as exc:
        raise HTTPException(status_code=500, detail=f"Opportunity data could not be loaded: {type(exc).__name__}") from exc


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "opportunity-radar-api"}


@app.get("/api/opportunities", response_model=list[Opportunity])
def get_opportunities() -> list[Opportunity]:
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
                rule_notes = [r for r in result.reasons if "eligibility" in r.lower() or "deadline" in r.lower() or "requirement" in r.lower()]
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
        raise HTTPException(status_code=422, detail="Model output failed schema validation. Review the source and try again.") from exc
    warnings = []
    if opportunity.deadline is None:
        warnings.append("No deadline was extracted. Confirm it on the original source.")
    if not opportunity.eligible_years and not opportunity.eligible_fields:
        warnings.append("Eligibility was not explicit in the source text. Confirm it with the organizer.")
    return ExtractResponse(opportunity=opportunity, warnings=warnings, ai_used=True)
