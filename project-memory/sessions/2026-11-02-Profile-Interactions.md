---
kind: repair-session
status: source-and-demo-browser-verified
date: 2026-11-02
---
# Profile interaction audit

## P-001: follow and connection request lifetime

Nine new regressions failed before the source repair in
`modules/lorefy-public-profile.js`:
- Same-turn follow taps sent twice and could increment the count twice.
- A refused/missing confirmation could still be presented as success.
- Old follow success could affect a reader revisited after navigation.
- Viewer replacement/unmount did not invalidate pending follow receipts/events.
- Closing/reopening the same connections dialog admitted its earlier response.
- A prior followers failure could mark the following dialog failed.
- Repeated connections opens while loading started duplicate requests.
- A refresh begun before a confirmed follow could roll back that follow.

A component-lifetime ref now scopes requests to visited reader, viewer, backend
and retry generation. Follow has an immediate in-flight gate, explicit busy
feedback and boolean receipt confirmation. Functional state updaters also check
the scope, and count deltas compare current relation state. Refreshes crossing a
follow mutation are ignored. Each connection-list opening has an identity token;
close/replacement invalidates it, and failures can retry. Initial profile/review
hydration and refresh also reject obsolete viewer/backend receipts.

No optimistic fake success, new follower storage, schema, cloud mutation or new
dependency. Backend ownership checks remain. Static React test stubs gained the
new useRef hook without weakening their assertions.

Verification:71 focused tests;3276/3276 full tests, exit0,70874ms. Cachev675,
six selective web mirrors. Real React/demo integration16/16 AR/EN checks covers
single dispatch, busy feedback, confirmed toggle/count, close/reopen, obsolete
success/failure and independent Following results. Held callbacks are isolated
local fixtures, not live account writes or two-account service acceptance.

Owner profile smoke:120/120 checks across all3 layouts at320/390px, AR/EN,
native tab/connection controls, representative restored/atelier/elven frames
(24 decorated/plain combinations). Moving canvas pixels, bounds and retained
artwork were checked, not just animation counters. Source images remain intact.
This is not a visual certification of every pack, native FPS or long-session QA.

Receipts outside Git: `artifacts/profile-actions-20261102-full.log`,
`output/playwright/profile-follow-ui-v675-results.txt`,
`output/playwright/profile-acceptance-v675-results.txt` and corresponding PNGs.

## Open Audit Items

An empty Reader favorites prompt appears constrained to a single cover column;
reproduce/fix separately. Native media chooser/keyboard, real-account durability,
all-pack visual coverage and long-session frame time remain independent gates.
Do not report every profile interaction or device fully certified by this pass.
No native build or production service deployment is authorized.

[[systems/Profiles-Lists]] | [[systems/Accounts-Sync]]
[[systems/Appearance-Bundles]] | [[13-Project-Story]]
[[14-Feature-Coverage]] | [[15-Work-Control]]
