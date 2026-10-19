---
{"kind":"bug","id":"LF-081","status":"closed","priority":"P2","area":"characters","date":"2026-10-19","reviewed_on":"2026-10-19","source_commit":"b6d986f","source_verified":true,"device_verified":false,"service_verified":false,"requires_device":false,"requires_service":false,"verified_on":"2026-10-19","resolution_evidence":"[[sessions/2026-10-19-Character-Catalog-Taxonomy]]","next_action":"Physical behavior and provider completeness remain separate; no catalog records rewritten"}
---
# LF-081: Bundled Catalog Ignores English Work Types

The asset gate used Arabic-only labels, while sourceKeysForWork already supported
English Novel/Light Novel/Web Novel/Comic/Comics and recognized novel IDs. It
therefore loaded the visual catalog for text/comic records and unnecessarily
loaded a character catalog for excluded ordinary books.

The gate now reuses isNormalBook/isTextWork/isComicWork. Ordinary books skip the
bundle; novels/comics use their own source. Catalog IDs, content and user state
are unchanged. Ten new cases cover both languages and an identity-only novel.

[[sessions/2026-10-19-Character-Catalog-Taxonomy]] |
[[12-Device-Repairs]] | [[15-Work-Control]]
