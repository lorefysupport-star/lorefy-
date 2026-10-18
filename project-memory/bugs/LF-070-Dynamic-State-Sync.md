---
{"kind":"bug","id":"LF-070","status":"closed","priority":"P0","area":"accounts-sync","date":"2026-10-19","reviewed_on":"2026-10-19","source_commit":"8ea8e16","source_verified":true,"device_verified":false,"service_verified":false,"requires_device":false,"requires_service":false,"verified_on":"2026-10-19","resolution_evidence":"[[sessions/2026-10-19-Dynamic-State-Sync]]","next_action":"Check cross-device dynamic removals on a future authorized matching release; no build requested"}
---
# LF-070: Dynamic fields disappear from the sync key set after removal

[Backend](../../backend/lorefy-backend.js) enumerated only the fixed sync keys
and keys still present in Web Storage. Removed fields in supported dynamic
namespaces, such as character-board images, were absent from that set. Push
therefore reported success and cleared their journal without contacting the
server. New dynamic keys returned by a successful RPC were also not adopted.

Push now includes account-owned base/journal keys in its diff, then includes
account-owned keys from the acknowledged response during remote adoption.
Deduplication preserves the twenty-key patch contract; unrelated namespaces are
excluded. Ownership checks, pending writes, conflict handling and batch-by-batch
acknowledgement remain intact. This does not change local caching policy or
promise that every dynamically stored field should be retained indefinitely.

Six added cases in [state-sync-deletions](../../tests/state-sync-deletions.test.js),
four initially failing, verify removal, missed observer, remote addition and UI
event, offline retry, foreign namespace exclusion and 25 removals in 20/5 batches.

[[sessions/2026-10-19-Dynamic-State-Sync]] | [[systems/Accounts-Sync]] |
[[14-Feature-Coverage]] | [[15-Work-Control]] | [[12-Device-Repairs]]
