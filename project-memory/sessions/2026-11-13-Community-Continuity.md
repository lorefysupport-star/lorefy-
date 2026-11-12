---
kind: session
status: source-browser-verified-service-device-pending
date: 2026-11-13
---
# Community return, targeted reads and deliberate updates

Owner reported repeated refresh, lag and reload-from-zero after opening reviews.
The public Lootd community/reference review was inspected, without assuming its
private architecture or claiming its anonymous Back navigation was instant.

Unlike C-001/C-008 in [[sessions/2026-11-01-Community-Timeline]], this pass repairs
page-remount retention and review-level targeting, not the already-fixed targeted
standalone post invalidations. Posts/card nodes and pagination now survive same
session return; friends have a single scoped60-second in-memory snapshot.
Known review reactions/comments update at most three exact IDs instead of the
whole loaded collection. Remote new inserts expose an explicit update control;
manual and pull refresh, own publishing and withdrawal remain distinct.

New failing regressions covered warm/stale return, session/following isolation,
targeted review bursts/withdrawal, concurrent graph/manual requests, late account
results and deliberate remote inserts. Browser fixture: five warm returns retain
eight exact nodes/one read;20 reactions -> one target; new remote root waits for
explicit refresh. Actual demo: three review returns retain scrollTop960.
Follow-up regressions protect the update button's post dispatch and preserve
newer post/review insert notices across older in-flight refresh responses.
Final full3533 tests pass with zero failures/skips, exit0; all six changed web
assets match both mirrors. These are source/local browser checks, not device FPS.

[Detailed acceptance and limits](../../docs/COMMUNITY_CONTINUITY_2026-11-13.md).
Cachev712; six repaired web assets mirrored, no build or production writes.
Physical iPhone, service latency and large-window profiling remain separate.

[[systems/Community-Notifications]] | [[13-Project-Story]] | [[14-Feature-Coverage]]
