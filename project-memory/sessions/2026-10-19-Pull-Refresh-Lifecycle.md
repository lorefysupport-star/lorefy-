---
kind: session
status: source-verified
date: 2026-10-19
---
# Pull Refresh Acceptance

[[bugs/LF-075-Pull-Refresh-Lifecycle]] follows the owner's explicit request to
refresh community and profiles by pulling down. Shared controls respect current
themes, existing banners and frame geometry,44px targets and reduced motion.
Keyboard/screen-reader refresh is focusable without adding a permanent banner
button over the central decoration. Editors/dialogs, upward/horizontal gestures,
multitouch and non-top scroll positions do not start a refresh.

No native build, install, Apple upload, live account edit or production change.
Only repaired web assets are selectively copied to both native public directories.
New source requires a future authorized release to reach the installed phone.

Browser observations: a controlled source fixture dispatched real TouchEvents
through the application listeners. Community short/cancelled pulls kept0/1 prior
calls unchanged; armed pull did not request before release; release sent one;
controlled failure reached error; profile reached success then idle. Raw evidence
stays in the conversation artifacts folder outside Git and the vault. This is
synthetic browser evidence, not hardware touch latency or a production fetch.

An initial full run found missing timer globals in an older extracted-effect test
and a static guard assertion that needed updating to the new positive guard.
Behavioral stale-page, timeout/retry, account/session/client cancellation and
pending-local-edit tests cover those boundaries directly. Final suite receipt
is2233 passed,0 failures/skips/cancellations on the final source, including33
added cases. Focused regression commands were also rerun during each change.
Nine repaired web assets were hash-matched against both native public copies.

Additional acceptance: focusable refresh succeeded on the real demo community,
owner profile and a visited reader profile, without fixture job replacement.
AR and EN controlled failure labels were observed. A composer stayed open and
another synthetic pull sent no request. A bounded2s idle observation on the demo
community found0 added/removed element nodes; this is not an FPS or live-service
benchmark. Friend shelves now expose an awaited refresh too.

Sync-observer regression: a refreshed remote identity/social projection initially
scheduled two cloud writes. Hydration now suppresses observation only around its
synchronous remote writes; user edits made while awaiting remain observable.
Generation changes also reject a stale refresh instead of reporting false success.
Failed following-list reads retain the known filter instead of inventing an empty
Following feed. Relative timestamps are refreshed on a later explicit render
without reinstating background polling.

[[18-Progress-Handoff]] | [[systems/Profiles-Lists]] | [[systems/Community-Notifications]]
