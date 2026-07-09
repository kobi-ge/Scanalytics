# Contract: GET /receipts (cursor-paginated slim list)

**Service**: InsightsDashboard (proxied at `/api/insights/receipts`)

**Auth**: `X-User-Id` header (required)

**Purpose**: Return a slim, cursor-paginated page of receipts for the home screen. No `items[]`, no image bytes.

## Request

```
GET /receipts?limit=12&cursor=<opaque_token>
Headers:
  X-User-Id: <user_id>
```

| Parameter | Type | Default | Constraints |
|-----------|------|---------|-------------|
| `limit` | integer | 12 | min 1, max 50 |
| `cursor` | string | — | Opaque token from previous `next_cursor`; omit for first page |

**Forbidden**: `offset`, `page`, `skip` parameters — not supported.

## Response

**200 OK**

```json
{
  "items": [
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
      "has_image": true
    }
  ],
  "next_cursor": "eyJjcmVhdGVkX2F0IjoiMjAyNC0wMy0yMFQxNDozMjowMS4xMjNaIiwiaWQiOiJ1c2VyMTIzX3JjcHQtYWJjIn0",
  "has_more": true
}
```

### ReceiptSummary fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | string | yes | Mongo `_id` |
| `receipt_id` | string | no | |
| `file_id` | string | no | null for manual entry |
| `store` | string | no | |
| `purchase_date` | string | no | `YYYY-MM-DD` |
| `total_price` | number | no | |
| `payment_method` | string | no | |
| `item_count` | integer | yes | Denormalized at write |
| `created_at` | string | yes | ISO 8601 UTC |
| `has_image` | boolean | yes | `file_id != null` |

### Pagination fields

| Field | Type | Description |
|-------|------|-------------|
| `next_cursor` | string \| null | Pass as `cursor` param for next page; null on last page |
| `has_more` | boolean | `true` if more receipts exist beyond this page |

## Cursor algorithm

1. Sort: `{ created_at: -1, _id: -1 }`
2. First page: `find({ user_id })`
3. Subsequent pages: append keyset filter:
   ```json
   {"$or": [
     {"created_at": {"$lt": "<cursor.created_at>"}},
     {"created_at": "<cursor.created_at>", "_id": {"$lt": "<cursor.id>"}}
   ]}
   ```
4. Fetch `limit + 1` docs; if extra doc exists, `has_more = true` and trim to `limit`
5. `next_cursor` = encode last returned item's `{ created_at, id }`

## Errors

| Status | Condition |
|--------|-----------|
| 400 | Malformed `cursor` token |
| 401 | Missing `X-User-Id` |
| 422 | `limit` out of range |

## Deprecation

Replaces home-screen usage of:
- `GET /receipts/recent` (returns full docs with `items[]`)
- `GET /receipts/images` (returns base64 images)

Both remain temporarily for rollback.
