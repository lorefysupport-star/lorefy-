---
{"kind":"bug","id":"LF-068","status":"closed","priority":"P1","area":"reviews","date":"2026-10-19","reviewed_on":"2026-10-19","source_verified":true,"device_verified":false,"service_verified":false,"requires_device":false,"requires_service":false,"verified_on":"2026-10-19","resolution_evidence":"[[sessions/2026-10-19-Review-Rating-Restore]]","next_action":"Check the editor on a future authorized installed release; no build or live publish requested"}
---
# LF-068: Restoring detailed ratings replaces the saved overall score

During the work-page browser pass, choosing 4.25 and publishing succeeded,
but reopening displayed 4.75. The saved score was not the failing boundary:
restoring the details triggered an unconditional averaging effect in
[the application](../../uploads/files/lorefy-app.js).

The effect now runs only after an explicit detail edit in the current editor.
Overall input cancels pending automatic calculation; opening/hydrating cannot
recalculate it. Only story/art/chars/world participate, not the previously saved
overall field. Partial/invalid details cannot erase a manual score; quarter
precision and request/editor ownership remain intact. No historical backfill.

Six failing-then-passing regressions and the local browser confirmed 4.25 after
publish, reload and reopen. The demo review's original 5.00 and text were restored.
This is not live-service, physical-device or native-release certification.

[[sessions/2026-10-19-Review-Rating-Restore]] | [[systems/Reading-Library]] |
[[15-Work-Control]] | [[14-Feature-Coverage]]
