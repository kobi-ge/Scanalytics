# Contract: GET /receipts/files/{file_id}/thumbnail

**Service**: InsightsDashboard (proxied at `/api/insights/receipts/files/{file_id}/thumbnail`)

**Auth**: `X-User-Id` header (required)

**Purpose**: Return a receipt image thumbnail for lazy loading in the home grid. Binary response — not base64 JSON.

## Request

```
GET /receipts/files/{file_id}/thumbnail
Headers:
  X-User-Id: <user_id>
```

No query parameters in v1. Server-side resize is deferred (see research.md Decision 7).

## Response

**200 OK**

- `Content-Type`: original file type from GridFS metadata (e.g. `image/jpeg`)
- `Cache-Control`: `private, max-age=3600`
- Body: raw binary image bytes streamed from GridFS (no server-side resize in v1)

## Errors

| Status | Condition |
|--------|-----------|
| 401 | Missing `X-User-Id` |
| 403 | File exists but `metadata.user_id` does not match requester |
| 404 | `file_id` not found in GridFS |

## Implementation notes

1. Verify ownership: `fs.files.find_one({ _id: ObjectId(file_id), "metadata.user_id": user_id })`
2. Stream raw bytes from GridFS via `AsyncIOMotorGridFSBucket`
3. Do NOT add Pillow or other image libraries in v1
4. Do NOT return `items[]` or receipt metadata in this endpoint

## Frontend usage

- Fetch only when card enters viewport (`IntersectionObserver`)
- Use `responseType: 'blob'` in Axios
- Create object URL for `<img src>`; revoke on unmount
- Show placeholder icon when `has_image === false` (skip request)

## Replaces

`GET /receipts/images` which returned all images as base64 JSON in a single multi-MB response.
