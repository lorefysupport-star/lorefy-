---
kind: session
status: verified-source
date: 2026-10-17
reviewed_on: 2026-10-17
---
# Bind Review Drafts to Their Opening Session

Final verification: `npm test`, 1328 passed, 0 failed. Selective canonical/web
copy SHA-256 checks matched. Memory audit: 107 notes, 516 source files, fresh,
no issues, duplicate groups or orphan notes. This is source evidence only.

Source parent: `795c09d`. The actual opener, `tr` and `fr` handlers were exercised
with fictional accounts and deferred responses. Seven new main-handler cases
failed before the patch; the ordinary success/failure control passed. Two new
composer cases also failed on shared text refs and late component state writes.

Added a small editor-current predicate and one React ref. Each opening captures
the existing account scope, work and monotonic editor ID. The focused composer
has a generation key and guarded callbacks; text/moment changes and async local
state use the same predicate. A closed or replaced editor cannot publish again.
Publish failure still leaves the current draft available for retry. Existing
request-scope protections for deletion/replies and saved reading independence
remain intact. No review body or account identifiers are logged or stored here.

Focused editor/ownership/reading/visibility/beta suites: 73 passed. The older
isolated language test needed its real scope helpers and a fictional owner;
its original draft and tab assertions remain. The first full run exposed this
harness omission (1327 pass, 1 fail), not an app runtime failure.

Source-browser check: the existing local demo at port 8795 opened the saved
Hunter x Hunter review (5.00 and existing prose), republished it successfully,
then reopened with both preserved. Existing Completed/420 progress was unchanged.
No real-account write or live account switch was performed. The screenshot is
outside Git/vault. Race/account cases are deterministic source fixtures only.

Selective existing web copies only. Cache `lorefy-v476-review-editor-owner`,
app/composer asset `20261017-review-editor-owner-v1`. No native build, device
installation, Apple upload, service deployment, migration or secret change.
Local image decode completion and backend upload transitions are separate gates.

[[bugs/LF-026-Review-Editor-Owner]] | [[systems/Community-Notifications]] |
[[systems/Accounts-Sync]] | [[17-Extended-Review-Plan]] | [[15-Work-Control]] |
[[05-Verification]]
