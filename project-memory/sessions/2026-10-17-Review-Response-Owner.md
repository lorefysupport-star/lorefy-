---
kind: session
status: verified-source
date: 2026-10-17
reviewed_on: 2026-10-17
---
# Scope Review Mutation Responses to Their Originating Account

Final verification: `npm test`, 1318 passed, 0 failed. The first full run found
an isolated older publishing test had not loaded the new request-scope helpers;
its harness now supplies the same helpers and a fictional owner. Its original
assertions that preserve other authors' reviews remain unchanged. The focused
28-test ownership/visibility/reading set and the complete rerun both pass.

Source parent `3d1ff62`. Following the explicit progress repair, deferred-request
tests executed the actual `tr`, `qo` and `Ko` handlers. After replacing the
fictional account, all three still performed their UI writes; stale failures
also displayed errors. This is client behavior evidence, not a live service test.

Added two small source helpers to capture/compare the existing account fields,
backend instance, mode and `_communityEpoch`. They read only owner identifiers,
not access tokens or private prose. Malformed/unreadable storage returns no
scope. Each handler checks after its await and in its error path; the publish
success timer checks again before changing state. Normal same-account behavior
and the preceding status/progress independence repair remain intact.

`tests/review-response-ownership.test.js`: nine cases failed before repair, one
same-account success control passed. Eleven pass after repair, including the
late success timer. Tests cover publish/delete/reply success and failure, session
epoch invalidation, storage-owner lag, backend instance replacement and malformed
owner storage. The combined review suites passed 29 tests.

Normal source-browser verification used the isolated port-8796 demo only. After
reload the saved rating/prose opened, publication succeeded, and Reading with one
volume/90 pages remained unchanged. At 440px, client and scroll widths matched.
No live login/account switch, real review deletion or cloud request was performed.
Screenshots remain outside Git/vault. No installed-device certification.

Limits: captures the owner at submission, not the opening of every editor;
does not cancel requests already submitted or replace backend/RLS enforcement.
Media-upload/account transitions and same-account editor replacement remain
separate investigations. Do not claim a complete authorization audit.

Selective existing web copies only; cache `lorefy-v475-review-owner`, app asset
`20261017-review-owner-v1`. No native build, installation, Apple upload, production
deployment, migration or secret change.

[[bugs/LF-025-Review-Response-Owner]] | [[systems/Community-Notifications]] |
[[systems/Accounts-Sync]] | [[17-Extended-Review-Plan]] | [[15-Work-Control]] |
[[05-Verification]]
