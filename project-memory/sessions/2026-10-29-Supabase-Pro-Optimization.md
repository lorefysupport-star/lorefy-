---
kind: session
status: service-verified-followups-open
date: 2026-10-29
verified_on: 2026-10-29
source_commit: 3894356a1232cd49021307b86660e0e59a9dac9e
---
# Supabase Pro availability and targeted optimization

Owner requested server restoration and optimization after subscribing to Pro,
then connected the owning account. The project reports ACTIVE_HEALTHY and the
organization reports Pro. Earlier function billing denials were followed by
successful catalog responses; no restart was needed.

[Report and limits](../../docs/SUPABASE_PRO_OPTIMIZATION_2026-10-29.md) records
exact source/test references, live measurements and migration version
`20261029194223`. The migration adds five indexes and caches the identity lookup
in two chapter-review policies while preserving access rules. It does not replay
historical migrations or change user records, grants, billing tier or credentials.

The matching live feed query changed from sequential scan/sort at 80.915 ms to
an index scan at 23.905 ms. One read-only comparison verifies the same ordered
results; this is not device or app-wide performance certification. Twenty-three
isolated PGlite assertions and 63 focused source checks passed with exit 0.
Both targeted advisor categories are cleared; security notices are unchanged.

Jikan remains unavailable in the probes. Apple authorization's HTTP 503 path
indicates missing required server configuration, without identifying a missing
secret. Google Books logged rate limiting. These are open follow-ups, not repaired
by the database indexes. No hardware sign-in or restore/backups certification.

This service request supersedes the earlier source-only restriction only for
these targeted server optimizations. The existing local October 21 security session still governs
the unrelated deferred security patch: it was not deployed or included in this
change. No build, native synchronization or Apple release action.

[[systems/Accounts-Sync]] | [[13-Project-Story]] |
[[14-Feature-Coverage]] | [[10-Open-Questions]]

Later same-day resolution: [[sessions/2026-10-29-Jikan-Retirement]] supersedes
the initial temporary-connectivity inference above; the public endpoint was
retired and its replacement is verified. [[sessions/2026-10-29-Search-Performance]]
repairs client latency separately. The existing optimization source is integrated
with latest main for the authorized direct GitHub handoff; no migration replay or
additional production operation occurs. Apple configuration/device limits remain.
