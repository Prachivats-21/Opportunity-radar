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
