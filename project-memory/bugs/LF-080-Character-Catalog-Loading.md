---
{"kind":"bug","id":"LF-080","status":"closed","priority":"P1","area":"characters","date":"2026-10-19","reviewed_on":"2026-10-19","source_commit":"25497ce","source_verified":true,"device_verified":false,"service_verified":false,"requires_device":false,"requires_service":false,"verified_on":"2026-10-19","resolution_evidence":"[[sessions/2026-10-19-Character-Catalog-Loading]]","next_action":"Physical network and device verification remain separate; no native build authorized"}
---
# LF-080: Bundled Character Catalog Never Settles

The bundled-script gate before loadCastReady lacked a deadline. A stalled script
blocked all provider fallbacks. Append errors retained a rejected attempt, and a
synchronous error could restore the failed promise slot after its cleanup.

The attempt is now published before insertion, bounded to ten seconds and settled
once. Failure removes the script and only its own promise slot; late callbacks
cannot settle or delete a later attempt. Success clears the timer and retains
memoization. Existing verified cast/provider fallback behavior remains intact.
No unavailable cast is saved as an empty verified result.

[[sessions/2026-10-19-Character-Catalog-Loading]] |
[[12-Device-Repairs]] | [[15-Work-Control]]
