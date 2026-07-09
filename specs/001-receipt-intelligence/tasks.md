# Tasks: Home Screen Performance — Cursor Pagination & Lazy Loading

**Input**: Design documents from `specs/001-receipt-intelligence/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included per constitution III (analytics/cursor behavior) and plan Phase 2.7 / SC-008.

**Organization**: Tasks grouped by user story. **US4** (P1) is the primary deliverable for this branch; **US1** integration follows; **US3** search slim projection; **US2** verification.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story label (US1–US4)

## Path Conventions

- **InsightsDashboard/** — FastAPI read API (Motor/MongoDB)
- **storageWorker/** — Kafka consumer write path
- **Frontend/src/** — React 19 + Zustand

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Scaffold scripts, tests, and frontend directories required by the plan.

- [x] T001 Create `InsightsDashboard/scripts/` directory and empty `InsightsDashboard/scripts/__init__.py` if needed for module imports
- [x] T002 [P] Create `storageWorker/scripts/` directory for migration scripts
- [x] T003 [P] Create `InsightsDashboard/tests/` with `InsightsDashboard/tests/__init__.py` and add `pytest` to `InsightsDashboard/requirements.txt`
- [x] T004 [P] Create `Frontend/src/hooks/` directory for `useReceiptCount.js` and `useReceiptList.js`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database fields, indexes, and backfill MUST complete before cursor pagination APIs go live.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T005 Stamp `created_at` (UTC datetime) and `item_count` on every upsert in `storageWorker/app/services/mongo_service.py`
- [x] T006 Implement idempotent index creation in `InsightsDashboard/scripts/ensure_indexes.py` per `data-model.md` (`idx_user_created_id`, `idx_user_id`, `idx_gridfs_user_upload`)
- [x] T007 Wire `ensure_indexes.py` to run on InsightsDashboard startup in `InsightsDashboard/app/main.py`
- [x] T008 Implement one-time backfill script `storageWorker/scripts/backfill_created_at.py` for legacy receipts missing `created_at` or `item_count`
- [x] T009 Add backfill execution step to `specs/001-receipt-intelligence/quickstart.md` Prerequisites section

**Checkpoint**: Run backfill against dev DB; verify `db.receipts.getIndexes()` includes compound index; all receipts have `created_at`.

---

## Phase 3: User Story 4 — Fast Home Screen at Scale (Priority: P1) 🎯 MVP

**Goal**: Decoupled count banner, cursor-paginated slim list, lazy thumbnails, infinite scroll, on-demand detail modal.

**Independent Test**: User with 50+ receipts opens home → count appears before images → scroll loads pages without duplicates → modal fetches full `items[]` on click. See `quickstart.md` scenarios 1–5.

**Implements**: FR-009–FR-014, SC-005–SC-008

### Tests for User Story 4

> **NOTE: Write these tests FIRST; ensure they FAIL before implementation (constitution III).**

- [x] T010 [P] [US4] Write failing cursor encode/decode roundtrip tests in `InsightsDashboard/tests/test_cursor.py`
- [x] T011 [P] [US4] Write failing keyset pagination no-duplicate tests in `InsightsDashboard/tests/test_cursor.py`
- [x] T012 [P] [US4] Write failing count-independence test (count unchanged by list limit) in `InsightsDashboard/tests/test_cursor.py`

### Backend Implementation for User Story 4

- [x] T013 [P] [US4] Add `ReceiptCountResponse`, `ReceiptSummary`, `ReceiptListResponse`, `ReceiptDetail` Pydantic models in `InsightsDashboard/app/schemas.py` per `contracts/`
- [x] T014 [US4] Implement `encode_cursor`, `decode_cursor`, and keyset filter builder in `InsightsDashboard/app/utils/cursor.py`
- [x] T015 [US4] Implement `count_receipts()` and `list_receipts()` with slim projection (exclude `items`) in `InsightsDashboard/app/services/mongo_service.py`
- [x] T016 [US4] Implement `get_receipt_detail()` with `user_id` scope check in `InsightsDashboard/app/services/mongo_service.py`
- [x] T017 [US4] Implement `get_thumbnail_stream()` with GridFS ownership check (raw bytes, no Pillow) in `InsightsDashboard/app/services/mongo_service.py`
- [x] T018 [US4] Add `GET /receipts/count` endpoint in `InsightsDashboard/app/api/endpoints.py` per `contracts/receipts-count.md`
- [x] T019 [US4] Add `GET /receipts` cursor list endpoint (`limit`, `cursor` query params) in `InsightsDashboard/app/api/endpoints.py` per `contracts/receipts-list.md`
- [x] T020 [US4] Add `GET /receipts/{receipt_id}` detail endpoint in `InsightsDashboard/app/api/endpoints.py` per `contracts/receipt-detail.md`
- [x] T021 [US4] Add `GET /receipts/files/{file_id}/thumbnail` streaming endpoint in `InsightsDashboard/app/api/endpoints.py` per `contracts/receipt-thumbnail.md`
- [x] T022 [P] [US4] Mark `GET /receipts/recent` and `GET /receipts/images` as deprecated in OpenAPI metadata in `InsightsDashboard/app/api/endpoints.py`
- [x] T023 [US4] Add structured latency logging for count and list queries in `InsightsDashboard/app/api/endpoints.py` or `InsightsDashboard/app/services/mongo_service.py`

### Frontend Implementation for User Story 4

- [x] T024 [P] [US4] Add `getReceiptCount`, `getReceiptsPage`, `getReceiptDetail`, `getReceiptThumbnail` helpers in `Frontend/src/services/api.js`
- [x] T025 [US4] Add `receiptCount`, `receiptCountError`, `fetchReceiptCount()`, `incrementReceiptCount()`, `setReceiptCount()` in `Frontend/src/store/useStore.js`
- [x] T026 [US4] Remove `/insights/receipts/recent` from `fetchInsightsData()` in `Frontend/src/store/useStore.js`
- [x] T027 [P] [US4] Create `useReceiptCount` hook in `Frontend/src/hooks/useReceiptCount.js`
- [x] T028 [P] [US4] Create `useReceiptList` hook with `loadInitial`, `loadMore`, `reset`, dedupe by `id` in `Frontend/src/hooks/useReceiptList.js`
- [x] T029 [P] [US4] Create `LazyReceiptImage.jsx` with IntersectionObserver and blob URL lifecycle in `Frontend/src/components/LazyReceiptImage.jsx`
- [x] T030 [P] [US4] Create `ReceiptListCard.jsx` slim card (store, date, total, item_count) in `Frontend/src/components/ReceiptListCard.jsx`
- [x] T031 [US4] Refactor count banner to use `receiptCount` (not `images.length`) in `Frontend/src/pages/Dashboard.jsx`
- [x] T032 [US4] Remove `/receipts/images` fetch, `images` state, and `isFetchingInsights` coupling from list loading in `Frontend/src/pages/Dashboard.jsx`
- [x] T033 [US4] Render `ReceiptListCard` grid from `useReceiptList` in `Frontend/src/pages/Dashboard.jsx`
- [x] T034 [US4] Add infinite scroll IntersectionObserver sentinel calling `loadMore()` in `Frontend/src/pages/Dashboard.jsx`
- [x] T035 [US4] Refactor detail modal to fetch `GET /receipts/{id}` on demand with loading state in `Frontend/src/pages/Dashboard.jsx`
- [x] T036 [US4] Call `fetchReceiptCount()` on authenticated app init in `Frontend/src/App.jsx`

**Checkpoint**: Home screen loads count + slim list in parallel; scroll paginates; thumbnails lazy-load; pytest cursor tests pass.

---

## Phase 4: User Story 1 — Upload and Review a Receipt (Priority: P1)

**Goal**: After upload or manual entry, count and list refresh optimistically; user can review new receipt in home/detail flow.

**Independent Test**: Upload one receipt → count increments → receipt appears at top of home list after pipeline without full page reload.

**Implements**: US4 acceptance scenario 4; FR-001 integration

### Implementation for User Story 1

- [x] T037 [US1] Wire upload success in `Frontend/src/pages/UploadReceipt.jsx` to call `incrementReceiptCount()` and expose list reset callback
- [x] T038 [US1] Wire manual entry success in `Frontend/src/pages/ManualEntry.jsx` to call `incrementReceiptCount()` and expose list reset callback
- [x] T039 [US1] Replace triple `setTimeout(fetchInsightsData)` with immediate list reset + single delayed `fetchReceiptCount()` reconcile in `Frontend/src/pages/UploadReceipt.jsx` and `Frontend/src/pages/ManualEntry.jsx`
- [x] T040 [US1] Pass list `reset()` from `Dashboard.jsx` via context or Zustand callback so upload pages can trigger home list refresh in `Frontend/src/pages/Receipts.jsx`

**Checkpoint**: Upload flow updates banner and home list per US4 scenario 4.

---

## Phase 5: User Story 3 — Search and Manage Historical Receipts (Priority: P3)

**Goal**: Search returns slim payloads; detail fetched on demand from search results modal.

**Independent Test**: Search by store/category → results have no `items[]` → click result → detail modal loads full line items.

**Implements**: FR-007 slim projection; US3 acceptance scenarios

### Implementation for User Story 3

- [x] T041 [US3] Apply slim projection (exclude `items[]`) in `search_receipts()` in `InsightsDashboard/app/services/mongo_service.py`
- [x] T042 [US3] Map `GET /receipts/search` (`search_type=data`) response to `ReceiptSummary` shape in `InsightsDashboard/app/api/endpoints.py`
- [x] T043 [US3] Update search results modal in `Frontend/src/pages/Dashboard.jsx` to fetch detail via `getReceiptDetail(id)` on row click

**Checkpoint**: Search modal works with slim results and on-demand detail.

---

## Phase 6: User Story 2 — Explore Spending Insights (Priority: P2)

**Goal**: Statistics page continues to work after removing `/receipts/recent` from global insights fetch.

**Independent Test**: Open `/statistics` → all charts and benchmark data load without errors.

**Implements**: FR-006 regression guard

### Verification for User Story 2

- [x] T044 [US2] Verify `fetchInsightsData()` still populates all `stats` fields and `Statistics.jsx` renders correctly after T026 change in `Frontend/src/pages/Statistics.jsx`
- [x] T045 [US2] Confirm home spending banner (`stats.benchmark.user_total_spending`) still loads independently of receipt list in `Frontend/src/pages/Dashboard.jsx`

**Checkpoint**: Analytics unchanged; no regression from insights fetch refactor.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Benchmarking, seed data, validation, and release readiness.

- [x] T046 [P] Implement `InsightsDashboard/scripts/seed_benchmark_receipts.py` for load testing per `plan.md` Phase 4
- [x] T047 Run `pytest InsightsDashboard/tests/test_cursor.py -v` and fix any failures
- [x] T048 [P] Run `npm run build` and `npm run lint` in `Frontend/`
- [x] T049 Execute full validation checklist in `specs/001-receipt-intelligence/quickstart.md` (scenarios 1–7)
- [x] T050 [P] Record benchmark curl timings (count, list, old `/receipts/images`) in `specs/001-receipt-intelligence/benchmark-results.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — **BLOCKS all user stories**
- **Phase 3 (US4)**: Depends on Phase 2 — primary MVP
- **Phase 4 (US1)**: Depends on Phase 3 frontend store/hooks
- **Phase 5 (US3)**: Depends on Phase 3 detail endpoint (T020)
- **Phase 6 (US2)**: Depends on Phase 3 T026 (can run in parallel with Phase 4/5)
- **Phase 7 (Polish)**: Depends on Phases 3–6

### User Story Dependencies

| Story | Depends on | Can parallelize with |
|-------|------------|----------------------|
| US4 | Foundational (Phase 2) | — (go first) |
| US1 | US4 frontend (T025–T036) | US3 backend after T020 |
| US3 | US4 detail endpoint (T020) | US1 after T036 |
| US2 | US4 T026 only | US1, US3 |

### Within User Story 4

1. T010–T012 tests (fail first)
2. T013–T014 schemas + cursor util [P with T013]
3. T015–T017 mongo service methods (sequential)
4. T018–T021 endpoints (sequential after mongo)
5. T024–T030 frontend [P] components/hooks
6. T031–T036 Dashboard integration (sequential)

### Parallel Opportunities

**Phase 1**: T002, T003, T004 in parallel after T001

**Phase 3 backend**: T013 parallel with T010–T012; T022 parallel with T018–T021

**Phase 3 frontend**: T024, T027, T028, T029, T030 all parallel after T018–T021 deployed

**Phase 7**: T046, T048, T050 parallel

---

## Parallel Example: User Story 4 Backend

```bash
# Tests first (must fail):
pytest InsightsDashboard/tests/test_cursor.py -v

# Parallel after tests written:
# T013 schemas.py + T014 cursor.py (different files)

# Then sequential: T015 → T016 → T017 → T018–T021
```

## Parallel Example: User Story 4 Frontend

```bash
# After API endpoints live:
# T027 useReceiptCount.js
# T028 useReceiptList.js
# T029 LazyReceiptImage.jsx
# T030 ReceiptListCard.jsx
# (all different files — parallel)

# Then T031–T035 Dashboard.jsx integration (single file — sequential)
```

---

## Implementation Strategy

### MVP First (Recommended)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (indexes + backfill)
3. Complete Phase 3: US4 (backend count/list/detail/thumbnail + frontend home screen)
4. **STOP and VALIDATE**: `quickstart.md` scenarios 1–5; pytest passes
5. Add Phase 4 (US1 upload integration) → validate scenario 6
6. Add Phases 5–7 as time permits

### Incremental Delivery

| Increment | Delivers | Validates |
|-----------|----------|-----------|
| Foundational | `created_at`, indexes, backfill | Mongo explain IXSCAN |
| US4 backend | count + list + detail + thumbnail APIs | curl + pytest |
| US4 frontend | home screen pagination | SC-005–SC-007 manual |
| US1 | upload → count/list refresh | US4 scenario 4 |
| US3 | slim search | SC-002 smoke |
| US2 | stats regression | Statistics page |
| Polish | benchmarks | SC-008 automated |

### Suggested MVP Scope

**Phases 1 + 2 + 3 (US4 only)** — delivers the core performance refactor. US1 upload integration (Phase 4) is the next highest-value increment.

---

## Notes

- FR-004 and FR-005 are **deferred** per spec — no tasks generated
- Search cursor pagination is **deferred** — US3 tasks cover slim projection only
- Gateway (`api_gateway/main.py`) needs no changes — proxy already forwards query params
- Commit after each task or logical group; run pytest before merging US4 backend
