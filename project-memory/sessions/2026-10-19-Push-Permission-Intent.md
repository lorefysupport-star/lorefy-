---
kind: session
status: source-verified-device-pending
date: 2026-10-19
---
# Push Permission Intent

[[bugs/APNS-003-Permission-Intent-Race]] repairs seven controlled native-bridge
scenarios: delayed check grant, delayed prompt grant, new opt-in after cancellation,
coalesced current attempts, stale registration failure, late native registration
after opt-out, and old cleanup after a new opt-in. Three initially failed.

66 focused native/runtime/backend-session/dispatcher cases pass. These are mocks
and source contracts, not real delivery, native permission UI or current production
configuration. Final full suite: **2251/2251**, zero failures. No key or environment changed;
no notification sent, server deployed or native build/install/upload performed.

Only runtime/index/service-worker assets are synchronized by hash to both native
web directories. User data and pre-existing dirty configuration are preserved.

[[systems/Community-Notifications]] | [[18-Progress-Handoff]]
