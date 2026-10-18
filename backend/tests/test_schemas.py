import sys
from pathlib import Path

import pytest
from pydantic import ValidationError

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.schemas import MatchRequest, Opportunity, StudentProfile


def make_opportunity(**overrides):
    data = {
        "id": "event-1",
        "title": "Student challenge",
        "source_url": "https://example.org/event",
    }
    data.update(overrides)
    return data


def test_opportunity_rejects_unexpected_fields():
    with pytest.raises(ValidationError):
        Opportunity.model_validate(make_opportunity(unexpected="value"))


def test_opportunity_rejects_inconsistent_team_bounds():
    with pytest.raises(ValidationError, match="team_min must not exceed team_max"):
        Opportunity.model_validate(make_opportunity(team_min=5, team_max=2))


@pytest.mark.parametrize(
    "overrides",
    [
        {"id": 123},
        {"team_min": "2"},
        {"skills": [1]},
    ],
)
def test_opportunity_rejects_coerced_scalar_types(overrides):
    with pytest.raises(ValidationError):
        Opportunity.model_validate(make_opportunity(**overrides))


def test_match_request_rejects_duplicate_opportunity_ids():
    opportunity = make_opportunity()
    with pytest.raises(ValidationError, match="opportunity ids must be unique"):
        MatchRequest.model_validate({
            "profile": {},
            "opportunities": [opportunity, opportunity],
        })


def test_match_request_rejects_oversized_opportunity_list():
    opportunities = [make_opportunity(id=f"event-{index}") for index in range(201)]
    with pytest.raises(ValidationError):
        MatchRequest.model_validate({"profile": {}, "opportunities": opportunities})


def test_profile_rejects_unexpected_fields():
    with pytest.raises(ValidationError):
        StudentProfile.model_validate({"field": "CS", "unexpected": True})


def test_profile_rejects_coerced_team_size():
    with pytest.raises(ValidationError):
        StudentProfile.model_validate({"team_size": "2"})
