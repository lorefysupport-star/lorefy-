---
kind: session
status: verified-source
date: 2026-10-16
reviewed_on: 2026-10-17
---
# Review Publication Does Not Complete Explicit Reading Entries

Source parent `8b18712`. Actual `tr` publication executed `Zn(m)`, the explicit
completion helper. It changed the library status, captured provider totals into
saved progress and removed a removal marker. This bypassed the already repaired
`seedReviewedWorks` contract, which preserves explicit user choices.

Removed only the completion call from publication. The explicit completion
action and legacy missing-entry reconciliation remain unchanged. Do not describe
this as a new review-only-library policy or as recovery of historical progress.
No reading history, backend, database schema or account storage key changed.

`tests/review-reading-independence.test.js` executes the actual publish and
completion handlers with real completion/reconciliation metrics. Six behavioral
cases failed before the repair: all five statuses and explicit zero. Seven cases
pass afterward, including failed network publication with the draft retained.
The 27-test review/status/metrics focused set passed.

Final full suite completed on 2026-10-17: `npm test`, 1307 passed, 0 failed.

Browser source evidence uses a separate loopback origin on port 8796, demo only,
not the owner phone/account or the existing preview's storage. Pride and Prejudice
began Reading with one volume and 90 saved pages. Publishing a five-star review
did not change either. Reload kept the same state; opening the editor restored
the rating and authored text. Arabic desktop and 440px layout were observed.
Screenshots stay outside Git/vault. This is not live-cloud or device certification.

Selective existing web copies: main app, entry and service worker. Cache
`lorefy-v474-review-progress`, app version `20261016-review-progress-v1`.
No native build, install, Apple upload, secret change or production deployment.
Late review-request/account guards remain a separate investigation.

[[bugs/LF-024-Review-Progress-Independence]] | [[systems/Reading-Library]] |
[[systems/Community-Notifications]] | [[17-Extended-Review-Plan]] |
[[15-Work-Control]] | [[05-Verification]]
