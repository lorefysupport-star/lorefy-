---
{"kind":"bug","id":"LF-027","status":"closed","priority":"P1","area":"community","date":"2026-10-17","reviewed_on":"2026-10-17","source_commit":"98def8f","source_verified":true,"device_verified":false,"service_verified":false,"requires_device":false,"requires_service":false,"verified_on":"2026-10-17","resolution_evidence":"[[sessions/2026-10-17-Review-Image-Owner]]","next_action":"Native photo permission, invalid-image recovery and backend upload ownership remain separate gates"}
---
# LF-027: Delayed Review Images Attach to Another Draft

The local review image reader captured neither the account nor editor instance.
A delayed FileReader or image decode could append to a different account or a
replacement editor. Even an already-queued React updater could attach too late.

`Yn` now captures the editor and checks its existing owner/work/generation
before reading, before decoding, before creating the canvas and inside the
attachment updater. The 560px bound, JPEG quality and ten-image cap are unchanged.
Six regressions failed before repair; the normal resize/cap control already
passed. All seven image cases pass after repair.

This covers local preparation, not a cloud upload, file-content validation,
permission handling, request cancellation or physical-device certification.

[[15-Work-Control]] | [[12-Device-Repairs]] | [[systems/Community-Notifications]] |
[[17-Extended-Review-Plan]] | [[bugs/LF-026-Review-Editor-Owner]]
