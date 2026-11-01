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

## P-002: empty favorites prompt

The empty prompt was full-width in normal/immersive but constrained to one
64-80px cover column in Reader, clipping its AR/EN label. Reader's specific grid
overrode the generic empty grid. Shared CSS now makes existing empty work and
character actions span every grid track, uses border-box sizing and wraps their
existing labels. Filled covers, fonts, colors, callbacks, saved favorites,
rankings and frame artwork are unchanged.

Two source regressions demonstrated red before repair;21 related tests pass.
18/18 actual work-prompt cases cover three layouts, AR/EN at320/390px and all
three book modes, including Enter/click opening and Escape closing the editor.
Final checks await hidden state after the existing closing animation instead
of an incorrect100ms guess. Final3278/3278 full tests, exit0,68044ms. First run
caught three obsolete asset-version assertions; only expected URL updated before
passing rerun. Cachev676 and six matching web mirrors; no native/live writes.
Receipts outside Git: `artifacts/profile-empty-20261102-full.log`,
`output/playwright/profile-empty-{before,after}-results.txt`,
`output/playwright/profile-empty-interactions-results.txt`,
`output/playwright/profile-empty-latest.png`.

## P-003: visitor dialog interaction boundary

The actual visitor connections dialog did not move focus inside, isolate the
background or close with Escape (all three false in the before-browser probe).
Unlike the owner dialog, the React visitor connections/library overlays had no
focus lifecycle. Three new source regressions also failed before the repair.

`modules/lorefy-public-profile.js` now manages the active overlay only: focus the
existing close button, wrap Tab/Shift+Tab, dismiss with Escape or the backdrop,
restore each sibling's earlier inert state and return to the connected opener.
Library and connection opens are mutually exclusive. Async list completion does
not restart focus management. Unmount cleans up listeners and background state.
Fonts, colors, artwork, frames, reading data and backend calls are unchanged.

Five regression cases cover isolation, keyboard wrap, Escape/focus restoration,
old inert preservation, loading completion, cleanup, non-stacking and backdrop
targeting. Related source tests pass; final full suite3283/3283, exit0,84494ms.
Actual React/browser matrix264/264 covers all3 layouts, AR/EN and320/430px for
Followers, Following and Library. Another12/12 checks cover retry, reader/work
navigation and inert cleanup. No page errors in either matrix. The initial
browser probe now reports all3 corrected conditions true. Cachev677 and six
selectively synchronized web mirrors; no native build or live account writes.

Receipts outside Git: `artifacts/profile-dialogs-20261102-full.log`,
`output/playwright/profile-dialog-v677-results.txt`,
`output/playwright/profile-dialog-navigation-v677-results.txt`,
`output/playwright/profile-dialog-probe-v677.js`.

## Open Audit Items

P-001 through P-003 are source/demo-verified. Native media chooser/keyboard, real-account durability,
all-pack visual coverage and long-session frame time remain independent gates.
Do not report every profile interaction or device fully certified by this pass.
No native build or production service deployment is authorized.

[[systems/Profiles-Lists]] | [[systems/Accounts-Sync]]
[[systems/Appearance-Bundles]] | [[13-Project-Story]]
[[14-Feature-Coverage]] | [[15-Work-Control]]
