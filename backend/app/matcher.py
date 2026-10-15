from datetime import date
from .schemas import Opportunity, StudentProfile, MatchResult


def _tokens(values: list[str]) -> set[str]:
    return {item.strip().lower() for value in values for item in value.replace("/", " ").replace(",", " ").split() if len(item.strip()) > 1}


def evaluate_eligibility(opportunity: Opportunity, profile: StudentProfile, today: date | None = None) -> str:
    today = today or date.today()
    if opportunity.deadline and opportunity.deadline < today:
        return "expired"
    if opportunity.eligible_years and profile.year != "Not specified" and profile.year not in opportunity.eligible_years:
        return "not_eligible"
    if opportunity.eligible_fields and profile.field != "Not specified":
        allowed = {v.casefold() for v in opportunity.eligible_fields}
        if "all" not in allowed and profile.field.casefold() not in allowed:
            return "not_eligible"
    if opportunity.team_min and profile.team_size is not None and profile.team_size < opportunity.team_min:
        return "not_eligible"
    if opportunity.team_max and profile.team_size is not None and profile.team_size > opportunity.team_max:
        return "not_eligible"
    has_unknowns = not opportunity.eligible_years or not opportunity.eligible_fields
    if has_unknowns:
        return "potentially_eligible"
    return "eligible"


def match_opportunity(opportunity: Opportunity, profile: StudentProfile, today: date | None = None) -> MatchResult:
    profile_terms = _tokens(profile.skills + profile.interests + [profile.field])
    opp_terms = _tokens(opportunity.skills + [opportunity.category, opportunity.summary, opportunity.description])
    overlap = sorted(profile_terms & opp_terms)
    skill_terms = _tokens(opportunity.skills)
    skill_overlap = sorted(profile_terms & skill_terms)
    skill_gaps = sorted(skill_terms - profile_terms)[:5]

    score = 25
    reasons: list[str] = []
    if overlap:
        score += min(35, 8 * len(overlap))
        reasons.append("Your profile overlaps with: " + ", ".join(overlap[:5]) + ".")
    if profile.preferred_categories and opportunity.category in profile.preferred_categories:
        score += 20
        reasons.append(f"Matches your preferred {opportunity.category.lower()} category.")
    if profile.preferred_mode != "Any" and profile.preferred_mode.casefold() in opportunity.mode.casefold():
        score += 10
        reasons.append(f"Matches your preferred format: {opportunity.mode}.")
    if not reasons:
        reasons.append("There is not enough profile overlap yet; review the source before deciding.")
    eligibility = evaluate_eligibility(opportunity, profile, today)
    if eligibility == "not_eligible":
        score = min(score, 15)
        reasons.append("A known requirement conflicts with the profile you entered.")
    elif eligibility in {"unknown", "potentially_eligible"}:
        reasons.append("Some eligibility details are missing; confirm them with the organizer.")
    elif eligibility == "expired":
        score = 0
        reasons.append("The listed deadline has passed.")
    return MatchResult(
        opportunity=opportunity,
        score=max(0, min(100, score)),
        eligibility=eligibility,
        reasons=reasons,
        skill_gaps=skill_gaps,
        explanation=" ".join(reasons),
    )


def rank_opportunities(opportunities: list[Opportunity], profile: StudentProfile, today: date | None = None) -> list[MatchResult]:
    results = [match_opportunity(item, profile, today) for item in opportunities]
    return sorted(results, key=lambda result: (result.eligibility == "not_eligible", result.eligibility == "expired", -result.score))
