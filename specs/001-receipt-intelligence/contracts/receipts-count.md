# Contract: GET /receipts/count

**Service**: InsightsDashboard (proxied via API Gateway at `/api/insights/receipts/count`)

**Auth**: `X-User-Id` header (required) — same as existing insights endpoints

**Purpose**: Return total receipt count for the authenticated user. Must be independent of list pagination.

## Request

```
GET /receipts/count
Headers:
  X-User-Id: <user_id>
```

No query parameters.

## Response

**200 OK**

```json
{
  "count": 847
}
```

| Field | Type | Description |
|-------|------|-------------|
| `count` | integer | Total documents in `metadata_db.receipts` where `user_id` matches |

## Errors

| Status | Condition |
|--------|-----------|
| 401 | Missing `X-User-Id` header |
| 500 | MongoDB unavailable |

## Implementation notes

- Use `count_documents({"user_id": user_id}, hint="idx_user_id")`
- Do NOT call list query or load `items[]`
- Target latency: < 50 ms p95 at 10k+ receipts per user (with index)

## Frontend usage

- Fetch in parallel with first list page on home mount
- Display in count banner immediately when resolved
- Optimistic `+1` on upload; reconcile with this endpoint after pipeline delay
