---
{"kind":"bug","id":"LF-078","status":"closed","priority":"P1","area":"characters","date":"2026-10-19","reviewed_on":"2026-10-19","source_commit":"da0aa41","source_verified":true,"device_verified":false,"service_verified":false,"requires_device":false,"requires_service":false,"verified_on":"2026-10-19","resolution_evidence":"[[sessions/2026-10-19-Character-Search-Deadline]]","next_action":"Validate physical latency on a future matching release; original black-screen cause and other provider paths remain separate"}
---
# LF-078: Character Search Body Can Wait Forever

The ten-second name-search deadline covered only fetch headers. Reading JSON
afterward had no deadline, so a stalled body kept the editor loading indefinitely.
Three deterministic regressions failed for a stalled body, a combined header/body
budget and a late response after the intended deadline.

[Character system](../../modules/lorefy-character-system.js) now wraps headers and
JSON in one ten-second promise deadline. Late completion cannot reach either
search-cache write or cast-cache mapping. The existing editor catch/finally clears
busy state and permits same-query retry. This does not abort the underlying
transport or prove a cause for the original Discord black-screen/typing reports.

[[sessions/2026-10-19-Character-Search-Deadline]] |
[[12-Device-Repairs]] | [[15-Work-Control]]
