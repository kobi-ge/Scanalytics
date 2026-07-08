# UI Contract Notes

No new backend API contract is required for this feature.

## Existing frontend routes
- `/` → Home page
- `/statistics` → Statistics page
- `/receipts` → new combined Receipts experience

## Existing backend integrations reused
- `GET /insights/receipts/images`
- `GET /insights/receipts/search`
- `POST /ingestion/upload-receipt`
- `POST /ingestion/manual-entry`

## Routing behavior
- Existing `/upload` and `/manual` routes should redirect or route into the new combined Receipts experience to preserve compatibility.
