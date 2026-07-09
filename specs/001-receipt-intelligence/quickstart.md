# Quickstart: Validate Home Screen Pagination Performance

## Prerequisites

- Docker Compose stack running (MongoDB, Kafka, InsightsDashboard, API Gateway, Frontend)
- Test user account with JWT token
- `userId` in localStorage (set automatically on login)
- **One-time backfill** for legacy receipts missing `created_at`:
  ```bash
  python storageWorker/scripts/backfill_created_at.py
  ```

## Setup

```bash
# From repo root
docker compose up -d

# Ensure indexes (after Phase 1 implementation)
docker compose exec insights-dashboard python scripts/ensure_indexes.py

# Optional: seed benchmark data (after Phase 4 script exists)
docker compose exec insights-dashboard python scripts/seed_benchmark_receipts.py --user-id <USER_ID> --count 500

# Frontend dev
cd Frontend && npm install && npm run dev
```

## Validation Scenarios

Targets **SC-005–SC-008** from [spec.md](spec.md).

### 1. Independent count banner (CRITICAL — FR-010, FR-013, SC-005)

1. Log in and navigate to Home (`/`)
2. Open DevTools → Network
3. Confirm `GET /api/insights/receipts/count` fires **in parallel** with `GET /api/insights/receipts?limit=12`
4. Confirm count banner updates **before** thumbnail requests complete
5. Confirm banner shows true total (not page size, not 5)

**Expected**: Count response < 100 ms locally; payload < 100 bytes.

### 2. Slim list first page (FR-011, SC-006, SC-007)

1. Inspect `GET /api/insights/receipts?limit=12` response
2. Confirm each item has **no** `items[]` array
3. Confirm response has `next_cursor` and `has_more` when user has > 12 receipts
4. Confirm total response size < 10 KB for 12 items

**Expected**: No base64 image data in list response.

### 3. Infinite scroll / cursor pagination (FR-009, FR-014, SC-008)

1. User with 30+ receipts: scroll to bottom of "קבלות אחרונות"
2. Confirm second request: `GET /api/insights/receipts?limit=12&cursor=<token>`
3. Confirm no duplicate cards between pages
4. Confirm scrolling stops when `has_more: false`

**Expected**: Each page loads in < 500 ms locally.

### 4. Lazy thumbnail loading (FR-012)

1. Reload home with many receipts
2. Confirm thumbnails load **only** for visible cards (not all at once)
3. Confirm requests go to `/receipts/files/{file_id}/thumbnail` with blob response
4. Scroll down — new thumbnails fetch as cards enter viewport

**Expected**: Initial page transfer < 50 KB (count + list, no images).

### 5. Detail modal on demand

1. Click a receipt card
2. Confirm `GET /api/insights/receipts/{id}` fires
3. Confirm modal shows full `items[]` table

**Expected**: Detail fetch only on click, not on home load.

### 6. Upload count reconciliation

1. Note current count in banner
2. Upload a new receipt via `/receipts`
3. Confirm banner increments optimistically (or after pipeline)
4. Confirm new receipt appears at top of list after refresh
5. Re-fetch count — matches list total

### 7. Decoupled from stats loading

1. Throttle network (DevTools → Slow 3G) on stats endpoints only
2. Confirm receipt list and count still load independently of `isFetchingInsights`

## Benchmark Commands

```bash
# Set variables
USER_ID="<your_user_id>"
BASE="http://localhost:8000/api/insights"

# Count latency
curl -s -o /dev/null -w "count: %{time_total}s\n" \
  -H "X-User-Id: $USER_ID" "$BASE/receipts/count"

# First page slim list
curl -s -o /dev/null -w "list page 1: %{time_total}s size: %{size_download} bytes\n" \
  -H "X-User-Id: $USER_ID" "$BASE/receipts?limit=12"

# Baseline (old heavy endpoint — compare regression)
curl -s -o /dev/null -w "images (old): %{time_total}s size: %{size_download} bytes\n" \
  -H "X-User-Id: $USER_ID" "$BASE/receipts/images"
```

Record results in a `benchmark-results.md` note. Target: count + list combined < 10% of old `/receipts/images` payload size.

## MongoDB index verification

```javascript
// mongosh
use metadata_db
db.receipts.find({ user_id: "USER_ID" }).sort({ created_at: -1, _id: -1 }).limit(12).explain("executionStats")
// Confirm: winningPlan.inputStage.stage === "IXSCAN"
```

## Automated tests

```bash
# After Phase 2 tests exist
docker compose exec insights-dashboard pytest tests/test_cursor.py -v

# Frontend
cd Frontend && npm run build && npm run lint
```

## Rollback check

Confirm deprecated endpoints still respond (for emergency rollback):

```bash
curl -H "X-User-Id: $USER_ID" "$BASE/receipts/recent"
curl -H "X-User-Id: $USER_ID" "$BASE/receipts/images"
```
