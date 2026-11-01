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

C-005 follow-up: established followed-reader IDs filter unrelated/own review
events before requesting friend metadata. Unknown-author/delete payloads still
refresh conservatively. One red regression, focused17/17 and updated mounted
Rails68/68 AR/EN x320/390 pass. Cachev661/six mirrors; no shared-account cache,
production access change or service-latency claim.
Final full3199/3199, exit0 (68435ms). Each of the five repairs is a separate push.

C-006 continuation: loaded post window refresh follows keyset cursors through its
old boundary, revalidates deleted/edited rows, preserves previous full data on
later-page failure and anchors the visible surviving card. Ten added tests;
full3209/3209 (63845ms, exit0), browser68/68 AR/EN x320/390,180 rows with native
scroll anchoring disabled. Cachev662/six mirrors. No native/network benchmark.
Next is targeted post invalidation to avoid full-window work for single reactions.

C-007: known post/reply/reaction events collect up to three targeted reads using
the existing postId API, skip unrelated/offscreen reactions and keep full-window
fallback for new roots/large/unknown/follow changes. Full refresh waiting on a
target still revalidates its complete window under the same owner. Seven tests
(five red), focused32/32, full3216/3216 (63280ms, exit0), browser100/100 AR/EN
x320/390 including181 rows,20 reactions -> one post read/zero follows, unchanged
anchor and single-row withdrawal. Cachev663/six mirrors. Not one database-query
or production-latency certification; the existing metadata hydration remains.

C-008: older full/targeted post reads cannot overwrite a local reaction changed
after they started. Request-scoped reference comparison preserves the newer
choice while subsequent reads and rolled-back choices accept server totals.
Three added regressions; focused47/47, full3219/3219 (63893ms, exit0), final
browser120/120 AR/EN x320/390 including gated read/RPC Like12->13, stale result
protection and next total19. No live mutation/device timing. Cachev664/six mirrors.
This continuation contains20 new source tests and three separately pushed repairs.

See docs/COMMUNITY_TIMELINE_2026-11-01.md for evidence and remaining scope:
completed source fixes and open native/service/long-pagination acceptance.
No generic dead-code purge or design replacement is part of this repair.

[[systems/Community-Notifications]] | [[13-Project-Story]] |
[[14-Feature-Coverage]] | [[15-Work-Control]]
