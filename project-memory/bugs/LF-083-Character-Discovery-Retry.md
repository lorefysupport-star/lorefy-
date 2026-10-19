---
{"kind":"bug","id":"LF-083","status":"closed","priority":"P2","area":"characters","date":"2026-10-19","reviewed_on":"2026-10-19","source_commit":"db313d8","source_verified":true,"device_verified":false,"service_verified":false,"requires_device":false,"requires_service":false,"verified_on":"2026-10-19","resolution_evidence":"[[sessions/2026-10-19-Character-Discovery-Retry]]","next_action":"Real provider behavior and physical performance remain separate"}
---
# LF-083: Failed Fandom Discovery Remains Cached

discoverFandomCategorySource memoized rejected promises indefinitely. Network,
HTTP, JSON, unverified community and timeout failures therefore prevented a new
attempt for that work until reload, even after connectivity recovered. Missing
title metadata could poison the same ID after its title arrived.

The shared pending promise now evicts its own map slot on rejection and rethrows.
Concurrent discovery still coalesces; successful sources stay memoized. A later
category failure does not discard an already verified source. No new automatic
retry loop, domain-matching rule, provider rights decision or account state.

[[sessions/2026-10-19-Character-Discovery-Retry]] |
[[12-Device-Repairs]] | [[15-Work-Control]]
