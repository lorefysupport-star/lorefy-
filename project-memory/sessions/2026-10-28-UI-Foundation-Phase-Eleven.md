---
kind: session
status: source-browser-verified-device-pending
date: 2026-10-28
---
# Community post labels and counters

Continuation of [[sessions/2026-10-28-UI-Foundation-Phase-Ten]]. Existing UI/UX
Pro Max, Apple, debugging and test-first guidance used. Plugin Management chose
available tools; no plugin installation or dependency was needed. Local only.

## Reproduced

An English first-render post still exposed Arabic Post/type, Reply, Like,
Dislike and Share labels. Accessible action names omitted their counts. Large
counts were unformatted; author names lacked explicit direction, while small
metadata had inconsistent10/11px styling. Thread loading/empty/retry controls
also depended on later translation rather than first-render app language.

## Source changes

- `modules/lorefy-community.js`: a shared display-only `communityCount` formats
  Latin-digit counts consistently, uses compact visible notation at1000+, and
  keeps exact grouped counts in accessible labels/tooltips. Arabic plural rules
  cover0/1/2/few/many/other; invalid/negative display inputs normalize to zero.
  Stored values and reaction algorithms are not normalized or migrated.
- `updatePostCounter` is called at initial rendering, successful reaction/peer
  updates, reused feed-card updates and thread reply-count updates. Writes are
  guarded by equality. Existing event handlers, mutual exclusion, realtime
  acknowledgment behavior and one-in-flight request behavior remain intact.
- Post type/action and thread heading/Close/loading/empty/Retry/older/input/Send
  labels use direct AR/EN selection. This is not a rewrite of composer, review
  reactions, notification delivery, sharing payloads or every community string.
- Author names retain literal full text/tooltip with automatic direction;
  username/time metadata remains isolated LTR. Existing protected body/name
  translation boundaries are preserved. Source prose is not translated.
- `styles/lorefy-community.css`: isolated name/number direction,12px metadata
  and tabular numeric glyphs. Existing glass/palette/artwork and44px controls
  are retained; no new floating surface or icon set was introduced.
- `index.html`/`sw.js`: only community JS/CSS asset keys changed to
  `20261028-community-copy-v1`; cache is `lorefy-v622-community-copy`. Four web
  assets selectively mirrored byte-for-byte to both existing runtime copies.
  No native prepare, sync or build occurred.

## Verification

-12 new source tests;10 initial failures and a separately observed failing
  cache/version gate preceded the respective fixes. Added runtime coverage
  protects exclusive toggles and persisted counts. Existing source-contract
  tests now assert direct labels; extracted-function fixtures provide the real
  formatter dependency. A realtime-before-RPC test initially failed because its
  fixture omitted that dependency; repaired without changing the algorithm.
- Full suite2845 passed,0 failed. External log retained.
-56 browser cases,0 uncaught page errors:48 presentation/empty/retry/reaction/
  storage cases plus8 real demo-feed lifecycle checks. AR/EN,320/390 widths,
  pink/dark/light/custom green, counts0/1/2/3/10/11/100/12345 and compact replies.
- Actual cached feed card stays the same DOM node after source count updates,
  unchanged refreshes and reactions. Two fixture replies display their correct
  source count and reply-to-reply actions. Failed fixture loading recovers via
  the visible Retry control; no real reply was sent.
- Initial matrix sampled entering-page geometry too early and treated an author
  button with a text-derived accessible name as unnamed. The corrected fixture
  waits for a stable Home surface and checks icon action labels separately.
  Initial failed JSON retained. No production CSS was changed to mask it.
- Library/progress/favorites snapshots remain unchanged. Demo posts/reactions
  were changed only in isolated browser contexts, all closed afterward.
- Screenshots inspected: dark thread, pink counter fixture and the actual
  English demo feed. Fixture screenshots are not a full real-account UI audit.
- Evidence: external `artifacts/ui-execution-phase11-20261028/` includes scripts,
  browser JSON, screenshots, full-tests.log and final verification.json.

## Remaining

Review reaction counters, other counters/community copy, already-open language
switching across every dialog, long author names on work pages, and other F06
surfaces remain separate. This pass does not certify VoiceOver, native Dynamic
Type, physical iPhone, live service persistence or notification delivery. The
27-unit plan is not complete. No GitHub, production change or native build.

[[13-Project-Story]] | [[14-Feature-Coverage]] | [[systems/Community-Notifications]] |
[[systems/Language-Media]]
