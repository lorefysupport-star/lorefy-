---
kind: session
status: source-browser-verified-service-device-pending
date: 2026-11-01
source_commit: 540268d
---
# Failed diary history writes must not acknowledge progress

L-006 in docs/LOGIC_AUDIT_2026-11-01.md. modules/lorefy-reading-diary.js::sync
ignored a false history write result and still advanced the persisted checkpoint
plus raw/fingerprint caches. Unchanged progress was then permanently skipped.
Return before acknowledging the checkpoint, and reset both shortcut caches on
that failure. The next sync retries; old notes and draft/owner guards remain.

Three added regressions in tests/reading-diary-sync-performance.test.js. Initial
two failures: checkpoint3 replaces1 despite missing history, and completion is
lost on module reload. Focused38/38, full3175/3175, exit0 (63167ms).
52/52 actual-app browser checks, AR/EN x chapter/page/volume. Each fixture
intercepts Storage.setItem to throw twice only for the diary history key, then
restores storage: old snapshot and note stay, recovery adds one correctly
anchored visible event, repeat sync adds none. No page errors. Source tests also
verify recovery from persisted storage in a new module instance. Adapter fault
injection is not a real quota/device/service outage test.

Cachev656-diary-retry and six affected runtime mirrors byte-identical. No native
build, schema change, new storage key, production mutation or service deployment.
Remaining: snapshot-only failure after successful history write and atomic
multi-key crash recovery are separate unverified contracts; no general storage
durability claim. Further progress during a failed write recovers the latest
checkpoint, not intermediate events that were never successfully persisted.
Outside-Git receipts: artifacts/logic-diary-retry-20261101-full.log;
output/playwright/logic-diary-retry.js/results.txt.

[[systems/Reading-Library]] | [[13-Project-Story]] |
[[14-Feature-Coverage]] | [[15-Work-Control]]
