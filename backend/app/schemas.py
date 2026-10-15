from datetime import date
from typing import Literal
from pydantic import BaseModel, Field, HttpUrl, ConfigDict

OpportunityCategory = Literal["Hackathon", "Internship", "Competition", "Fellowship", "Scholarship", "Workshop", "Other"]
Eligibility = Literal["eligible", "potentially_eligible", "not_eligible", "unknown", "expired"]


class Opportunity(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    title: str = Field(min_length=2, max_length=180)
    organization: str = "Unknown organizer"
    category: OpportunityCategory = "Other"
    summary: str = ""
    description: str = ""
    skills: list[str] = Field(default_factory=list)
    eligible_years: list[str] = Field(default_factory=list)
    eligible_fields: list[str] = Field(default_factory=list)
    location: str = "Not specified"
    mode: str = "Not specified"
    team_min: int | None = Field(default=None, ge=1, le=100)
    team_max: int | None = Field(default=None, ge=1, le=100)
    deadline: date | None = None
    start_date: date | None = None
    source_url: HttpUrl
    source_name: str = "Source"
    last_verified: date | None = None
    status: str = "needs_recheck"
    notes: str = ""


class StudentProfile(BaseModel):
    year: str = "Not specified"
    field: str = "Not specified"
    skills: list[str] = Field(default_factory=list)
    interests: list[str] = Field(default_factory=list)
    preferred_categories: list[OpportunityCategory] = Field(default_factory=list)
    preferred_mode: str = "Any"
    location: str = "India"
    team_size: int | None = Field(default=None, ge=1, le=100)


class MatchResult(BaseModel):
    opportunity: Opportunity
    score: int = Field(ge=0, le=100)
    eligibility: Eligibility
    reasons: list[str] = Field(default_factory=list)
    skill_gaps: list[str] = Field(default_factory=list)
    explanation: str = ""


class MatchRequest(BaseModel):
    profile: StudentProfile
    opportunities: list[Opportunity] | None = None


class ExtractRequest(BaseModel):
    title_hint: str = ""
    source_url: HttpUrl
    raw_text: str = Field(min_length=80, max_length=20000)


class ExtractResponse(BaseModel):
    opportunity: Opportunity
    warnings: list[str] = Field(default_factory=list)
    ai_used: bool = False
