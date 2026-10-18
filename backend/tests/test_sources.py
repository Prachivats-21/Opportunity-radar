import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app import sources


def make_listing(title: str = "Student AI Hackathon") -> dict:
    item = sources._opportunity(
        prefix="test",
        key="test-listing-1",
        title=title,
        organization="Test Organizer",
        content="Students can join this online hackathon to build AI and Python projects. Please check eligibility and the deadline on the official page.",
        url="https://example.org/opportunities/ai-hackathon",
        source_name="Test source",
        location="India",
        mode="Online",
    )
    assert item is not None
    return item


def test_normalizer_keeps_unknown_deadline_and_eligibility_unknown():
    item = make_listing()
    assert item["category"] == "Hackathon"
    assert item["deadline"] is None
    assert item["eligible_years"] == []
    assert item["eligible_fields"] == []
    assert item["status"] == "needs_recheck"
    assert "verify" in item["notes"].lower()


def test_normalizer_drops_non_http_urls_and_unrelated_listings():
    assert sources._safe_url("javascript:alert(1)") is None
    assert sources._safe_url("https://example.org/listing") == "https://example.org/listing"
    item = sources._opportunity(
        prefix="test",
        key="x",
        title="Senior Software Engineer",
        organization="Example",
        content="Build and maintain production software for the company.",
        url="https://example.org/jobs/123",
        source_name="Test source",
    )
    assert item is None


def test_ids_are_stable_and_source_scoped():
    first = sources._stable_id("muse", "123")
    second = sources._stable_id("muse", "123")
    other_source = sources._stable_id("adzuna", "123")
    assert first == second
    assert first != other_source


def test_source_status_never_exposes_credentials(monkeypatch):
    monkeypatch.setenv("ADZUNA_APP_ID", "private-app-id")
    monkeypatch.setenv("ADZUNA_APP_KEY", "private-app-key")
    statuses = sources.source_statuses()
    adzuna = next(item for item in statuses if item["id"] == "adzuna")
    assert adzuna["configured"] is True
    assert adzuna["status"] == "ready"
    assert "private-app-id" not in repr(statuses)
    assert "private-app-key" not in repr(statuses)


def test_successful_sync_persists_and_failed_sync_keeps_last_good_cache(tmp_path, monkeypatch):
    monkeypatch.setattr(sources, "DATA_ROOT", tmp_path)
    monkeypatch.setattr(sources, "IMPORTS_FILE", tmp_path / "imported_opportunities.json")
    monkeypatch.setenv("GREENHOUSE_BOARD_TOKENS", "example-board")
    monkeypatch.delenv("THE_MUSE_API_KEY", raising=False)
    monkeypatch.delenv("ADZUNA_APP_ID", raising=False)
    monkeypatch.delenv("ADZUNA_APP_KEY", raising=False)
    monkeypatch.setattr(sources, "_SYNC_LOCK", __import__("threading").Lock())

    item = make_listing()
    monkeypatch.setitem(sources.FETCHERS, "greenhouse", lambda: [item])
    result = sources.sync_configured_sources(["greenhouse"])
    assert result["status"] == "ok"
    assert result["imported_count"] == 1
    assert len(sources.read_imported_opportunities()) == 1

    def fail_fetch():
        raise RuntimeError("provider unavailable")

    monkeypatch.setitem(sources.FETCHERS, "greenhouse", fail_fetch)
    failed = sources.sync_configured_sources(["greenhouse"])
    assert failed["status"] == "partial"
    assert failed["results"][0]["status"] == "error"
    assert failed["results"][0]["cached_items"] == 1
    assert len(sources.read_imported_opportunities()) == 1


def test_unconfigured_provider_is_reported_not_called(monkeypatch):
    monkeypatch.delenv("THE_MUSE_API_KEY", raising=False)
    monkeypatch.delenv("ADZUNA_APP_ID", raising=False)
    monkeypatch.delenv("ADZUNA_APP_KEY", raising=False)
    monkeypatch.delenv("GREENHOUSE_BOARD_TOKENS", raising=False)
    result = sources.sync_configured_sources(["the_muse"])
    assert result["results"][0]["status"] == "credentials_required"
    assert result["imported_count"] >= 0


def test_partner_sources_are_explicitly_pending():
    statuses = sources.source_statuses()
    unstop = next(item for item in statuses if item["id"] == "unstop")
    assert unstop["status"] == "partner_approval_required"
    assert unstop["configured"] is False
