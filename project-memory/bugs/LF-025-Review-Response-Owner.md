---
{"kind":"bug","id":"LF-025","status":"closed","priority":"P1","area":"community","date":"2026-10-17","reviewed_on":"2026-10-17","source_commit":"3d1ff62","source_verified":true,"device_verified":false,"service_verified":false,"requires_device":false,"requires_service":false,"verified_on":"2026-10-17","resolution_evidence":"[[sessions/2026-10-17-Review-Response-Owner]]","next_action":"Verify future installed source; server request cancellation and ownership of an editor before submission are separate gates"}
---
# LF-025: Late Review Responses Affect the Next Account UI

The publishing, deletion and reply handlers await the backend and then update
the current React state/DOM without checking the originating account. A late
publish can clear the next draft and add the old review; a late reply can touch
the current comment editor. Old failures can show another session's error.

The client now captures the active storage owner, session user id, backend user,
mode, backend instance and existing session epoch when starting the request.
After resolution/rejection it updates UI only if that scope is still current.
The delayed success timer uses the same guard. Unreadable owner state fails
closed before sending. No credentials are copied into the scope or logs.

Nine behavioral cases failed before the repair. Eleven now pass, including
unchanged-account success. This prevents stale client-side effects only; it
does not cancel an RPC already submitted or certify server-side authorization,
media-upload ownership or the ownership of a draft opened before submission.

[[15-Work-Control]] | [[12-Device-Repairs]] | [[systems/Community-Notifications]] |
[[17-Extended-Review-Plan]] | [[systems/Accounts-Sync]]
