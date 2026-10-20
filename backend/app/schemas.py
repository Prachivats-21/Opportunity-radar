from datetime import date
from typing import Literal
from pydantic import BaseModel, Field, HttpUrl, ConfigDict, StrictInt, StrictStr, model_validator

OpportunityCategory = Literal["Hackathon", "Internship", "Competition", "Fellowship", "Scholarship", "Workshop", "Other"]
Eligibility = Literal["eligible", "potentially_eligible", "not_eligible", "unknown", "expired"]


class Opportunity(BaseModel):
    model_config = ConfigDict(extra="forbid")
    id: StrictStr = Field(min_length=1, max_length=160)
    title: StrictStr = Field(min_length=2, max_length=180)
    organization: StrictStr = Field(default="Unknown organizer", max_length=180)
    category: OpportunityCategory = "Other"
    summary: StrictStr = Field(default="", max_length=1000)
    description: StrictStr = Field(default="", max_length=12000)
    skills: list[StrictStr] = Field(default_factory=list, strict=True, max_length=100)
    eligible_years: list[StrictStr] = Field(default_factory=list, strict=True, max_length=30)
    eligible_fields: list[StrictStr] = Field(default_factory=list, strict=True, max_length=100)
    location: StrictStr = Field(default="Not specified", max_length=240)
    mode: StrictStr = Field(default="Not specified", max_length=120)
    team_min: StrictInt | None = Field(default=None, ge=1, le=100)
    team_max: StrictInt | None = Field(default=None, ge=1, le=100)
    deadline: date | None = None
    start_date: date | None = None
    source_url: HttpUrl
    source_name: StrictStr = Field(default="Source", max_length=240)
    last_verified: date | None = None
    status: StrictStr = Field(default="needs_recheck", max_length=80)
    notes: StrictStr = Field(default="", max_length=2000)

    @model_validator(mode="after")
    def validate_team_bounds(self) -> "Opportunity":
        if self.team_min is not None and self.team_max is not None and self.team_min > self.team_max:
            raise ValueError("team_min must not exceed team_max")
        return self


class StudentProfile(BaseModel):
    model_config = ConfigDict(extra="forbid")
    year: StrictStr = "Not specified"
    field: StrictStr = "Not specified"
    skills: list[StrictStr] = Field(default_factory=list, strict=True, max_length=100)
    interests: list[StrictStr] = Field(default_factory=list, strict=True, max_length=100)
    preferred_categories: list[OpportunityCategory] = Field(default_factory=list, max_length=20)
    preferred_mode: StrictStr = Field(default="Any", max_length=80)
    location: StrictStr = Field(default="India", max_length=240)
    team_size: StrictInt | None = Field(default=None, ge=1, le=100)


class MatchResult(BaseModel):
    model_config = ConfigDict(extra="forbid")
    opportunity: Opportunity
    score: StrictInt = Field(ge=0, le=100)
    eligibility: Eligibility
    reasons: list[StrictStr] = Field(default_factory=list, strict=True, max_length=50)
    skill_gaps: list[StrictStr] = Field(default_factory=list, strict=True, max_length=100)
    explanation: StrictStr = Field(default="", max_length=12000)


class MatchRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    profile: StudentProfile
    opportunities: list[Opportunity] | None = Field(default=None, max_length=200)

    @model_validator(mode="after")
    def validate_unique_opportunity_ids(self) -> "MatchRequest":
        if self.opportunities is not None:
            ids = [opportunity.id for opportunity in self.opportunities]
            if len(ids) != len(set(ids)):
                raise ValueError("opportunity ids must be unique")
        return self


class ExtractRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    title_hint: StrictStr = Field(default="", max_length=180)
    source_url: HttpUrl
    raw_text: StrictStr = Field(min_length=80, max_length=20000)


class ExtractResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    opportunity: Opportunity
    warnings: list[StrictStr] = Field(default_factory=list, strict=True, max_length=20)
    ai_used: bool = False


class SyncResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    status: StrictStr
    total: StrictInt
    added: StrictInt
    sources: list[StrictStr] = Field(default_factory=list, strict=True, max_length=50)
    message: StrictStr = Field(default="", max_length=500)


class SearchFeedRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    profile: StudentProfile | None = None
    category: StrictStr = "All"
    search_query: StrictStr = ""
    quick_closing_soon: bool = False
    quick_remote: bool = False
    quick_eligible_for_me: bool = False
    quick_free_to_enter: bool = False
    sort_by: StrictStr = "Best match"
    limit: StrictInt | None = Field(default=100, ge=1, le=500)


class SearchFeedResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    total: StrictInt
    filtered_count: StrictInt
    eligible_count: StrictInt
    closing_soon_count: StrictInt
    last_synced: StrictStr
    results: list[MatchResult]


