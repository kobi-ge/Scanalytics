import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "app"))

from utils import extract_metadata


def test_extract_metadata_parses_valid_payload():
    payload = '{"file_id": "file-123", "user_id": "user-7"}'

    assert extract_metadata(payload) == ("file-123", "user-7")


def test_extract_metadata_returns_none_for_missing_required_fields():
    payload = '{"file_id": "file-123"}'

    assert extract_metadata(payload) == (None, None)


def test_extract_metadata_handles_invalid_json():
    payload = '{not valid json}'

    assert extract_metadata(payload) == (None, None)
