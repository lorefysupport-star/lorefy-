# Community continuity and deliberate refresh

## Reference and scope

Inspected https://www.lootd.app/community and a public review on 2026-11-13.
Observed: Popular/Latest/Following/Friends controls, 24/72-hour ranges, explicit
Refresh and Load more, and a separate review/comments route. Anonymous Back also
showed a session-check state; this is not evidence of a private cache algorithm
or a benchmark of its backend. Lorefy adopts deliberate updates and bounded
reads using its existing architecture, not an asserted copy of private internals.

Preserve Lorefy's artwork, glass palettes, reading contracts, zero ratings,
privacy checks and existing post/review editors. No production writes or build.

## Reproduced causes

- `lorefy-community.js:enhance` discarded posts, pagination and followed IDs when
  React remounted the page after a review/work visit. It also discarded card cache
  nodes owned by the imperative post renderer.
- Friend activity's mounted component fetched from scratch after returning,
  despite having just loaded the same account/following scope.
- Review reaction/comment events refreshed whole review collections, including
  owner/work/visitor snapshots, instead of the known affected review.
- New remote roots could refresh and reorder the reading timeline immediately.

## Repairs

- Retain the same session's post window, pagination and detached post-feed/card
  nodes. Restore them before reading again. After60 seconds, revalidate behind
  existing content; a changed account/client/epoch/storage scope clears it.
- One bounded in-memory friend snapshot follows backend/client/epoch/owner and
  following scope. Fresh remounts reuse it; stale remounts keep rows during one
  background request. No new persistence key or cross-account cache.
- Coalesce known review events for up to three targeted reads with the existing
  exact-review API. Patch/remove that review in all loaded snapshots. Ignore
  offscreen reaction noise; incomplete/large changes retain the safe full-read
  fallback. Manual refresh waits for a pending target and still reloads normally.
- New remote post/review inserts announce availability with a themed44px update
  button rather than replacing the timeline. Clicking it refreshes posts/reviews
  and friends through their shared loaders. Pull-to-refresh remains unchanged.
  Own publishing and known-row edits/deletions/reactions keep their normal paths.
  Insert generations keep a newer availability notice when an older in-flight
  refresh completes; the next explicit refresh can acknowledge that generation.

## Evidence

- New regressions were observed failing before the corresponding source fixes.
- Focused community/friend/scroll/pull suite:224 passed before final follow-ups.
- Intermediate full source/button/mirror suite:3530 passed, zero failed; later
  acceptance adds button-dispatch and two insert-during-refresh race regressions.
- Final full `npm test`:3533 passed, zero failures/skips, exit0 (101458.5116ms).
- Actual production community module with an isolated local transport fixture:
  five leave/return cycles kept eight exact card nodes and the original single
  read;20 reaction events caused one targeted post read; a new remote root kept
  eight cards/no new read until explicit refresh, which produced nine cards.
- Actual demo app: three review-open/back cycles restored scrollTop960 exactly.
  CSS390 demo and CSS320 transport fixture had no horizontal document overflow.
- Fixture is `qa/community-continuity.html`; it never contacts production. Local
  screenshots/JSON receipt are outside Git in the parent workspace's
  `artifacts/community-continuity-20261113` directory.

## Remaining limits

Browser fixtures and request counts are not physical iPhone FPS, production
Supabase latency or a guarantee of zero lag. Review React nodes still remount on
route return; post nodes and friend data are retained. No native build, TestFlight
upload, service deployment, live reaction or actual post/review publication.
Existing server hydration and large manual pagination remain separate profiling
targets. Cache freshness is bounded, not an offline database or durable cache.
