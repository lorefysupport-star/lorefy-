---
{"kind":"bug","id":"LF-084","status":"closed","priority":"P2","area":"characters","date":"2026-10-19","reviewed_on":"2026-10-19","source_commit":"e03ba4e","source_verified":true,"device_verified":false,"service_verified":false,"requires_device":false,"requires_service":false,"verified_on":"2026-10-19","resolution_evidence":"[[sessions/2026-10-19-Character-Search-Coalescing]]","next_action":"Physical responsiveness and real-provider behavior remain separate"}
---
# LF-084: Repeated Pending Name Searches Duplicate Requests

nameSearchCache held only finished results. Concurrent identical normalized
queries therefore sent duplicate provider requests, each with its own deadline.
This consumed avoidable request/rate-limit budget during overlapping searches.

A query-keyed pending map now shares only the validated public provider rows.
Each caller still projects rows against its own work catalog and checks active()
before persistent cast writes. Failure/timeout releases the shared query; expired
JSON cannot populate the cache. Independent queries remain independent. This is
request-count acceptance, not an FPS, live-rate-limit or physical-latency claim.

[[sessions/2026-10-19-Character-Search-Coalescing]] |
[[12-Device-Repairs]] | [[15-Work-Control]]
