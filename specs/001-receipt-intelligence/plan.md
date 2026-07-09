# Implementation Plan: Home Screen Performance — Cursor Pagination & Lazy Loading

**Branch**: `001-receipt-intelligence` | **Date**: 2026-07-09 | **Spec**: [specs/001-receipt-intelligence/spec.md](specs/001-receipt-intelligence/spec.md)

**Input**: Refactor the receipt home screen from eager loading of heavy payloads to a decoupled, cursor-paginated, lazy-loading architecture with an independent receipt count banner.

**Spec alignment**: Implements User Story 4 and FR-009–FR-014 / SC-005–SC-008 from [spec.md](spec.md). FR-004 (receipt status UI) and FR-005 (explicit confirm-before-final) are **deferred** per spec Scope — not in this plan. Search uses slim projection only (Decision 8 in [research.md](research.md)); search cursor pagination is deferred.

## Summary

The home screen (`Frontend/src/pages/Dashboard.jsx`) currently loads receipt images via `GET /insights/receipts/images`, which fetches up to 5 GridFS binaries, base64-encodes them, and merges full `items[]` arrays per receipt. Separately, Zustand calls `GET /insights/receipts/recent` (20 full Mongo documents with nested items) on every insights refresh — data that is **never rendered**. The count banner displays `images.length` (≤ 5), not the user's true receipt total.

This plan introduces:
1. Indexed MongoDB queries with a stable `created_at` cursor field
2. A dedicated `GET /receipts/count` endpoint (indexed `count_documents`)
3. A slim, cursor-paginated `GET /receipts` list endpoint (no items, no images)
4. On-demand detail and thumbnail endpoints
5. Frontend decoupled state: count, paginated list, and lazy images fetched in parallel with infinite scroll

## Technical Context

**Language/Version**: Python 3 (FastAPI + Motor) backend; JavaScript React 19 + Vite 8 frontend

**Primary Dependencies**: FastAPI, Motor (async MongoDB), Axios, Zustand, React Router 7

**Storage**: MongoDB `metadata_db.receipts` (nested docs), `files_db` GridFS (`fs.files`/`fs.chunks`); Elasticsearch `receipt_items` (analytics only — not used for home list)

**Testing**: Manual smoke + benchmark scripts; add pytest for InsightsDashboard cursor/count logic (constitution III)

**Target Platform**: Docker Compose stack (API Gateway :8000 → InsightsDashboard :8001)

**Performance Goals**:
- Home first paint: count banner visible within **300 ms** p95 (local stack)
- First page of receipts (12 items, slim): **< 500 ms** p95 without image bytes
- Initial home network payload: **< 50 KB** (vs. current multi-MB base64 images)
- Infinite scroll subsequent pages: **< 300 ms** p95 per page

**Constraints**:
- **No offset pagination** — cursor only (`created_at` + `_id` tie-break)
- Payload minimization — home list ≠ detail view
- Reuse existing patterns: FastAPI `async def`, Motor cursors, Zustand, `insightsApi` via gateway proxy
- No new heavy dependencies (no GraphQL, no Redis cache in v1)

**Scale/Scope**: InsightsDashboard service, storageWorker write path, Dashboard.jsx + useStore.js

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Service Boundaries | PASS | Receipt reads owned by InsightsDashboard; writes stay in storageWorker/ingestion |
| II. Data Integrity | PASS with migration | Add `created_at`/`item_count` at write; backfill script for existing docs |
| III. Test-First | PASS with mitigation | Add pytest for cursor encode/decode + count; manual benchmark in Phase 4 |
| IV. Observability | PASS | Log cursor page latency; expose count query timing in structured logs |
| V. Security | PASS | All endpoints keep `X-User-Id` auth; thumbnails scoped by user_id |

**Post-design re-check**: PASS — new endpoints are versioned alongside deprecated ones; no cross-service schema breaks.

## Project Structure

### Documentation (this feature)

```text
specs/001-receipt-intelligence/
├── plan.md              # this file
├── research.md          # pagination & cursor decisions
├── data-model.md        # slim vs detail receipt shapes
├── quickstart.md        # validation & benchmark guide
├── contracts/
│   ├── receipts-count.md
│   ├── receipts-list.md
│   ├── receipt-detail.md
│   └── receipt-thumbnail.md
└── spec.md
```

### Source Code (repository root)

```text
InsightsDashboard/
├── app/
│   ├── api/endpoints.py          # new count, list, detail, thumbnail routes
│   ├── schemas.py                # ReceiptSummary, ReceiptDetail, CountResponse
│   ├── services/mongo_service.py # cursor queries, projections, count
│   └── utils/cursor.py           # encode/decode cursor tokens (new)

storageWorker/
├── app/services/mongo_service.py   # stamp created_at, item_count on save
└── scripts/backfill_created_at.py  # one-time migration (new)

Frontend/
├── src/
│   ├── pages/Dashboard.jsx       # infinite scroll, decoupled count
│   ├── store/useStore.js         # receiptCount slice; remove /recent from global fetch
│   ├── hooks/useReceiptList.js   # cursor pagination hook (new)
│   ├── hooks/useReceiptCount.js  # independent count fetch (new)
│   └── components/
│       ├── ReceiptListCard.jsx   # slim card + lazy thumbnail (new)
│       └── LazyReceiptImage.jsx  # IntersectionObserver image loader (new)
```

---

## Phase 1: Database & Infrastructure Tuning

### Objective

Ensure MongoDB can serve **O(log n) user-scoped counts** and **stable cursor scans** without collection scans or in-memory sorts as receipt volume grows. Add write-time metadata so list queries never need to read `items[]`.

### Action Items

- **Add `created_at` field at write time** in `storageWorker/app/services/mongo_service.py`:
  - Set `created_at = datetime.utcnow()` on every `save_receipt` upsert
  - Set `item_count = len(data.get("items", []))` denormalized
  - Preserve `purchase_date` (business date) for display; use `created_at` for pagination ordering (upload/recency order)

- **Create compound index** on `metadata_db.receipts`:
  ```javascript
  db.receipts.createIndex(
    { user_id: 1, created_at: -1, _id: -1 },
    { name: "idx_user_created_id", background: true }
  )
  ```
  Add as idempotent init script: `InsightsDashboard/scripts/ensure_indexes.py` (run on InsightsDashboard startup or via compose init container)

- **Create count-supporting index** (covered by above for `user_id` prefix queries):
  ```javascript
  db.receipts.createIndex({ user_id: 1 }, { name: "idx_user_id", background: true })
  ```

- **GridFS index** for thumbnail lookups in `files_db.fs.files`:
  ```javascript
  db.getSiblingDB("files_db").fs.files.createIndex(
    { "metadata.user_id": 1, uploadDate: -1 },
    { name: "idx_gridfs_user_upload", background: true }
  )
  ```

- **Backfill migration** (`storageWorker/scripts/backfill_created_at.py`):
  - For docs missing `created_at`: derive from GridFS `uploadDate` via `file_id`, else parse `purchase_date` at midnight UTC, else `ObjectId` generation time
  - Set `item_count` from `len(items)` if missing
  - Run once against `metadata_db.receipts`; log count of updated docs

- **Legacy `scanalytics_db.scans` fallback**: apply same index pattern if fallback collection remains in use; or document deprecation and exclude from count/list v1

- **Docker Compose**: optionally add `ensure_indexes` as InsightsDashboard startup hook in `docker-compose.yml`

### Data Flow / Logic

```
Kafka data message → storageWorker.save_receipt()
  → stamp created_at, item_count
  → upsert metadata_db.receipts (indexed fields present before first read)

Home count query:
  receipts.count_documents({ user_id }, hint="idx_user_id")  → O(index scan)

Home list query:
  find({ user_id, ...cursorFilter })
    .sort({ created_at: -1, _id: -1 })
    .limit(N)
    .project({ items: 0 })   → never loads heavy nested array
```

### Potential Pitfalls

- **`purchase_date` is a string, not a timestamp** — unsuitable as sole cursor key (same-day receipts collide; not upload order). Always paginate on `created_at`.
- **Backfill ordering mismatch** — receipts backfilled with `purchase_date` may appear out of upload order once; acceptable for v1; document in release notes.
- **Duplicate `_id` format** `{user_id}_{receipt_id|file_id}` is stable — use as tie-breaker after `created_at`.
- **Index build on production** — use `background: true`; monitor build progress on large collections.
- **Manual-entry receipts without `file_id`** — `has_image: false` in slim schema; thumbnail endpoint returns 404 gracefully.

---

## Phase 2: Backend API Refactoring

### Objective

Replace monolithic heavy endpoints with a **contract-separated API surface**: instant count, slim cursor list, on-demand detail, and lazy thumbnails. Deprecate `/receipts/images` and `/receipts/recent` for home use.

### Action Items

#### 2.1 Pydantic schemas (`InsightsDashboard/app/schemas.py`)

Add typed response models (see [contracts/](contracts/)):
- `ReceiptCountResponse` — `{ count: int }`
- `ReceiptSummary` — slim fields only
- `ReceiptListResponse` — `{ items: List[ReceiptSummary], next_cursor: Optional[str], has_more: bool }`
- `ReceiptDetail` — full receipt including `items[]`

#### 2.2 Cursor utility (`InsightsDashboard/app/utils/cursor.py`)

- `encode_cursor(created_at: datetime, doc_id: str) -> str` — URL-safe base64 JSON
- `decode_cursor(token: str) -> CursorPayload` — validate; raise 400 on malformed
- Cursor filter builder:
  ```python
  # Keyset pagination (NOT offset)
  {"$or": [
    {"created_at": {"$lt": cursor.created_at}},
    {"created_at": cursor.created_at, "_id": {"$lt": cursor._id}}
  ]}
  ```

#### 2.3 Mongo service methods (`InsightsDashboard/app/services/mongo_service.py`)

- `count_receipts(user_id) -> int` — `count_documents` with hint
- `list_receipts(user_id, limit, cursor) -> (items, next_cursor, has_more)` — projection excludes `items`
- `get_receipt_detail(user_id, receipt_id) -> dict` — full doc, user-scoped
- `get_thumbnail_bytes(user_id, file_id) -> bytes` — stream raw GridFS bytes with `Cache-Control: private, max-age=3600` (Decision 7: no Pillow in v1)

#### 2.4 New endpoints (`InsightsDashboard/app/api/endpoints.py`)

| Endpoint | Purpose |
|----------|---------|
| `GET /receipts/count` | Independent total count — **no list data** |
| `GET /receipts?limit=12&cursor=<token>` | Slim cursor-paginated list |
| `GET /receipts/{receipt_id}` | Full detail for modal |
| `GET /receipts/files/{file_id}/thumbnail` | Lazy image bytes (JPEG, max width 400px) |

Query params for list:
- `limit` — default 12, max 50
- `cursor` — opaque token from previous response

#### 2.5 Refactor existing endpoints

- **`GET /receipts/recent`** — mark `deprecated` in OpenAPI; internally delegate to slim list `limit=20` OR return 301 docs pointing to `/receipts`
- **`GET /receipts/images`** — mark deprecated; keep temporarily for rollback; remove from frontend in Phase 3
- **`GET /receipts/search`** — apply slim `ReceiptSummary` projection for `search_type=data`; keep existing 100-result cap (FR-007, Decision 8). Cursor pagination for search is **deferred** to a follow-up feature.

#### 2.6 Gateway

No gateway code changes required — `api_gateway/main.py` already proxies `/api/insights/*` with query params forwarded.

#### 2.7 Tests

Add `InsightsDashboard/tests/test_cursor.py`:
- encode/decode roundtrip
- keyset filter correctness (no duplicates across pages)
- count returns independently of list limit

### Data Flow / Logic

```
Client mount (parallel):
  ┌─ GET /receipts/count ──────────────► count_documents → { count: 847 }
  └─ GET /receipts?limit=12 ───────────► slim find → { items[12], next_cursor, has_more: true }

Scroll near bottom:
  GET /receipts?limit=12&cursor=<token>  → next 12 items (no overlap with page 1)

Card enters viewport:
  GET /receipts/files/{file_id}/thumbnail  → binary JPEG (only if has_image)

User opens modal:
  GET /receipts/{receipt_id}  → full items[] array
```

**Slim projection fields** (Mongo `$project`):
```python
{
  "_id": 1, "receipt_id": 1, "file_id": 1, "store": 1,
  "purchase_date": 1, "total_price": 1, "payment_method": 1,
  "item_count": 1, "created_at": 1
}
```

### Potential Pitfalls

- **Race: count vs. new upload** — count may briefly lag list by 1 after upload until storageWorker persists; frontend should optimistically `+1` on successful upload, then reconcile count on next fetch
- **Cursor invalidation** — if user deletes receipt (future), cursor may skip/duplicate; v1 has no delete — document for future
- **Concurrent writes during scroll** — keyset on `(created_at, _id)` prevents offset drift; new receipts appear on page 1 only, not duplicated in page 2
- **`limit` abuse** — cap at 50 server-side
- **Thumbnail memory** — stream response; do not base64 in JSON
- **N+1 thumbnails** — frontend must gate with IntersectionObserver, not fetch all at once

---

## Phase 3: Frontend UI/UX Refactoring

### Objective

Decouple home screen state so the **count banner renders immediately** from `/receipts/count`, the **receipt grid loads slim pages** via infinite scroll, and **images load lazily** per visible card. Remove unused `/receipts/recent` from global insights fetch.

### Action Items

#### 3.1 Zustand store (`Frontend/src/store/useStore.js`)

- Add state slice:
  ```javascript
  receiptCount: null,        // null = loading, number = resolved
  receiptCountError: null,
  ```
- Add `fetchReceiptCount()` — calls `GET /insights/receipts/count`; **does not** set `isFetchingInsights`
- Remove `insightsApi.get('/insights/receipts/recent')` from `fetchInsightsData()` Promise.all — eliminates 20 full-doc fetch on every stats refresh
- Add `incrementReceiptCount()` / `setReceiptCount(n)` for post-upload optimistic update
- Wire upload success handlers (`UploadReceipt.jsx`, `ManualEntry.jsx`, `Receipts.jsx`) to call `incrementReceiptCount()` + invalidate list cursor

#### 3.2 `useReceiptCount` hook (`Frontend/src/hooks/useReceiptCount.js`)

- On `user` available: fire `fetchReceiptCount()` immediately in `App.jsx` or Dashboard mount
- Independent loading state — banner shows skeleton → count, never blocked by list

#### 3.3 `useReceiptList` hook (`Frontend/src/hooks/useReceiptList.js`)

- Manages: `items[]`, `nextCursor`, `hasMore`, `isLoadingInitial`, `isLoadingMore`, `error`
- `loadInitial()` — `GET /receipts?limit=12`
- `loadMore()` — append with `cursor=nextCursor`; guard against duplicate in-flight requests
- `reset()` — clear on user change or post-upload refresh
- Use `react` state or Zustand — prefer local hook state to avoid polluting global store

#### 3.4 Dashboard refactor (`Frontend/src/pages/Dashboard.jsx`)

- **Count banner** (lines 148–153): replace `{images.length}` with `{receiptCount ?? '—'}` + loading shimmer when `null`
- **Remove** `fetchImages` useEffect and `images` local state
- **Remove** coupling `isFetchingInsights` from receipt list loading spinner (stats and list are independent)
- **Recent receipts section**: render `ReceiptListCard` from `useReceiptList.items`
- **Infinite scroll**: `IntersectionObserver` sentinel at list bottom → `loadMore()` when `hasMore`
- **Detail modal**: on card click, fetch `GET /receipts/{receipt_id}` if `items` not present; show loading state in modal
- **Search results modal**: unchanged flow but will benefit from slimmer search response in Phase 2

#### 3.5 New components

- `ReceiptListCard.jsx` — displays store, date, total, item_count; embeds `LazyReceiptImage`
- `LazyReceiptImage.jsx`:
  - Placeholder skeleton until intersecting viewport
  - Then `GET /receipts/files/{file_id}/thumbnail` with `responseType: 'blob'`
  - `URL.createObjectURL` for `<img src>`; revoke on unmount
  - Fallback icon when `!file_id`

#### 3.6 API helpers (`Frontend/src/services/api.js`)

Optional thin wrappers:
```javascript
export const getReceiptCount = () => insightsApi.get('/insights/receipts/count');
export const getReceiptsPage = (params) => insightsApi.get('/insights/receipts', { params });
export const getReceiptDetail = (id) => insightsApi.get(`/insights/receipts/${id}`);
export const getReceiptThumbnailUrl = (fileId) => ... // blob fetch helper
```

#### 3.7 Post-upload refresh strategy

Replace delayed triple `fetchInsightsData()` (20s/45s/90s) with:
- Immediate: `incrementReceiptCount()` + `receiptList.reset(); loadInitial()`
- Keep single delayed `fetchReceiptCount()` at 30s for pipeline lag reconciliation

### Data Flow / Logic

```
App login
  ├─ fetchInsightsData()     → stats only (6 ES endpoints)
  ├─ fetchReceiptCount()     → banner updates (fast)
  └─ (Dashboard mount)
       └─ useReceiptList.loadInitial() → 12 slim cards render

User scrolls
  └─ sentinel visible → loadMore(cursor) → append cards

Card visible
  └─ LazyReceiptImage → thumbnail blob (1 request per visible card)

Upload completes
  ├─ incrementReceiptCount()     (instant banner +1)
  └─ receiptList.reset()         (prepend will happen on reconcile / re-fetch)
```

### Potential Pitfalls

- **Banner blocked by `isFetchingInsights`** — must not gate count on stats fetch; separate loading flags
- **Stale count after failed upload** — reconcile with server count on next `fetchReceiptCount()`
- **Duplicate cards on rapid scroll** — dedupe by `_id` when appending pages
- **Memory leaks from blob URLs** — always `revokeObjectURL` on unmount
- **Modal opens before detail fetch** — show spinner inside modal, not block list
- **Hebrew RTL + infinite scroll** — sentinel placement at list end (bottom in DOM); test on mobile viewport

---

## Phase 4: Verification & Benchmarking

### Objective

Prove the refactor meets performance targets with reproducible measurements. Catch regressions in cursor correctness, count accuracy, and payload size.

### Action Items

#### 4.1 Seed benchmark dataset

- Script `InsightsDashboard/scripts/seed_benchmark_receipts.py`:
  - Insert N synthetic receipts (N = 500, 2000) for a test `user_id`
  - Mix with/without `file_id`; vary `item_count`
  - Run after backfill migration

#### 4.2 Backend benchmarks

Measure with `curl` + timing (`-w "%{time_total}"`) or `httpx` script:

| Scenario | Endpoint | Target (local) |
|----------|----------|----------------|
| Count only | `GET /receipts/count` | < 50 ms |
| First page slim | `GET /receipts?limit=12` | < 200 ms |
| Page 10 cursor | `GET /receipts?limit=12&cursor=...` | < 200 ms |
| Thumbnail single | `GET /receipts/files/{id}/thumbnail` | < 300 ms |
| **Old baseline** | `GET /receipts/images` | document regression (expect 2–10× slower, 10–100× larger) |

- Verify `explain("executionStats")` on list/count queries shows `IXSCAN`, not `COLLSCAN`
- Log `.count_documents` and list query duration in InsightsDashboard structured logs

#### 4.3 Frontend benchmarks

- Chrome DevTools Network tab on home load:
  - **Before**: total transfer > 1 MB (base64 images)
  - **After**: initial transfer < 50 KB (count + slim list); images trickle in
- Performance tab: main thread blocking time during scroll
- Lighthouse: LCP and TBT comparison (optional)

#### 4.4 Functional test checklist

- [ ] Count banner shows correct total for user with 0, 1, 50, 500+ receipts
- [ ] Count loads before first receipt card image appears
- [ ] Infinite scroll loads all pages without duplicates or gaps
- [ ] Upload new receipt → count increments without full page reload
- [ ] Manual entry (no image) → appears in list with placeholder, count +1
- [ ] Detail modal shows full `items[]` after click
- [ ] Search still works; results remain user-scoped
- [ ] Logout/login resets pagination state
- [ ] Deprecated `/receipts/images` still works if called directly (rollback safety)

#### 4.5 Cursor correctness test

Automated in `test_cursor.py`:
- Seed 25 receipts with unique `created_at`
- Paginate with `limit=10` through all pages → assert 25 unique `_id`s, no overlap
- Insert receipt during pagination simulation → assert no duplicate on page 2

#### 4.6 CI / regression

- Add pytest job for InsightsDashboard in CI (if not present)
- `npm run build` + `npm run lint` for frontend
- Document benchmark commands in [quickstart.md](quickstart.md)

### Data Flow / Logic

```
Benchmark run:
  seed 2000 receipts → warm indexes
  → measure count latency (isolated)
  → measure list page 1 latency (isolated)
  → measure list page 50 cursor latency
  → compare payload bytes: old /receipts/images vs new count+list+3 thumbnails
  → record in benchmark-results.md (manual artifact)
```

### Potential Pitfalls

- **Benchmarking without indexes** — always run `ensure_indexes` first; otherwise results mislead
- **Empty collection false positive** — count and list are fast on 0 docs; must test at scale
- **Local vs. Docker latency** — benchmark inside compose network to match production topology
- **Thumbnail cache masking** — disable browser cache (`Cache-Control: no-cache`) during benchmark
- **Race testing** — upload during scroll requires manual or integration test with Kafka pipeline running

---

## Complexity Tracking

| Change | Justification |
|--------|---------------|
| New `created_at` field + backfill | Required for stable cursor pagination; `purchase_date` alone is insufficient |
| 4 new API endpoints | Decouples count, list, detail, image — core requirement |
| Deprecate `/receipts/images` | Eliminates multi-MB home payload; kept for rollback |
| Raw GridFS thumbnail stream (no Pillow) | Matches Decision 7; lazy viewport loading is the primary win |

No constitution violations. API changes are additive with deprecation path per principle I.

## Implementation Order (Cross-Phase)

1. Phase 1 indexes + `created_at` write path + backfill
2. Phase 2 count + list endpoints + tests
3. Phase 2 detail + thumbnail endpoints
4. Phase 3 frontend count + list + lazy images
5. Phase 3 remove `/recent` from Zustand; wire upload hooks
6. Phase 4 benchmark + sign-off
7. Remove deprecated endpoints in follow-up release (after monitoring)
