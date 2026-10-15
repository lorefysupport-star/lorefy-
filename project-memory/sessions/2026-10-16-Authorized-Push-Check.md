---
kind: session
status: service-and-owner-confirmed
date: 2026-10-16
---
# Single authorized push delivery check

The owner explicitly authorized one test notification to their named account.
One system notification was inserted using the existing notification/trigger
path with a unique event key. No second send, secret change, schema change,
function deployment or native build occurred. Account identifiers, tokens,
event key, notification UUID, request ID and raw responses are not retained here.

The existing trigger's request was correlated to the response: HTTP 202,
delivered=1, unavailable=0, no timeout or transport error. This means APNs
accepted this request; that response alone would not prove on-screen delivery.

The owner then explicitly confirmed both:
- The test appeared outside Lorefy.
- Tapping that same notification opened Lorefy's notification inbox.

[[bugs/APNS-001-Background-Delivery]] is therefore closed for this delivery and
tap-path verification scope. The cause of the earlier missed-notification report
has not been established. One successful test does not certify every event kind,
device, cold launch, permission configuration, offline queue or high-volume case.
The separate [[bugs/APNS-002-Transport-Isolation]] source patch is still not
deployed; this successful test did not silently deploy it.

[[systems/Community-Notifications]] | [[15-Work-Control]] | [[05-Verification]]
