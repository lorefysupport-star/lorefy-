---
kind: session
status: source-browser-verified-service-device-pending
date: 2026-11-01
source_commit: 83bae32
---
# Diary milestones preserve the actual reading unit

L-005 in docs/LOGIC_AUDIT_2026-11-01.md: chapter-only transitions silently
ignored pages/volumes and lost those positions on starts/completions. Six new
test failures reproduced missing events/anchors and merge collisions. The
core now compares like units, emits one event per update, preserves original
chapter event shape and adds existing page/volume anchors. Local merge identity
uses unit+position; legacy chapter equivalence still deduplicates. Backend state
sync transports the diary as a stored value, not a chapter-only event projection.

Sources: modules/lorefy-reading-diary-core.js::transitions/merge and existing
modules/lorefy-reading-diary.js::sync/positionLabel/sendShare consumers.
Tests: reading-diary-units.test.js and reading-diary-sync-performance.test.js.
Seven added tests, focused27/27 and full3172/3172, exit0 (63014ms).
60/60 browser checks, AR/EN x320/390, actual sync/render/share action flow;
native-share API is controlled, not proof of real OS sharing. Four events stay
four after repeat sync, with correct labels and no false chapter count.
No overflow/page errors. AR screenshot visually inspected. Test art requests
are blocked; blank thumbnails in the capture are not provider evidence.

Cachev655-diary-units and six affected runtime mirrors synchronized. No native
build, migration, production-data write or service deployment. Library values,
explicit statuses, completion credit and read-time calculations are unchanged.
Outside-Git receipts: artifacts/logic-diary-units-20261101-full.log and
output/playwright/logic-diary-units.js/results.txt, AR/EN captures.
Next audit is failure/retry behavior of diary storage, not repeating this unit fix.

[[systems/Reading-Library]] | [[13-Project-Story]] |
[[14-Feature-Coverage]] | [[15-Work-Control]]
