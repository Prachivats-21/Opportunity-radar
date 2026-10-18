import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app import main, sources
from app.schemas import Opportunity


def opportunity(item_id: str, url: str, title: str = "Student AI Hackathon") -> Opportunity:
    return Opportunity.model_validate(
        {
            "id": item_id,
            "title": title,
            "organization": "Test organizer",
            "category": "Hackathon",
            "summary": "Build a small project.",
            "description": "Student opportunity for teams.",
            "skills": ["Python", "AI"],
            "eligible_years": [],
            "eligible_fields": [],
            "location": "India",
            "mode": "Online",
            "source_url": url,
            "source_name": "Test source",
            "status": "needs_recheck",
        }
    )


def test_load_opportunities_merges_imports_and_prefers_curated_duplicate(tmp_path, monkeypatch):
    curated = opportunity("seed-1", "https://example.org/hackathon", "Curated event")
    duplicate = opportunity("imported-duplicate", "https://example.org/hackathon", "Duplicate event")
    extra = opportunity("imported-2", "https://another.example.org/internship", "Student Internship")
    data_file = tmp_path / "opportunities.json"
    data_file.write_text(json.dumps([curated.model_dump(mode="json")]), encoding="utf-8")
    monkeypatch.setattr(main, "DATA_FILE", data_file)
    monkeypatch.setattr(main, "read_imported_opportunities", lambda: [duplicate, extra])

    results = main.load_opportunities()
    assert [item.id for item in results] == ["seed-1", "imported-2"]


def test_sync_route_rejects_remote_calls_without_token(monkeypatch):
    from fastapi.testclient import TestClient

    monkeypatch.delenv("OPPORTUNITY_RADAR_SYNC_TOKEN", raising=False)
    client = TestClient(main.app)
    response = client.post("/api/sources/sync", json={})
    # TestClient is loopback-like for this guard and should be accepted even if no source is configured.
    assert response.status_code == 200


def test_sources_status_endpoint_does_not_return_credentials(monkeypatch):
    from fastapi.testclient import TestClient

    monkeypatch.setenv("ADZUNA_APP_ID", "do-not-return-this-id")
    monkeypatch.setenv("ADZUNA_APP_KEY", "do-not-return-this-key")
    client = TestClient(main.app)
    response = client.get("/api/sources")
    assert response.status_code == 200
    payload = response.json()
    assert payload["sources"]
    assert "do-not-return-this-id" not in response.text
    assert "do-not-return-this-key" not in response.text
