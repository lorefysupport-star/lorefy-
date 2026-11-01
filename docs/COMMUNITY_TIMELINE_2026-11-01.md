# Community Timeline Repair - 2026-11-01

Scope: source/browser repair of timeline freshness, request amplification,
friend-rating loading and reaction consistency. No build, production writes,
database deployment or claim of zero device/network latency.

## C-001: Realtime Request Routing And Catch-Up

The React review effect subscribed its full refresh directly to all six change
tables. Post reactions therefore fetched review collections and the follower/
following graph. A change received while that refresh was running merely joined
the old job, so its newer data could remain absent. Five red regressions
reproduced cross-domain calls, lost catch-up and dispatch before cleanup.

Route review/comment/reaction changes to review scopes, follow changes to graph,
and leave post changes to the post owner. A fixed180ms window coalesces bursts;
one dirty table set catches changes arriving during a running request. Manual
refresh still awaits its existing full lifecycle/deadline. Cleanup cancels queued
dispatch. No new subscriptions, polling, data keys, permissions or dependencies.

Focused16/16 and full3180/3180 pass (65269ms, exit0). Browser18/18 AR/EN: the
extracted actual effect with a controlled backend receives20 reactions -> one
feed/one owner read/zero graph reads;20 post reactions -> zero review/graph reads.
In-flight changes trigger one catch-up. Actual demo review cards remain mounted
and a600ms observation has no idle child-list mutations or page errors. This is
request-contract plus local UI evidence, not production service latency.
The first full run exposed two over-broad test asset-version replacements;
unrelated asset expectations were restored before the passing full rerun.

Outside-Git evidence: artifacts/community-routing-20261101-full.log and
output/playwright/community-routing.js/results.txt.

## C-002: Friend Ratings Share One Bounded Refresh

Five initial regression failures reproduced duplicate initial/pull requests,
row clearing on background refresh, refetching after unrelated review props,
unbounded loading and no direct new-rating subscription. Rails now shares one
14s-bounded job across initial/manual/pull loads. Existing same-scope data stays
visible during refresh/failure with Retry; no stale rows survive an owner,
backend or following-scope replacement. Relevant review/follow events coalesce
and queue one catch-up; reaction noise does not refetch metadata. No polling or
new channel: subscribeCommunity shares the backend's existing connection.

Focused16/16 and full3186/3186 pass (75656ms, exit0). Browser64/64 AR/EN
x320/390 mounts the real React Rails with
controlled data: one initial/pull request, stable card nodes during reload and
failure, Retry, deadline/late result, unrelated props/reactions ignored, one
new-rating load, owner-switch hiding and cleanup. Not production latency or
catalog/provider coverage. Existing media tests use standard useRef stubs now;
their missing hook, not an application failure, was found by the first full run.
Cachev658-friend-refresh; six affected mirrors match.

## C-003: Post Refresh Routing And Early Display

Four red regressions reproduced review-triggered post fetching, lost in-flight
invalidation, offscreen/stale-owner dispatch and sequential follow lookup. Post
changes now coalesce in a fixed180ms window, await a running job with one trailing
catch-up and ignore unrelated review events. Offscreen invalidations mark stale
without fetching. Queued callbacks keep their opening page/backend/owner. Online
and visible-again events schedule catch-up rather than blind polling.

Post and follow reads start together; ready posts render while following is
pending. Friends filtering still uses known followed IDs, and first loading does
not falsely announce an empty feed. Focused29/29, full3190/3190 (70667ms, exit0).
Browser20/20 AR/EN mounts the actual module against controlled backend gates:
early posts, independent reads, typed events, one trailing request, retained card
node/scroll140, updated reaction counter and offscreen suppression. No page errors
in the corrected harness (initial fixture used unbound native timer functions).
Cachev659/six mirrors match; no production mutations. Existing older-page reset
semantics and physical long-scroll performance are not certified by this test.

## C-004: Consistent Review Reactions And Bounded Post Writes

Five initial review regressions reproduced independent opposite/duplicate-card
requests, no failed-write rollback, cleanup after a failed first write, stale-owner
toasts and stale cached counters overriding fresh server0. A post regression
also reproduced a permanently busy pair on a hanging request.

Review reactions now share a scope/key lock, keep immediate feedback, restore
only unchanged optimistic values for that review on failure and preserve other
review/cache updates. Old backend/client/owner/epoch results cannot touch a new
context. Failed writes no longer promise an unimplemented offline sync queue.
Both review/post writes have a14s per-request UI deadline, releasing retry and
ignoring late paint. A timeout does not cancel an already-dispatched server write.

The actual React review renderer publishes explicit server counts/selection in
data-review-reactions. The growth adapter consumes each new snapshot once,
including zero, rather than keeping a stale counter forever. Pending optimistic
choices are not immediately repainted from an old snapshot. Source storage keys,
server RPC parameters, permissions and schemas are unchanged. Opposite review
cleanup still uses two existing RPCs when necessary, not a new atomic operation.

Eight added regressions plus the renderer contract, full3198/3198 (68785ms,
exit0). Browser60/60 AR/EN x320/390 uses actual reaction functions/cloned real
cards with controlled cloud gates: duplicate-card lock, opposite counts, rollback,
new server counters/zero, timeout/retry and replaced-account suppression. The
final actual demo smoke passes32/32: native click like->dislike->off, ten cards
retained, scroll180 unchanged, zero child-list mutations over1.5s idle and no
horizontal overflow in all four language/width cases. No page errors. That smoke
found a local-only opposite-cleanup regression; it was reproduced and repaired
before the final full/source/browser rerun. AR capture visually inspected; blocked
external artwork is shown as Retry/unavailable, not evidence of provider failure.

Cachev660-community-reactions, ten affected runtime mirrors match. Evidence:
artifacts/community-reactions-20261101-full.log;
output/playwright/community-reactions.js/results.txt and
community-final-smoke.js/results.txt with AR/EN captures. Across this pass,
194 browser contract/acceptance checks pass; no production benchmark is claimed.

## C-005: Ignore Known Non-Friend Rating Events

The shared channel also contains other public readers' review changes. After a
successful friend read establishes the actual followed IDs, known stranger/own
review events now skip friend metadata reloads. Follow changes, followed-reader
changes and incomplete/authorless DELETE payloads still catch up conservatively.
The followed set is effect-local and replaced with the owner/backend/following
scope; this is not a cross-user cache or a permissions substitute.

One red regression reproduced the unwanted read. Focused17/17 and full3199/3199
pass (68435ms, exit0). The updated
real React Rails browser run passes68/68 AR/EN x320/390:20 stranger+20 owner
review events cause zero reads,20 friend changes cause one, and all previously
tested loading/retry/timeout/owner behavior remains. Cachev661/six mirrors match.
Receipts: artifacts/community-friend-events-20261101-full.log and
output/playwright/community-friend-events-results.txt. No live-service benchmark.

## C-006: Preserve And Revalidate A Loaded Post Window

Refreshing replaced all loaded pages with the newest60. Four initial failures
reproduced missing old rows, missed edits/deletions, unhandled later-page failure
and same-time cursor loss. Refresh now follows the existing keyset cursor through
the previous oldest timestamp+id, including new head rows. It trims the final
page to that boundary rather than retaining stale inaccessible rows. If that
entire range disappears, the latest remaining older page is still available.
The existing14s lifecycle and owner guards bound late work; repeating cursors
fail without replacing the previous complete window. Full-page end is unknown
until the next short/empty result, not guessed from visible row count.

Before changing post DOM, capture at most two visible card positions and restore
the first surviving card's offset afterward. New data does not force readers
away from their current card; at top, new posts remain visible. No React nodes
are moved outside their existing owner. Only changed post-feed renders measure
geometry, not unchanged observer maintenance.

Ten added tests, including red anchor/deleted-window regressions; focused25/25
(pagination10 + existing loader/refresh15), full3209/3209, exit0 (63845ms).
Browser68/68 AR/EN x320/390 uses the actual module with controlled paged reads,
native scroll anchoring explicitly disabled:60->120 loaded rows; new head plus
withdrawal retains121 through the old boundary; old edit applies; same anchor
node/offset; deletion above stays anchored; older loading reaches180/end; at-top
refresh stays at0. No page errors. This is a180-row fixture, not native FPS or
production permission/latency certification. No schema/API/security change.
Cachev662-post-window/six mirrors match. Follow-up: target known changed posts
so ordinary reactions do not re-read the complete loaded range.

Receipts: artifacts/community-post-window-20261101-full.log and
output/playwright/community-post-window.js/results.txt.

## C-007: Targeted Post Invalidation

Small known-post changes now use the existing postId/limit1 read rather than
refetching every loaded page and follows. Coalesce up to three known IDs;
larger batches, new roots, unknown payloads and follow changes use the complete
window path. Known replies revalidate their visible parent; offscreen reaction
noise does not reload the timeline. Targets are restricted to already loaded
posts, results must match the requested ID and unavailable rows are removed.

The dirty queue retains its page/backend/owner and target set through a running
job. A manual/full refresh joining a targeted read waits, then still performs its
full revalidation; it cannot silently treat the narrow result as a full refresh,
or dispatch a queued old-owner read into a replacement account.

Seven new tests, five initial failures; focused32/32 and full3216/3216, exit0
(63280ms). Browser100/100 AR/EN x320/390 reruns the prior paged/anchor flow and
adds a181-row window:20 reactions -> one postId read, zero follows, updated12
count, same card/offset; targeted withdrawal removes one row and preserves the
anchor; offscreen reaction -> zero reads. Each post read still hydrates its
existing metadata; this is not a claim of one underlying database query or a
production latency benchmark. No API/schema/security change or live writes.
Cachev663-post-targets/six mirrors match.
Receipts: artifacts/community-post-targets-20261101-full.log and
output/playwright/community-post-targets-results.txt.

## C-008: An Older Post Read Cannot Undo A New Local Reaction

A background read started before Like could finish after the click, replace its
optimistic state and repaint it off. The request now records each loaded post's
reaction reference at start. If a local reaction replaced that reference before
the response is normalized, preserve that newer reaction for this older read.
Both full-window and targeted paths use the same normalization. A subsequent
read started after the action still accepts fresh server totals; a rollback to
the original reference also allows the server result. No timer-based freshness
guess, persistent overlay, payload mutation or added request is needed.

Three added regressions (the old-read case initially red for full/targeted data),
focused47/47 and full3219/3219, exit0 (63893ms). Final browser120/120 AR/EN
x320/390 reruns C-006/C-007 and gates a real module read/RPC around a native
Like click: counter12->13 immediately, stale read cannot undo it, RPC completion
keeps it selected, next server total19 applies. No page errors. Controlled data
and RPCs only, not production writes or real network/device timing. This protects
the standalone post owner; review interactions have their separate C-004 contract.
Cachev664-post-reaction-order/six affected mirrors match.

Receipts: artifacts/community-post-reaction-order-20261101-full.log and
output/playwright/community-post-reaction-order-results.txt. This continuation
adds20 source tests across three separate repairs; native build remains unchanged.

## Remaining Acceptance

- Friend lifecycle is repaired locally; real two-reader delivery and provider
  artwork timing remain external acceptance checks.
- Loaded post windows/anchoring have180-row local acceptance; native smoothness,
  much larger timelines and reconnect under real networks remain independent.
- Review interactions are repaired locally; cross-device counts, two-RPC partial
  server outcomes and actual quota/network recovery require service acceptance.
- Native smoothness, production query timing and two-reader arrival remain
  independent gates, not established by controlled fixtures.
