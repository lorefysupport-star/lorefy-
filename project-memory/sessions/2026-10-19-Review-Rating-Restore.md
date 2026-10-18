---
kind: session
status: source-verified-device-pending
date: 2026-10-19
---
# Keep the saved review score on reopen

Found while implementing [[sessions/2026-10-19-Work-Experience]]. The browser
selected 4.25 but a reopened editor showed 4.75. The main application's effect
averaged restored detail values whenever their object changed, including initial
hydration. A saved overall value could also participate in its own average.

[Source](../../uploads/files/lorefy-app.js) adds a current-editor-only automatic
rating policy. Detail edits opt in once; overall edits cancel that opt-in;
hydration does neither. Only the four actual detail fields are averaged to
quarters. The flag is ephemeral editor state, not a storage or server schema.
Existing session guards, publication behavior, drafts and reading completion
contracts remain unchanged. Three formatting boundaries isolate the tiny edits
within legacy compiled code; no whole-file reformat or framework replacement.

[Six regression cases](../../tests/review-rating-lifecycle.test.js) cover restore,
one-shot averaging, excluding overall, incomplete/invalid input, stale ownership
and manual-input precedence. The quarter-average contract now checks the guarded
policy instead of requiring the superseded unconditional effect.

Browser: local demo 4.25 selected, published, page reloaded and editor reopened
at exactly 4.25 with the existing text intact. Original 5.00 restored afterward.
No real account publication, server mutation, device install or native build.
Source is selectively synchronized into both native web copies.

The final combined work-flow batch passed 138 focused and 2164 full-suite tests,
zero failures/skips/cancellations, exit 0. This is batch evidence including the
related UI work, not a claim that the isolated repair introduced 15 rating tests.

[[bugs/LF-068-Review-Rating-Restore]] | [[systems/Reading-Library]] |
[[13-Project-Story]] | [[14-Feature-Coverage]]
