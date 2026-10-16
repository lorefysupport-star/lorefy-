---
kind: session
status: verified-source
date: 2026-10-17
reviewed_on: 2026-10-17
---
# Keep Review Image Preparation Inside Its Editor

Final verification: `npm test`, 1335 passed, 0 failed. Selective web asset
SHA-256 checks matched. Memory audit: 109 notes, 516 source files, fresh,
no issues, orphan notes or duplicate groups. Browser smoke reopened the saved
rating/prose in the latest 440px phone preview; no new native build was made.

Source parent: `98def8f`. After the editor ownership repair, the real `Yn`
handler was executed with controlled FileReader/Image completions. Six new
regressions failed: owner changes before read/decode, editor replacement,
closure, a queued state updater and an obsolete retained upload action.
The unchanged resize/cap control passed before and after the repair.

The existing editor-current predicate is now checked at each asynchronous
boundary and inside the React updater. No new dependency, backend call, file
storage or private image logging was introduced. A stale image never reaches
the canvas/attachment state; current images still resize 1000x500 to 560x280,
encode as JPEG at 0.72 and retain the ten-image limit.

Focused editor/ownership/reading/visibility suites: 56 passed, 0 failed. The
image fixture excludes the legitimate image-reset write made by reopening the
editor, so it measures only obsolete completion effects. Test files use
fictional data, not personal photographs or a live account.

Browser smoke testing covers the ordinary focused editor, publication and
saved draft restoration in a local demo. The attachment control is premium-gated
in the current beta; image timing evidence is from deterministic source tests,
not an actual browser file upload or native Photos permission test.

Selective existing web copies only; cache `lorefy-v477-review-image-owner`,
app asset `20261017-review-image-owner-v1`. No native build, installation, Apple
upload, production write, deployment, migration or secret change. Backend
media ownership, image read/decode failure UX and permission recovery remain.

[[bugs/LF-027-Review-Image-Owner]] | [[bugs/LF-026-Review-Editor-Owner]] |
[[systems/Community-Notifications]] | [[17-Extended-Review-Plan]] |
[[15-Work-Control]] | [[05-Verification]]
