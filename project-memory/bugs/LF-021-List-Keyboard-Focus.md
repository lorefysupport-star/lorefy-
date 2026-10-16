---
{"kind":"bug","id":"LF-021","status":"closed","priority":"P2","area":"profiles","date":"2026-10-16","reviewed_on":"2026-10-16","source_commit":"fea486a","source_verified":true,"device_verified":false,"service_verified":false,"requires_device":false,"requires_service":false,"verified_on":"2026-10-16","resolution_evidence":"[[sessions/2026-10-16-List-Keyboard-Focus]]","next_action":"Verify future installed source with VoiceOver; narrow-screen tool clipping is a separate repair"}
---
# LF-021: Ranked List Actions Lose Keyboard Focus

Reproduced in the current source preview: moving an entry recreates the selected
rows and leaves focus on the page. Removing an entry does the same. All action
names are generic, so a screen reader cannot identify the affected entry.

The editor now restores focus to the same move action on the moved entry. At a
boundary it uses the available reverse action. Removal uses the next/previous
entry's remove action, or search when empty. Localized action names include the
original entry name; the existing status region announces its new position.

Six regression tests cover repeated moves, boundaries, removal, AR/EN names,
draft saving, failed-save retry and cancellation. Current-source browser Enter
testing confirms two consecutive moves without retargeting. No account write,
native build, installation or VoiceOver certification is implied.

[[15-Work-Control]] | [[12-Device-Repairs]] | [[17-Extended-Review-Plan]] | [[systems/Profiles-Lists]]
