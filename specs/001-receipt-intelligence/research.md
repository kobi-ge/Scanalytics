# Research: Home Screen Performance — Cursor Pagination & Lazy Loading

## Decisions

### Decision 1: Cursor keyset pagination on `(created_at, _id)` — not offset

**Decision**: Use keyset (cursor) pagination with compound sort `{ created_at: -1, _id: -1 }` and opaque base64-encoded cursor tokens. Reject `skip`/`offset` entirely.

**Rationale**: Offset pagination degrades linearly as `skip` grows (MongoDB must walk past skipped docs). Keyset pagination stays O(limit) per page at any depth. The `_id` tie-breaker prevents duplicates when two receipts share the same `created_at` millisecond.

**Alternatives considered**:
- **Offset (`limit`/`offset`)**: rejected — explicit user constraint; fails at scale.
- **`purchase_date` as cursor**: rejected — string date only, many receipts per day, not upload order.
- **`_id` alone**: rejected — ObjectId/time ordering doesn't match "most recently uploaded" UX.

---

### Decision 2: Add `created_at` at write time in storageWorker

**Decision**: Stamp `created_at: datetime.utcnow()` and `item_count: int` in `storageWorker` on every receipt upsert. Backfill existing documents via one-time script.

**Rationale**: No `created_at` exists today; queries sort on `purchase_date` (business date) or GridFS `uploadDate` (files only). List pagination needs a monotonic server-side timestamp present on all receipt types (scan + manual).

**Alternatives considered**:
- **GridFS `uploadDate` only**: rejected — manual entries have no file.
- **Separate `receipt_summaries` collection**: rejected — over-engineering; projection + index on existing collection suffices.
- **Elasticsearch for list**: rejected — ES stores flattened items, not receipt-level summaries; adds sync complexity.

---

### Decision 3: Dedicated `GET /receipts/count` endpoint

**Decision**: Hyper-light endpoint using `count_documents({ user_id })` with index hint. Returns only `{ count: int }`. No shared code path with list query.

**Rationale**: User requirement — banner must load independently and instantly. Coupling count to paginated list (`items.length` or `has_more` inference) fails when list is still loading or paginated.

**Alternatives considered**:
- **Count in list response header**: rejected — banner would wait for list request.
- **ES cardinality aggregation**: rejected — slower, approximate, wrong service boundary for receipt totals.
- **Client-side accumulation while scrolling**: rejected — user would see wrong count until all pages loaded.

---

### Decision 4: Slim list vs. detail endpoint separation

**Decision**:
- **List** (`GET /receipts`): `ReceiptSummary` — no `items[]`, no image bytes
- **Detail** (`GET /receipts/{receipt_id}`): full `items[]` on modal open
- **Thumbnail** (`GET /receipts/files/{file_id}/thumbnail`): binary image, lazy per card

**Rationale**: Current `/receipts/images` returns base64-encoded full images + full `items[]` for 5 receipts — multi-MB home payload. Current `/receipts/recent` returns 20 full Mongo docs including `items[]` — fetched by Zustand but never rendered.

**Alternatives considered**:
- **GraphQL**: rejected — new dependency, overkill.
- **Single endpoint with `?fields=` sparse fieldsets**: rejected — harder to enforce payload limits; separate contracts are clearer.
- **WebSocket push for new receipts**: deferred — optimistic count increment sufficient for v1.

---

### Decision 5: Frontend decoupled state with parallel fetches

**Decision**: Three independent client concerns:
1. `useReceiptCount` → `/receipts/count` (Zustand `receiptCount`)
2. `useReceiptList` → `/receipts?cursor` (local hook state)
3. `LazyReceiptImage` → thumbnail per visible card

Remove `/receipts/recent` from `fetchInsightsData()`. Decouple list loading from `isFetchingInsights`.

**Rationale**: Dashboard currently blocks receipt grid on `isFetchingInsights` (ES stats) AND fetches images separately. Count uses `images.length` (max 5). All three must be independent.

**Alternatives considered**:
- **React Query / SWR**: rejected — Zustand + hooks match existing patterns; avoid new dependency unless team prefers migration.
- **Single Zustand store for list pages**: rejected — pagination state is page-local; only count is global (banner + upload).

---

### Decision 6: Deprecate, don't delete, legacy endpoints

**Decision**: Mark `/receipts/images` and `/receipts/recent` deprecated in OpenAPI. Remove frontend usage in Phase 3. Delete in follow-up release after monitoring.

**Rationale**: Constitution I — explicit contracts with compatibility. Rollback path if pagination regresses.

**Alternatives considered**:
- **Hard delete immediately**: rejected — no rollback for production issues.

---

### Decision 7: Thumbnail delivery — raw GridFS stream in v1 (no Pillow)

**Decision**: v1 thumbnail endpoint streams raw GridFS bytes with `Content-Type` from file metadata and `Cache-Control: private, max-age=3600`. Do **not** add Pillow or other image-processing dependencies to InsightsDashboard in v1.

**Rationale**: `InsightsDashboard/requirements.txt` does not include Pillow. The primary payload win comes from decoupling images from the list response and lazy-loading per visible card — not from server-side resize. Adding Pillow increases dependency surface and deployment risk for marginal gain in v1.

**Alternatives considered**:
- **Pillow resize to max_width=400**: deferred to v2 if raw thumbnails prove too large in practice.
- **Base64 in JSON** (current `/receipts/images`): rejected — multi-MB home payloads.

---

### Decision 8: Search pagination — slim projection only in v1

**Decision**: `GET /receipts/search` (`search_type=data`) returns slim `ReceiptSummary` payloads (no `items[]`, no images) with the existing **100-result cap**. Cursor pagination for search is **out of scope** for this increment.

**Rationale**: Home list is the primary scalability bottleneck. Search is modal-driven with a bounded result set; slim projection addresses payload size without the complexity of filtered cursor queries across `items.category` regex matches.

**Alternatives considered**:
- **Cursor pagination for search in v1**: rejected — increases scope; different query patterns than home list.
- **Keep full `items[]` in search results**: rejected — contradicts payload minimization (FR-011).
