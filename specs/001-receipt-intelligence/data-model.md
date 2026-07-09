# Data Model: Home Screen Pagination & Payload Separation

Implements **FR-009–FR-014** and entities defined in [spec.md](spec.md). API shapes are specified in [contracts/](contracts/).

## Overview

Extends the existing MongoDB `metadata_db.receipts` document with pagination metadata. Introduces logical view models (Pydantic) that separate **home list**, **detail**, and **count** concerns without a new physical collection.

## Physical Document: `metadata_db.receipts`

### Existing fields (unchanged)

| Field | Type | Notes |
|-------|------|-------|
| `_id` | string | `{user_id}_{receipt_id\|file_id}` — stable tie-breaker |
| `user_id` | string | Tenant scope for all queries |
| `receipt_id` | string? | Business receipt identifier |
| `file_id` | string? | GridFS reference; null for manual entry |
| `store` | string? | Merchant name |
| `purchase_date` | string | `YYYY-MM-DD` business date |
| `total_price` | float? | Transaction total |
| `payment_method` | string? | Payment type |
| `items` | array | **Heavy** — excluded from list projection |

### New fields (write path)

| Field | Type | Source | Purpose |
|-------|------|--------|---------|
| `created_at` | datetime (UTC) | `storageWorker` on upsert | Cursor pagination sort key |
| `item_count` | int | `len(items)` at write | Display on home card without loading `items[]` |

### Indexes

| Name | Keys | Used by |
|------|------|---------|
| `idx_user_created_id` | `{ user_id: 1, created_at: -1, _id: -1 }` | List cursor queries |
| `idx_user_id` | `{ user_id: 1 }` | Count queries |
| `idx_gridfs_user_upload` | `{ metadata.user_id: 1, uploadDate: -1 }` on `files_db.fs.files` | Thumbnail file lookup |

### Backfill rules

| Condition | `created_at` source |
|-----------|---------------------|
| Has `file_id` | GridFS `fs.files.uploadDate` |
| Has `purchase_date` only | `purchase_date` at `00:00:00 UTC` |
| Neither | `ObjectId` generation time from `_id` if parseable, else epoch |

---

## Logical View Models

### ReceiptCount (API response)

| Field | Type | Description |
|-------|------|-------------|
| `count` | int | Total receipts for authenticated user |

**Source**: `count_documents({ user_id })` — independent of list.

---

### ReceiptSummary (home list item)

| Field | Type | In list projection |
|-------|------|-------------------|
| `id` | string | `_id` as string |
| `receipt_id` | string? | yes |
| `file_id` | string? | yes |
| `store` | string? | yes |
| `purchase_date` | string? | yes |
| `total_price` | float? | yes |
| `payment_method` | string? | yes |
| `item_count` | int | yes |
| `created_at` | string (ISO 8601) | yes |
| `has_image` | bool (computed) | `file_id is not None` |
| `items` | — | **excluded** |
| `data_base64` | — | **excluded** |

---

### ReceiptDetail (modal / detail view)

All `ReceiptSummary` fields plus:

| Field | Type | Description |
|-------|------|-------------|
| `items` | `Item[]` | `{ name, quantity, price, category }` |

**Source**: `find_one({ _id, user_id })` — full document.

---

### ReceiptListPage (paginated response)

| Field | Type | Description |
|-------|------|-------------|
| `items` | `ReceiptSummary[]` | Current page |
| `next_cursor` | string? | Opaque token; null if last page |
| `has_more` | bool | `true` if another page exists |

### Cursor token payload (internal, base64-encoded)

| Field | Type | Description |
|-------|------|-------------|
| `created_at` | string (ISO 8601) | Last item's `created_at` |
| `id` | string | Last item's `_id` |

---

## Frontend State Entities

### `receiptCount` (Zustand global)

| State | Type | Source |
|-------|------|--------|
| `receiptCount` | `number \| null` | `GET /receipts/count` |
| `receiptCountError` | `string \| null` | Error message |

Updated by: login, upload success (`incrementReceiptCount`), periodic reconcile.

### `receiptList` (hook-local)

| State | Type | Source |
|-------|------|--------|
| `items` | `ReceiptSummary[]` | Accumulated pages |
| `nextCursor` | `string \| null` | From last list response |
| `hasMore` | `boolean` | From last list response |
| `isLoadingInitial` | `boolean` | First page in flight |
| `isLoadingMore` | `boolean` | Subsequent page in flight |

### `thumbnailCache` (component-level)

| State | Type | Source |
|-------|------|--------|
| blob URL | `string` | `GET /receipts/files/{file_id}/thumbnail` |

Revoked on unmount. Not stored in Zustand (avoid memory bloat).

---

## Relationships

```
User (user_id)
  └── receipts[] in metadata_db
        ├── file_id → files_db.fs.files (optional)
        └── items[] → flattened to ES receipt_items (analytics only)

Home screen reads:
  count ← metadata_db.receipts (indexed count)
  list  ← metadata_db.receipts (projected, cursor)
  thumb ← files_db GridFS (on demand)
  detail← metadata_db.receipts (full doc on demand)
```

## Validation Rules

- `limit`: integer 1–50; default 12
- `cursor`: must decode to valid `{ created_at, id }`; 400 if malformed
- `receipt_id` detail lookup: must match `user_id` from header — 404 if not found or wrong user
- `file_id` thumbnail: verify `metadata.user_id` matches requester before streaming bytes
