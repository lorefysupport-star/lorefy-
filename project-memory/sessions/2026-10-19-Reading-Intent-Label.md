---
kind: session
status: source-and-browser-verified
date: 2026-10-19
reviewed_on: 2026-10-19
---
# Want-to-Read Picker Copy

Parent `157e5cb`, after separately verifying/pushing the Discord quota repair.
[[bugs/LF-072-Reading-Intent-Label]] implements the specific reading-picker
suggestion from [this channel](https://discord.com/channels/1548805628430909453/1555538889215709245).

Display policy is distinct from the saved status: the original wish key, click
handler and storage schema remain unchanged. Arabic/English copy and radio
recognition are updated. Two formatting-only newlines isolate the changed
compiled display expression; the whole app was not reformatted.

[Seven cases](../../tests/reading-intent-label.test.js) cover full-app parsing,
display languages, original stored constant and handler, unchanged other values,
i18n and keyboard radio inclusion. The initial six behavior cases failed before
implementation. Browser/full-suite checks then caught a missing closing argument
parenthesis introduced by the expression edit; a parse regression was added and
the error corrected before commit. `node --check` passes. This edit-time failure
is not evidence about the older Discord black-screen report.

Focused reading/work/rating/progress/UI-unity suite:38 passed. Final full
`npm test`:2190 passed, zero failures/skips/cancellations.

The local demo's Hunter x Hunter page loaded; opening the picker exposed five
radios including `أرغب بالقراءة`, with Completed still selected. No new selection
or save was made, preserving the existing 420/420 library state. Screenshot
`discord-reading-intent.png` is local in the chat's artifacts, outside Git/vault.
The picker remains open for the owner to inspect. English behavior is verified
by source tests, not a new English device run.

App/growth/i18n/index/sw selectively match both native-web copies. Service-worker
cache `lorefy-v528-read-intent`; no native build, Apple upload, production write,
Discord post or change to installed software. Remaining feedback and evidence
limits: [review](../../docs/DISCORD_FEEDBACK_REVIEW_2026-10-19.md).

[[13-Project-Story]] | [[14-Feature-Coverage]] | [[18-Progress-Handoff]] |
[[systems/Reading-Library]] | [[systems/Language-Media]]
