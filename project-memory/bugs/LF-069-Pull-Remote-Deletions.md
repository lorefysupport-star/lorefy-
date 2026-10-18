---
{"kind":"bug","id":"LF-069","status":"closed","priority":"P0","area":"accounts-sync","date":"2026-10-19","reviewed_on":"2026-10-19","source_commit":"fe714ac","source_verified":true,"device_verified":false,"service_verified":false,"requires_device":false,"requires_service":false,"verified_on":"2026-10-19","resolution_evidence":"[[sessions/2026-10-19-Pull-Remote-Deletions]]","next_action":"Verify cross-device reopen on a future authorized matching release; no build requested"}
---
# LF-069: Pull can resurrect a remote deletion beside an offline edit

In [Backend](../../backend/lorefy-backend.js), the preserve-local branch only
walked keys present in the remote snapshot and ignored nulls. An acknowledged,
unchanged local field therefore survived its remote deletion whenever an
unrelated field had a pending edit. The next push could recreate that field.

Pull now reconciles the union of base, local and remote keys. Only account-owned
fields without a pending local edit adopt remote removal, and only with a known
acknowledged base. First-sync local-only fields, edits arriving during the read,
offline journals and next-account data remain protected. No schema or service
change and no merging of conflicting JSON fields.

Seven full-Backend VM regressions include pull followed by push to a simulated
versioned server. Three failed before the repair; all seven pass afterward.
Related sync tests and verification limits are in the session receipt.

[[sessions/2026-10-19-Pull-Remote-Deletions]] | [[systems/Accounts-Sync]] |
[[14-Feature-Coverage]] | [[15-Work-Control]] | [[12-Device-Repairs]]
