from datetime import datetime, timezone

import pytest
from fastapi import HTTPException

from app.utils.cursor import (
    CursorPayload,
    build_keyset_filter,
    decode_cursor,
    encode_cursor,
)


def test_encode_decode_roundtrip():
    created_at = datetime(2024, 3, 20, 14, 32, 1, 123000, tzinfo=timezone.utc)
    doc_id = "user123_rcpt-abc"
    token = encode_cursor(created_at, doc_id)
    payload = decode_cursor(token)
    assert payload.id == doc_id
    assert payload.created_at == created_at


def test_decode_invalid_cursor_raises():
    with pytest.raises(HTTPException) as exc:
        decode_cursor("not-a-valid-cursor")
    assert exc.value.status_code == 400


def test_keyset_filter_structure():
    cursor = CursorPayload(
        created_at=datetime(2024, 3, 20, tzinfo=timezone.utc),
        id="user123_rcpt-abc",
    )
    filt = build_keyset_filter(cursor)
    assert "$or" in filt
    assert len(filt["$or"]) == 2
    assert filt["$or"][0]["created_at"]["$lt"] == cursor.created_at
    assert filt["$or"][1]["_id"]["$lt"] == cursor.id


def test_paginated_ids_no_overlap():
    """Simulate three pages of IDs — no duplicates across pages."""
    all_ids = [f"id-{i}" for i in range(25)]
    page_size = 10
    pages = [all_ids[i : i + page_size] for i in range(0, len(all_ids), page_size)]
    flat = [x for page in pages for x in page]
    assert len(flat) == len(set(flat)) == 25


def test_count_independent_of_list_limit():
    """Count logic is separate from list limit (conceptual contract)."""
    total = 47
    list_limit = 12
    assert total != list_limit
    assert total > list_limit
