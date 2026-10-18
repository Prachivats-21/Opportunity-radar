from fastapi.testclient import TestClient

from app.main import app
from app.sources import _category, _make_opportunity, get_source_statuses

client = TestClient(app)


def test_source_status_includes_configurable_and_approval_gated_providers():
    status = {source["id"]: source for source in get_source_statuses()}
    assert {"themuse", "adzuna", "greenhouse", "lever"} <= set(status)
    assert status["unstop"]["status"] == "approval_required"
    assert status["devpost"]["status"] == "permission_required"


def test_category_normalization_covers_student_opportunity_types():
    assert _category("Summer Internship, Software Engineer") == "Internship"
    assert _category("Open Source Fellowship") == "Fellowship"
    assert _category("AI Hackathon") == "Hackathon"
    assert _category("Women in STEM Scholarship") == "Scholarship"


def test_normalizer_keeps_source_and_marks_imported_record_for_review():
    item = _make_opportunity(
        source="Example Board",
        external_id="123",
        title="  Software Engineering Internship ",
        organization="Example Company",
        description="<p>Build internal tools &amp; learn from engineers.</p>",
        source_url="https://jobs.example.org/roles/123",
        location="Remote",
        mode="Remote",
    )
    assert item is not None
    assert item.id == "example-board-123"
    assert item.source_name == "Example Board"
    assert item.source_url == "https://jobs.example.org/roles/123"
    assert item.category == "Internship"
    assert item.status == "needs_recheck"
    assert "Build internal tools & learn" in item.description


def test_normalizer_rejects_invalid_source_url():
    item = _make_opportunity(
        source="Example",
        external_id="1",
        title="A valid title",
        organization="Org",
        description="Description",
        source_url="javascript:alert(1)",
    )
    assert item is None


def test_sync_endpoint_is_disabled_without_server_token(monkeypatch):
    monkeypatch.delenv("SOURCE_SYNC_TOKEN", raising=False)
    response = client.post("/api/sources/sync", headers={"X-Sync-Token": "unused"})
    assert response.status_code == 503


def test_sync_endpoint_rejects_wrong_token(monkeypatch):
    monkeypatch.setenv("SOURCE_SYNC_TOKEN", "correct-token")
    response = client.post("/api/sources/sync", headers={"X-Sync-Token": "wrong-token"})
    assert response.status_code == 401


def test_health_and_sources_endpoints_are_available():
    assert client.get("/health").status_code == 200
    response = client.get("/api/sources")
    assert response.status_code == 200
    assert "sources" in response.json()
    assert "last_sync" in response.json()
