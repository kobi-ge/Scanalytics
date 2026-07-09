import base64
import json
from datetime import datetime, timezone

from fastapi import HTTPException
from pydantic import BaseModel


class CursorPayload(BaseModel):
    created_at: datetime
    id: str


def encode_cursor(created_at: datetime, doc_id: str) -> str:
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)
    payload = {"created_at": created_at.isoformat(), "id": doc_id}
    return base64.urlsafe_b64encode(json.dumps(payload).encode("utf-8")).decode("utf-8")


def decode_cursor(token: str) -> CursorPayload:
    try:
        decoded = base64.urlsafe_b64decode(token.encode("utf-8")).decode("utf-8")
        data = json.loads(decoded)
        created_at = datetime.fromisoformat(data["created_at"])
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)
        return CursorPayload(created_at=created_at, id=data["id"])
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid cursor token") from exc


def build_keyset_filter(cursor: CursorPayload) -> dict:
    return {
        "$or": [
            {"created_at": {"$lt": cursor.created_at}},
            {"created_at": cursor.created_at, "_id": {"$lt": cursor.id}},
        ]
    }
