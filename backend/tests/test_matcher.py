import sys
from datetime import date
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.schemas import Opportunity, StudentProfile
from app.matcher import evaluate_eligibility, match_opportunity


def make_opportunity(**overrides):
    data = {
        "id": "test-1", "title": "Python AI Hackathon", "organization": "Test org", "category": "Hackathon",
        "summary": "Build AI projects with Python", "description": "A student AI challenge", "skills": ["Python", "AI"],
        "eligible_years": ["1", "2"], "eligible_fields": ["Computer Science"], "location": "India", "mode": "Online",
        "team_min": 1, "team_max": 4, "deadline": "2026-11-01", "source_url": "https://example.org/event",
        "source_name": "Test source", "last_verified": "2026-10-15", "status": "test"
    }
    data.update(overrides)
    return Opportunity.model_validate(data)


def test_known_year_conflict_is_not_eligible():
    opp = make_opportunity()
    profile = StudentProfile(year="4", field="Computer Science", team_size=2)
    assert evaluate_eligibility(opp, profile, date(2026, 10, 15)) == "not_eligible"


def test_missing_eligibility_stays_potentially_eligible():
    opp = make_opportunity(eligible_years=[], eligible_fields=[])
    profile = StudentProfile(year="1", field="Computer Science", skills=["Python"], team_size=2)
    assert evaluate_eligibility(opp, profile, date(2026, 10, 15)) == "potentially_eligible"


def test_missing_profile_year_does_not_claim_eligibility():
    opp = make_opportunity()
    profile = StudentProfile(field="Computer Science", team_size=2)
    assert evaluate_eligibility(opp, profile, date(2026, 10, 15)) == "potentially_eligible"


def test_missing_profile_field_does_not_claim_eligibility():
    opp = make_opportunity()
    profile = StudentProfile(year="1", team_size=2)
    assert evaluate_eligibility(opp, profile, date(2026, 10, 15)) == "potentially_eligible"


def test_blank_profile_values_are_treated_as_unknown():
    opp = make_opportunity()
    profile = StudentProfile(year=" ", field="", team_size=2)
    assert evaluate_eligibility(opp, profile, date(2026, 10, 15)) == "potentially_eligible"


def test_missing_team_size_does_not_claim_eligibility():
    opp = make_opportunity()
    profile = StudentProfile(year="1", field="Computer Science")
    assert evaluate_eligibility(opp, profile, date(2026, 10, 15)) == "potentially_eligible"


def test_known_conflict_still_overrides_missing_profile_information():
    opp = make_opportunity()
    profile = StudentProfile(year="4")
    assert evaluate_eligibility(opp, profile, date(2026, 10, 15)) == "not_eligible"


def test_deadline_today_is_not_expired():
    opp = make_opportunity(deadline="2026-10-15")
    profile = StudentProfile(year="1", field="Computer Science", team_size=2)
    assert evaluate_eligibility(opp, profile, date(2026, 10, 15)) == "eligible"


def test_all_years_and_fields_are_not_treated_as_unknown():
    opp = make_opportunity(eligible_years=["All"], eligible_fields=["All"])
    profile = StudentProfile(team_size=2)
    assert evaluate_eligibility(opp, profile, date(2026, 10, 15)) == "eligible"


def test_expired_deadline_is_flagged():
    opp = make_opportunity(deadline="2026-10-01")
    profile = StudentProfile(year="1", field="Computer Science", skills=["Python"], team_size=2)
    assert evaluate_eligibility(opp, profile, date(2026, 10, 15)) == "expired"


def test_relevant_profile_gets_reasons():
    opp = make_opportunity()
    profile = StudentProfile(year="1", field="Computer Science", skills=["Python"], interests=["AI"], preferred_categories=["Hackathon"], team_size=2)
    result = match_opportunity(opp, profile, date(2026, 10, 15))
    assert result.score > 25
    assert result.reasons
    assert result.eligibility == "eligible"
