---
{"kind":"bug","id":"LF-076","status":"closed","priority":"P1","area":"characters","date":"2026-10-19","reviewed_on":"2026-10-19","source_commit":"8d55aef","source_verified":true,"device_verified":false,"service_verified":false,"requires_device":false,"requires_service":false,"verified_on":"2026-10-19","resolution_evidence":"[[sessions/2026-10-19-Character-Search-Identity]]","next_action":"Validate a future matching device release and provider catalog separately; no native build authorized"}
---
# LF-076: Character Search Work Identity

Four new failing regressions reproduced a name-search gap: ordinary books were
eligible for remote manga characters and contaminated cached matches, a title
could override a contradictory MAL identity, and duplicate titles selected the
last catalog row arbitrarily. This is an independently reproduced path matching
the Discord wrong-cast concern, not proof of the exact historical user record.

[Character system](../../modules/lorefy-character-system.js) now excludes ordinary
books from cached/remote name results, indexes identities and titles uniquely,
rejects conflicting provider identities and only falls back to an unambiguous
title for a work with no provider IDs. Favorites and ratings are not rewritten;
old user selections are not silently deleted. No remote catalog was changed.

Evidence: [[sessions/2026-10-19-Character-Search-Identity]].

[[systems/Explore-Works]] | [[12-Device-Repairs]] | [[15-Work-Control]]
