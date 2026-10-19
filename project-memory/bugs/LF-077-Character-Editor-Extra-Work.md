---
{"kind":"bug","id":"LF-077","status":"closed","priority":"P2","area":"characters","date":"2026-10-19","reviewed_on":"2026-10-19","source_commit":"c457151","source_verified":true,"device_verified":false,"service_verified":false,"requires_device":false,"requires_service":false,"verified_on":"2026-10-19","resolution_evidence":"[[sessions/2026-10-19-Character-Editor-Extra-Work]]","next_action":"Physical typing latency and the original recording remain separate; no new native build authorized"}
---
# LF-077: Hidden Work Search and Redundant Render

The character picker scanned the entire work catalog when a character-name
request returned no results. It could then tell readers to select a work from
results that were hidden in character mode. Clearing input also left the queued
180ms render alive after rendering the cleared state synchronously.

Two failing regressions proved the extra scan and timer. The empty result now
uses already-rendered work rows only in the explicit work tab. Clear cancels
both timers and resets the stale failure flag. No cache, selection or score is
deleted. Three new cases retain work-tab discovery and owner/session protection.

[[sessions/2026-10-19-Character-Editor-Extra-Work]] |
[[12-Device-Repairs]] | [[15-Work-Control]]
