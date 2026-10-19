---
{"kind":"bug","id":"APNS-003","status":"closed","priority":"P1","area":"notifications","date":"2026-10-19","reviewed_on":"2026-10-19","source_commit":"4fe6bef","source_verified":true,"device_verified":false,"service_verified":false,"requires_device":false,"requires_service":false,"verified_on":"2026-10-19","resolution_evidence":"[[sessions/2026-10-19-Push-Permission-Intent]]","next_action":"Native permission and production token/delivery verification remain separate; no service deployment or native build authorized"}
---
# APNS-003: Late Permission Restores an Outdated Choice

Disabling push during checkPermissions/requestPermissions was overwritten by a
late granted response. A subsequent explicit opt-in also shared the old cancelled
attempt. Three failing regressions reproduced this without Apple or Supabase.

[Native runtime](../../backend/lorefy-native-runtime.js) now assigns an intent
epoch to each current attempt, coalesces only that attempt, checks after permission
awaits and prevents old completion/failure/cleanup from replacing newer intent.
A registration finishing after opt-out is unregistered again if push remains off.
Backend cleanup failures still reject; they are not silently reported as success.

This does not revoke a notification already sent or prove server token cleanup
ordering/delivery. The device and service acceptance remain separate, especially
the previously undeployed [[bugs/APNS-002-Transport-Isolation]] change.

[[sessions/2026-10-19-Push-Permission-Intent]] |
[[12-Device-Repairs]] | [[15-Work-Control]]
