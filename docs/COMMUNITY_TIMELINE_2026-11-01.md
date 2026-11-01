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

## Remaining In This Pass

- Friend rails clear their rows during refresh and can wait without a bound;
  page refresh and effect requests need one shared lifecycle.
- Post realtime invalidations need domain routing and in-flight catch-up.
- Review like/dislike writes have independent locks and misleading local-sync
  success copy; audit their failure and concurrent semantics.
- Native smoothness, production query timing and two-reader arrival remain
  independent gates, not established by controlled fixtures.
