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

## Remaining In This Pass

- Friend lifecycle is repaired locally; real two-reader delivery and provider
  artwork timing remain external acceptance checks.
- Post invalidation lifecycle is repaired locally; longer pagination/scroll and
  reconnect under real network conditions remain acceptance work.
- Review like/dislike writes have independent locks and misleading local-sync
  success copy; audit their failure and concurrent semantics.
- Native smoothness, production query timing and two-reader arrival remain
  independent gates, not established by controlled fixtures.
