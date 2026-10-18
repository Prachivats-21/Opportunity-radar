import json
import sys
from pathlib import Path

from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app import main
from app.ai import AIServiceError

client = TestClient(main.app)


def opportunity(**overrides):
    data = {
        "id": "event-1",
        "title": "Python Student Hackathon",
        "category": "Hackathon",
        "eligible_years": ["1", "2"],
        "eligible_fields": ["Computer Science"],
        "team_min": 1,
        "team_max": 4,
        "deadline": "2099-11-01",
        "source_url": "https://example.org/event",
    }
    data.update(overrides)
    return data


def extract_payload(**overrides):
    data = {
        "title_hint": "Student Hackathon",
        "source_url": "https://example.org/event",
        "raw_text": "This is a detailed opportunity listing for students. " * 3,
    }
    data.update(overrides)
    return data


def test_live_health_and_ready_data_check(monkeypatch, tmp_path):
    data_file = tmp_path / "opportunities.json"
    data_file.write_text(json.dumps([opportunity()]), encoding="utf-8")
    monkeypatch.setattr(main, "DATA_FILE", data_file)

    assert client.get("/health").json()["status"] == "ok"
    response = client.get("/ready")
    assert response.status_code == 200
    assert response.json()["opportunities"] == 1


def test_readiness_reports_unavailable_data(monkeypatch, tmp_path):
    monkeypatch.setattr(main, "DATA_FILE", tmp_path / "missing.json")

    response = client.get("/ready")

    assert response.status_code == 503
    assert response.json() == {"detail": "Opportunity data is not ready."}


def test_request_validation_response_does_not_echo_input():
    response = client.post(
        "/api/extract",
        json=extract_payload(raw_text="sensitive-short-input"),
    )

    assert response.status_code == 422
    assert response.json()["detail"] == "Request validation failed."
    assert "sensitive-short-input" not in response.text
    assert response.json()["errors"]


def test_extract_returns_safe_ai_unavailable_error(monkeypatch):
    def fail_extraction(*args, **kwargs):
        raise AIServiceError(503, "The AI service is unavailable. Check that Ollama is running.")

    monkeypatch.setattr(main, "extract_opportunity", fail_extraction)

    response = client.post("/api/extract", json=extract_payload())

    assert response.status_code == 503
    assert response.json() == {
        "detail": "The AI service is unavailable. Check that Ollama is running."
    }


def test_extract_schema_failure_is_upstream_error_without_validation_details(monkeypatch):
    monkeypatch.setattr(main, "extract_opportunity", lambda *args, **kwargs: {"id": "private"})

    response = client.post("/api/extract", json=extract_payload())

    assert response.status_code == 502
    assert response.json() == {
        "detail": "The AI service could not extract a valid opportunity."
    }
    assert "private" not in response.text


def test_extract_success_returns_warnings_for_missing_facts(monkeypatch):
    extracted = {
        "id": "user-added-123",
        "title": "Student Hackathon",
        "category": "Hackathon",
        "source_url": "https://example.org/event",
        "status": "needs_recheck",
    }
    monkeypatch.setattr(main, "extract_opportunity", lambda *args, **kwargs: extracted)

    response = client.post("/api/extract", json=extract_payload())

    assert response.status_code == 200
    assert response.json()["ai_used"] is True
    assert response.json()["opportunity"]["deadline"] is None
    assert response.json()["opportunity"]["eligible_years"] == []
    assert len(response.json()["warnings"]) == 2


def test_match_endpoint_keeps_known_ineligibility_deterministic(monkeypatch):
    monkeypatch.setattr(main, "semantic_match_batch", lambda *args, **kwargs: {})
    request = {
        "profile": {
            "year": "4",
            "field": "Computer Science",
            "team_size": 2,
        },
        "opportunities": [opportunity()],
    }

    response = client.post("/api/match", json=request)

    assert response.status_code == 200
    result = response.json()[0]
    assert result["eligibility"] == "not_eligible"
    assert result["score"] <= 15


def test_match_endpoint_rejects_duplicate_ids():
    item = opportunity()
    response = client.post(
        "/api/match",
        json={"profile": {}, "opportunities": [item, item]},
    )

    assert response.status_code == 422
    assert response.json()["detail"] == "Request validation failed."


def test_cors_origins_reject_wildcards_and_paths():
    assert main.parse_cors_origins("https://radar.example, http://localhost:5173/") == [
        "https://radar.example",
        "http://localhost:5173",
    ]
    for invalid in ("*", "https://example.org/path", "file:///tmp/app", ""):
        try:
            main.parse_cors_origins(invalid)
        except RuntimeError:
            continue
        raise AssertionError(f"Invalid CORS configuration was accepted: {invalid!r}")


def test_extract_rejects_invalid_url():
    response = client.post(
        "/api/extract",
        json=extract_payload(source_url="not-a-valid-http-url"),
    )
    assert response.status_code == 422
    assert response.json()["detail"] == "Request validation failed."


def test_extracted_opportunity_can_be_matched_and_ranked(monkeypatch):
    monkeypatch.setattr(main, "semantic_match_batch", lambda *args, **kwargs: {})
    extracted_data = {
        "id": "user-added-ai-hackathon",
        "title": "AI Innovation Hackathon",
        "organization": "AI Global",
        "category": "Hackathon",
        "summary": "Build innovative AI applications with Python.",
        "skills": ["AI", "Python"],
        "eligible_years": ["1", "2", "3", "4"],
        "eligible_fields": [],
        "location": "India",
        "mode": "Online",
        "deadline": "2026-12-31",
        "source_url": "https://example.org/ai-hackathon",
        "status": "needs_recheck",
    }
    monkeypatch.setattr(main, "extract_opportunity", lambda *args, **kwargs: extracted_data)

    extract_resp = client.post("/api/extract", json=extract_payload())
    assert extract_resp.status_code == 200
    new_opp = extract_resp.json()["opportunity"]

    # Now verify that this newly extracted opportunity seamlessly participates in matching
    match_resp = client.post(
        "/api/match",
        json={
            "profile": {
                "year": "1",
                "field": "Computer Science & AI",
                "skills": ["Python", "AI"],
                "interests": ["Hackathon"],
                "preferred_categories": ["Hackathon"],
                "preferred_mode": "Online",
            },
            "opportunities": [new_opp],
        },
    )
    assert match_resp.status_code == 200
    results = match_resp.json()
    assert len(results) == 1
    assert results[0]["opportunity"]["id"] == "user-added-ai-hackathon"
    assert results[0]["eligibility"] == "potentially_eligible"
    assert results[0]["score"] >= 60
    assert any("Python" in r or "AI" in r or "overlap" in r.lower() for r in results[0]["reasons"])

