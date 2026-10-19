---
{"kind":"bug","id":"LF-082","status":"closed","priority":"P1","area":"characters","date":"2026-10-19","reviewed_on":"2026-10-19","source_commit":"ed2ea33","source_verified":true,"device_verified":false,"service_verified":false,"requires_device":false,"requires_service":false,"verified_on":"2026-10-19","resolution_evidence":"[[sessions/2026-10-19-Character-Provider-Body]]","next_action":"Physical and live-provider behavior remain separate; traversal deadlines do not abort transport"}
---
# LF-082: Character Provider Bodies Can Wait Forever

Header deadlines did not cover eighteen downstream response.json reads. A stalled
JSON body could hold the combined cast Promise.allSettled indefinitely despite a
verified bundled seed. Portrait galleries had the same response-lifecycle gap.

A shared readResponseJson helper bounds each body read with its existing provider
budget. HTTP errors, retry limits, fallback selection, pagination and completeness
flags remain unchanged. Header and body are separately bounded phases, not one
global cast deadline. No transport abort or truncation of valid cast is claimed.
Name search retains its separate single ten-second fetch-plus-body deadline.

[[sessions/2026-10-19-Character-Provider-Body]] |
[[12-Device-Repairs]] | [[15-Work-Control]]
