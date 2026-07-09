# Benchmark Results

Record curl timings after running validation (local Docker Compose).

| Scenario | Endpoint | Time (s) | Payload (bytes) | Pass |
|----------|----------|----------|-----------------|------|
| Count | `GET /receipts/count` | — | — | — |
| List page 1 | `GET /receipts?limit=12` | — | — | — |
| Old baseline | `GET /receipts/images` | — | — | — |

Targets (SC-005–SC-007): count < 300ms p95, list < 500ms p95, count+list < 50KB.
