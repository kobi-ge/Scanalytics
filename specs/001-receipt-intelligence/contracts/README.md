# API Contracts: Home Screen Pagination

New endpoints for decoupled count, cursor-paginated slim list, on-demand detail, and lazy thumbnails.

| Contract | Endpoint | Purpose |
|----------|----------|---------|
| [receipts-count.md](receipts-count.md) | `GET /receipts/count` | Independent total count for banner |
| [receipts-list.md](receipts-list.md) | `GET /receipts` | Cursor-paginated slim list |
| [receipt-detail.md](receipt-detail.md) | `GET /receipts/{receipt_id}` | Full detail with `items[]` |
| [receipt-thumbnail.md](receipt-thumbnail.md) | `GET /receipts/files/{file_id}/thumbnail` | Lazy image bytes |

All endpoints are served by **InsightsDashboard** and proxied through the API Gateway at `/api/insights/*`.

Auth: `X-User-Id` header (existing pattern).

## Deprecated (home screen)

- `GET /receipts/recent` — full docs, limit 20
- `GET /receipts/images` — base64 images + items, limit 5

Removed from frontend in Phase 3; kept for rollback until follow-up release.
