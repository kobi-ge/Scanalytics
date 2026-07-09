# Feature Specification: Receipt Intelligence

**Feature Branch**: `001-receipt-intelligence`

**Created**: 2026-07-07

**Updated**: 2026-07-09

**Status**: Draft

**Input**: Enable ScanAnalytics users to upload receipts, extract structured financial information, store it reliably, and review actionable spending insights — including a performant home screen that scales as receipt volume grows.

## Scope

This feature branch covers two coordinated increments:

1. **Core product** (FR-001–FR-008): upload, extraction, storage, insights, and search — existing platform capabilities.
2. **Home screen performance** (FR-009–FR-014, User Story 4): cursor-based pagination, independent receipt count banner, slim list vs. detail payloads, and lazy image loading on the dashboard.

Detailed API contracts and data shapes for the performance increment are defined in [data-model.md](data-model.md) and [contracts/](contracts/).

### Explicitly deferred (not in this increment)

- **FR-004 / FR-005 (processing status UI and review-before-final)**: The platform ingests and stores receipts via the Kafka pipeline, but the home screen does not yet surface per-receipt `processing | complete | failed` states or an explicit user confirmation step. These remain product goals; implementation is deferred to a follow-up feature. Upload feedback continues via existing processing indicators and delayed refresh behavior until then.
- **Search cursor pagination**: Home list uses cursor pagination (FR-009). Search (`GET /receipts/search`) keeps the existing result cap (100) with slim projection only in v1; cursor-based search pagination is deferred.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Upload and review a receipt (Priority: P1)

A user can submit a receipt image and immediately see a clear summary of the transaction, including the merchant, date, amount, and category, so they can confirm that the receipt was captured correctly.

**Why this priority**: This is the core value of the product and the first step toward trustworthy receipt management and analytics.

**Independent Test**: A user can upload a single receipt, wait for processing to complete, and verify that the resulting record is visible and reviewable without needing any other workflow.

**Acceptance Scenarios**:

1. **Given** a signed-in user has a clear receipt image, **When** the receipt is submitted, **Then** the system creates a receipt record and presents a reviewable summary of the extracted information.
2. **Given** a receipt cannot be processed successfully, **When** the user submits it, **Then** the system shows a clear failure state and explains what needs to be corrected or retried.

---

### User Story 2 - Explore spending insights (Priority: P2)

A user can review categorized spending patterns and trends over time so they can understand where money is being spent and identify notable changes.

**Why this priority**: Insights turn stored receipt data into actionable value and make the platform more useful than a simple archive.

**Independent Test**: A user can view insights from a set of processed receipts and confirm that spending summaries are available without needing to edit individual records.

**Acceptance Scenarios**:

1. **Given** a user has multiple processed receipts, **When** they open the analytics view, **Then** the system presents summaries and trends based on the stored data.
2. **Given** a receipt has no category assigned, **When** the user reviews the insights, **Then** the system handles it consistently without breaking the overall summary.

---

### User Story 3 - Search and manage historical receipts (Priority: P3)

A user can find previously uploaded receipts by key details such as merchant, date, or category so they can retrieve and review older transactions easily.

**Why this priority**: Retrieval and organization improve long-term usefulness and reduce friction when users need past receipts.

**Independent Test**: A user can search for a prior receipt and reach the corresponding record directly from the search results.

**Acceptance Scenarios**:

1. **Given** a user has previously uploaded receipts, **When** they search by a known merchant or category, **Then** the matching receipts are returned within the existing result cap (100), using a slim payload without nested `items[]` or image bytes.
2. **Given** a user opens an existing receipt record from search or the home list, **When** they review it, **Then** the system fetches full detail on demand (including line items) via the detail endpoint.

---

### User Story 4 - Fast home screen at scale (Priority: P1)

A signed-in user opens the home screen and sees their total receipt count and a scrollable list of recent receipts that remains responsive even with hundreds or thousands of stored receipts.

**Why this priority**: The current home screen loads heavy payloads eagerly (base64 images and full receipt documents), causing latency and UI freezing as data grows. This blocks daily use of the product.

**Independent Test**: A user with 500+ receipts sees the count banner and first page of receipts load quickly; scrolling loads additional pages without duplicates; images appear only for visible cards.

**Acceptance Scenarios**:

1. **Given** a signed-in user with many receipts, **When** they open the home screen, **Then** the total receipt count banner updates independently and in parallel with the first page of the receipt list (the banner MUST NOT wait for the list or depend on `items.length`).
2. **Given** a user scrolls the recent-receipts list, **When** they reach the end of the loaded page, **Then** the next page loads via cursor-based pagination (no offset/`skip`) without duplicate or missing receipts.
3. **Given** a user views the home receipt grid, **When** cards enter the viewport, **Then** thumbnail images load lazily; full receipt detail (including `items[]`) loads only when the user opens a receipt.
4. **Given** a user uploads a new receipt, **When** processing completes, **Then** the count banner reflects the new total (optimistically, then reconciled) and the new receipt appears at the top of the list after refresh.

---

### Edge Cases

- What happens when a receipt image is too blurry or unreadable for reliable extraction?
- How does the system handle duplicate submissions for the same receipt?
- What happens when a user submits a receipt with missing or ambiguous transaction details?
- What happens when the count endpoint and list endpoint race during or immediately after an upload? (Count may briefly lag; frontend reconciles optimistically.)
- What happens when a manual-entry receipt has no `file_id`? (List shows placeholder; thumbnail request is skipped.)
- What happens when legacy receipts lack `created_at` before backfill runs? (Backfill migration assigns a derived timestamp; ordering may differ from true upload order for legacy data only.)

## Requirements *(mandatory)*

### Functional Requirements

**Core product**

- **FR-001**: The system MUST allow users to submit receipts for processing.
- **FR-002**: The system MUST extract key transaction information such as merchant, date, amount, and category from submitted receipts.
- **FR-003**: The system MUST preserve both the submitted receipt artifact and the structured record created from it.
- **FR-004**: The system MUST present each receipt with a clear status such as processing, complete, or failed. *(Deferred: not implemented in this increment; see Scope.)*
- **FR-005**: The system MUST allow users to review and confirm extracted information before it is treated as final. *(Deferred: detail modal provides read-only review; explicit confirm workflow deferred.)*
- **FR-006**: The system MUST provide summaries and trends that help users understand their spending over time.
- **FR-007**: The system MUST support searching and filtering receipts by recognizable attributes such as merchant, date, or category.
- **FR-008**: The system MUST provide clear feedback when processing fails, is incomplete, or requires manual attention.

**Home screen performance**

- **FR-009**: The home receipt list MUST use cursor-based (keyset) pagination on `(created_at, _id)`; offset-based pagination (`skip`/`offset`) MUST NOT be used.
- **FR-010**: The system MUST expose a dedicated `GET /receipts/count` endpoint that returns only the user's total receipt count using an indexed database count — independent of any list query.
- **FR-011**: The home list API MUST return a slim `ReceiptSummary` payload that excludes `items[]`, OCR output, and image bytes; full detail MUST be available via a separate detail endpoint.
- **FR-012**: Receipt thumbnail images MUST be served via a dedicated lazy-load endpoint (binary stream), fetched per visible card — not bundled in the list response.
- **FR-013**: The frontend MUST fetch receipt count and the first list page in parallel with decoupled state so the count banner renders without waiting for the paginated list.
- **FR-014**: The frontend MUST support infinite scroll for the home receipt list, appending cursor-paginated pages without duplicate entries.

### Key Entities *(include if feature involves data)*

- **Receipt**: Full stored document in `metadata_db.receipts` — merchant, dates, totals, `items[]`, optional `file_id`. See [data-model.md](data-model.md).
- **ReceiptSummary**: Slim home-list view — summary fields and `item_count`; no `items[]` or images.
- **ReceiptCount**: Total receipts for a user; sourced independently from list pagination.
- **User**: Authenticated owner of receipts and insights.
- **Transaction Record**: Normalized line-item data used for search and analytics (Elasticsearch `receipt_items`).
- **Insight Summary**: Aggregated spending metrics for statistics views.

## Success Criteria *(mandatory)*

### Measurable Outcomes

**Core product**

- **SC-001**: At least 90% of submitted receipts are available for review in a completed state within 10 minutes of upload.
- **SC-002**: Users can find a receipt by merchant, date, or category within 10 seconds after entering a search term.
- **SC-003**: At least 80% of users can complete the upload-to-review flow without needing support.
- **SC-004**: Users report that the insights view helps them understand spending patterns clearly and quickly.

**Home screen performance** (local Docker Compose stack; user with ≥ 500 receipts)

- **SC-005**: The receipt count banner is visible within **300 ms** p95 after home mount, independently of list and image loading.
- **SC-006**: The first slim list page (12 receipts, no images) returns within **500 ms** p95.
- **SC-007**: Initial home network payload (count + first list page) is **< 50 KB** — excluding lazy thumbnail bytes.
- **SC-008**: Cursor-paginated scroll through 500+ receipts produces **zero duplicate** receipt IDs across pages (verified by automated cursor tests).

## Assumptions

- Users have access to a supported device and a stable internet connection.
- Receipt submissions are limited to documents that are legible enough to be processed.
- The feature targets authenticated users who already have access to the platform.
- Existing storage, search, and analytics services are available to support the workflow.
- MongoDB compound indexes on `(user_id, created_at, _id)` are created before performance validation.
- Legacy receipts without `created_at` are backfilled before cursor pagination goes live.

## Related Artifacts

| Artifact | Purpose |
|----------|---------|
| [plan.md](plan.md) | Four-phase implementation plan |
| [research.md](research.md) | Technical decisions (cursor, count, thumbnails) |
| [data-model.md](data-model.md) | ReceiptSummary, indexes, frontend state |
| [contracts/](contracts/) | API contracts for count, list, detail, thumbnail |
| [quickstart.md](quickstart.md) | Validation and benchmark scenarios |
