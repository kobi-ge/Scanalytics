# Contract: GET /receipts/{receipt_id}

**Service**: InsightsDashboard (proxied at `/api/insights/receipts/{receipt_id}`)

**Auth**: `X-User-Id` header (required)

**Purpose**: Return full receipt detail including `items[]` for the detail modal. Fetched on demand, not on home list load.

## Request

```
GET /receipts/{receipt_id}
Headers:
  X-User-Id: <user_id>
```

`receipt_id` path parameter: the Mongo document `_id` (e.g. `user123_rcpt-abc`), URL-encoded.

## Response

**200 OK**

```json
{
  "id": "user123_rcpt-abc",
  "receipt_id": "rcpt-abc",
  "file_id": "507f1f77bcf86cd799439011",
  "store": "שופרסל",
  "purchase_date": "2024-03-20",
  "total_price": 156.90,
  "payment_method": "Visa",
  "item_count": 8,
  "created_at": "2024-03-20T14:32:01.123Z",
  "has_image": true,
  "items": [
    {
      "name": "חלב 3%",
      "quantity": 2,
      "price": 12.50,
      "category": "Food & Groceries"
    }
  ]
}
```

All `ReceiptSummary` fields plus `items[]`.

## Errors

| Status | Condition |
|--------|-----------|
| 401 | Missing `X-User-Id` |
| 404 | Receipt not found or `user_id` mismatch |

## Implementation notes

- Query: `find_one({ "_id": receipt_id, "user_id": user_id })`
- Return full document; do not strip `items`
- Frontend: call when user opens detail modal if `items` not already cached
