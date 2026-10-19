---
{"kind":"bug","id":"LF-079","status":"closed","priority":"P1","area":"characters","date":"2026-10-19","reviewed_on":"2026-10-19","source_commit":"8527b55","source_verified":true,"device_verified":false,"service_verified":false,"requires_device":false,"requires_service":false,"verified_on":"2026-10-19","resolution_evidence":"[[sessions/2026-10-19-Character-Search-Response]]","next_action":"Validate matching device and live provider behavior separately; no native build or service change authorized"}
---
# LF-079: Invalid Search Responses Poison Retry

Missing data/Page/characters was silently cached as an empty result. Non-array
lists, null characters/names or malformed media nodes were cached before mapping
threw, making same-query retries reuse that invalid response indefinitely. An
empty errors array incorrectly rejected an otherwise valid result.

[Character system](../../modules/lorefy-character-system.js) now validates the
page/list and character/name/media-record shapes before caching or mapping. It
keeps valid empty arrays cacheable and rejects nonempty provider errors, while
an empty error array no longer discards verified data. It does not invent casts,
erase favorites or rewrite persistent user state.

This is structural validation of this response path, not full bibliographic,
image-rights, content-completeness or all-provider schema certification.

[[sessions/2026-10-19-Character-Search-Response]] |
[[12-Device-Repairs]] | [[15-Work-Control]]
