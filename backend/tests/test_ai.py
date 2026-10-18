import sys
from pathlib import Path

import httpx
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app import ai


def ollama_response(body, status_code=200):
    return httpx.Response(
        status_code,
        json=body,
        request=httpx.Request("POST", "http://ollama/api/generate"),
    )


def valid_opportunity_json():
    return (
        '{"title":"Python Student Hackathon","organization":"Test Org",'
        '"category":"Hackathon","summary":"Build a project","skills":["Python"],'
        '"eligible_years":[],"eligible_fields":[],"deadline":null}'
    )


def test_extract_opportunity_returns_valid_unverified_record(monkeypatch):
    monkeypatch.setattr(
        ai.httpx,
        "post",
        lambda *args, **kwargs: ollama_response({"response": valid_opportunity_json()}),
    )
    text = "A sufficiently detailed source listing describing a student hackathon and its application process."

    result = ai.extract_opportunity(text, "Hackathon", "https://example.org/event")

    assert result["title"] == "Python Student Hackathon"
    assert result["status"] == "needs_recheck"
    assert result["last_verified"] is None
    assert result["id"] == ai.extract_opportunity(text, "Hackathon", "https://example.org/event")["id"]


@pytest.mark.parametrize(
    "content",
    [
        "not JSON",
        "[]",
        '{"category":"Hackathon"}',
        '{"title":"Bad date","deadline":"not-a-date"}',
        '{"title":"Bad category","category":"Made up"}',
    ],
)
def test_extract_rejects_malformed_or_invalid_model_output(monkeypatch, content):
    monkeypatch.setattr(
        ai.httpx,
        "post",
        lambda *args, **kwargs: ollama_response({"response": content}),
    )

    with pytest.raises(ai.AIServiceError) as error:
        ai.extract_opportunity("A sufficiently detailed source listing " * 5, "", "https://example.org")

    assert error.value.status_code == 502
    assert "example.org" not in error.value.public_message


def test_ollama_timeout_has_gateway_timeout_status(monkeypatch):
    def raise_timeout(*args, **kwargs):
        raise httpx.ReadTimeout("private timeout detail")

    monkeypatch.setattr(ai.httpx, "post", raise_timeout)

    with pytest.raises(ai.AIServiceError) as error:
        ai._ollama_generate("prompt")

    assert error.value.status_code == 504
    assert "private timeout detail" not in error.value.public_message


def test_ollama_connection_failure_has_unavailable_status(monkeypatch):
    def raise_connection_error(*args, **kwargs):
        raise httpx.ConnectError("private connection detail")

    monkeypatch.setattr(ai.httpx, "post", raise_connection_error)

    with pytest.raises(ai.AIServiceError) as error:
        ai._ollama_generate("prompt")

    assert error.value.status_code == 503
    assert "private connection detail" not in error.value.public_message


def test_ollama_http_failure_has_bad_gateway_status(monkeypatch):
    monkeypatch.setattr(
        ai.httpx,
        "post",
        lambda *args, **kwargs: ollama_response({"error": "private"}, status_code=500),
    )

    with pytest.raises(ai.AIServiceError) as error:
        ai._ollama_generate("prompt")

    assert error.value.status_code == 502


@pytest.mark.parametrize("body", [{"unexpected": "shape"}, {"response": None}])
def test_ollama_rejects_invalid_response_envelope(monkeypatch, body):
    monkeypatch.setattr(ai.httpx, "post", lambda *args, **kwargs: ollama_response(body))

    with pytest.raises(ai.AIServiceError) as error:
        ai._ollama_generate("prompt")

    assert error.value.status_code == 502


def test_semantic_batch_ignores_unknown_ids_and_malformed_entries(monkeypatch):
    monkeypatch.setattr(
        ai.httpx,
        "post",
        lambda *args, **kwargs: ollama_response({
            "response": '{"matches":['
            '{"id":"other","reasons":["irrelevant"],"skill_gaps":[]},'
            '{"id":"event","reasons":[" Relevant "],"skill_gaps":["Python"]},'
            '{"id":"event","reasons":[1],"skill_gaps":[]}'
            ']}'
        }),
    )
    from app.schemas import Opportunity, StudentProfile

    opportunity = Opportunity.model_validate({
        "id": "event",
        "title": "Student challenge",
        "source_url": "https://example.org/event",
    })

    assert ai.semantic_match_batch([opportunity], StudentProfile()) == {
        "event": {"reasons": ["Relevant"], "skill_gaps": ["Python"]}
    }
