import json
from pathlib import Path
from fastapi.testclient import TestClient
from app.main import app
from app.schemas import Opportunity
from app.ingest import (
    normalize_url,
    fetch_unstop_opportunities,
    fetch_gov_opportunities,
    fetch_devpost_opportunities,
    sync_all_opportunities,
)


def test_normalize_url():
    assert normalize_url("https://unstop.com/hackathons/xyz?utm_source=radar#overview/") == "https://unstop.com/hackathons/xyz"
    assert normalize_url("HTTP://Example.COM/Path/") == "http://example.com/Path"


def test_fetch_unstop_schema_conformance():
    items = fetch_unstop_opportunities()
    assert len(items) > 0
    for item in items:
        op = Opportunity.model_validate(item)
        assert op.id.startswith("unstop-")
        assert op.category in ["Hackathon", "Competition", "Other"]
        assert op.source_url is not None


def test_fetch_gov_schema_conformance():
    items = fetch_gov_opportunities()
    assert len(items) > 0
    for item in items:
        op = Opportunity.model_validate(item)
        assert op.category in ["Hackathon", "Competition"]
        assert "India" in op.location or op.mode in ["Online", "Hybrid", "Online Prelims + On-site Grand Finale", "Online + 36h Grand Finale"]


def test_fetch_devpost_schema_conformance():
    items = fetch_devpost_opportunities()
    assert len(items) > 0
    for item in items:
        op = Opportunity.model_validate(item)
        assert op.category == "Hackathon"


def test_sync_all_opportunities_and_deduplication(tmp_path: Path):
    temp_data = tmp_path / "test_opportunities.json"
    temp_data.write_text("[]", encoding="utf-8")

    # First sync: adds items
    result1 = sync_all_opportunities(data_path=temp_data)
    assert result1["status"] == "ok"
    assert result1["added"] > 0
    assert result1["total"] == result1["added"]

    loaded_raw = json.loads(temp_data.read_text(encoding="utf-8"))
    assert len(loaded_raw) == result1["total"]
    # All must pass validation
    for item in loaded_raw:
        Opportunity.model_validate(item)

    # Second sync: deduplication means 0 added
    result2 = sync_all_opportunities(data_path=temp_data)
    assert result2["status"] == "ok"
    assert result2["added"] == 0
    assert result2["total"] == result1["total"]


def test_api_sync_endpoint():
    client = TestClient(app)
    response = client.post("/api/sync")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["total"] >= 20
    assert isinstance(data["added"], int)
    assert len(data["sources"]) >= 2
