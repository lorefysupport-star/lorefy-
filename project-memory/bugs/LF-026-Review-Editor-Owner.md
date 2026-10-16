---
{"kind":"bug","id":"LF-026","status":"closed","priority":"P1","area":"community","date":"2026-10-17","reviewed_on":"2026-10-17","source_commit":"795c09d","source_verified":true,"device_verified":false,"service_verified":false,"requires_device":false,"requires_service":false,"verified_on":"2026-10-17","resolution_evidence":"[[sessions/2026-10-17-Review-Editor-Owner]]","next_action":"Verify future installed source; local image completion and server upload ownership are separate gates"}
---
# LF-026: Review Drafts Outlive Their Editor Owner

The request-owner guard started too late: a draft opened by account A could be
submitted after switching to B. In the same account, a late publish result could
clear/close a newer editor. Retained field callbacks shared the new draft refs.

The write-review opener now captures an account scope, work ID and distinct
editor generation. Publishing checks that generation before sending and after
awaiting. The focused composer remounts per opening, rejects stale text writes,
and ignores local async state updates once obsolete. Guarded parent callbacks
cannot rate, remove images, close or publish a replacement editor.

Nine behavioral cases failed before repair. The eight main-handler cases and
two composer regressions now pass with ordinary success/failure controls.
This does not cancel a request already accepted by a server, certify server
authorization, persist an abandoned draft or validate the legacy fallback UI.
FileReader/image-decode completion is a separate follow-up.

[[15-Work-Control]] | [[12-Device-Repairs]] | [[systems/Community-Notifications]] |
[[17-Extended-Review-Plan]] | [[systems/Accounts-Sync]]
