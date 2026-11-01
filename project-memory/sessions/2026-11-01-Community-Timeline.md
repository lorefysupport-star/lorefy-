---
kind: session
status: source-browser-verified-service-device-pending
date: 2026-11-01
source_commit: b90489f
---
# Community timeline, freshness and interaction pass

Owner priority: community only, reduce stalls/repeated fetching, make new friend
ratings/reviews timely and reactions consistent. Push each verified repair;
do not build, upload to Apple or mutate production data.

C-001: uploads/files/lorefy-app.js review effect no longer full-refreshes on
every table's event. Fixed180ms event coalescing, typed review/graph routing and
one non-overlapping dirty catch-up preserve changes received during a job.
Five initial failures; focused16/16, full3180/3180 (65269ms, exit0) and browser
18/18 AR/EN pass. Browser uses the actual extracted effect with controlled backend
plus actual demo UI idle/card retention checks; not live or device certification.
Cachev657-community-routing and six affected mirrors byte-identical.

C-002: modules/lorefy-friend-activity.js now shares one bounded load, preserves
same-scope rows through background refresh/failure and directly consumes relevant
shared realtime events with one catch-up. Removed unrelated review-prop network
dependency. Six new regressions (five initially red), focused16/16 and mounted
React browser64/64 AR/EN x320/390 pass; provider/device delivery not certified.
Cachev658-friend-refresh and six affected mirrors synchronized.
Full3186/3186, exit0 (75656ms); source and controlled browser evidence only.

C-003: modules/lorefy-community.js routes post invalidations, queues one catch-up,
suppresses offscreen/old-owner dispatch, starts follows/posts together and renders
ready posts before follows. Four red regressions; focused29/29, full3190/3190
(70667ms, exit0), browser20/20 AR/EN including retained card/scroll140. Long
pagination and real reconnect/device latency stay open. Cachev659/six mirrors.

C-004: shared review reaction lock across both controls/copies, conditional
per-review rollback, owner/client/epoch guards, honest retry feedback, fresh
server counter/selection projection (including0) and bounded review/post writes.
Eight added regressions and renderer contract. Full3198/3198, exit0 (68785ms).
Browser60/60 controlled reaction checks plus32/32 actual demo click/scroll/idle
checks, AR/EN x320/390. A demo-only opposite cleanup regression was caught by
the final smoke, reproduced and fixed before final reruns. AR capture inspected.
Cachev660 and ten affected runtime mirrors match. No provider/device benchmark,
production mutation or build. Timeout does not cancel a server write; opposite
review cleanup remains two RPCs. Total194 browser checks in this scoped pass.

See docs/COMMUNITY_TIMELINE_2026-11-01.md for evidence and remaining scope:
completed source fixes and open native/service/long-pagination acceptance.
No generic dead-code purge or design replacement is part of this repair.

[[systems/Community-Notifications]] | [[13-Project-Story]] |
[[14-Feature-Coverage]] | [[15-Work-Control]]
