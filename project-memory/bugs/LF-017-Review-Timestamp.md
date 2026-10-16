---
{"kind":"bug","id":"LF-017","status":"needs-device","priority":"P2","area":"language","date":"2026-10-16","reviewed_on":"2026-10-16","source_commit":"3451cc2","source_verified":true,"device_verified":false,"service_verified":false,"requires_device":true,"requires_service":false,"verified_on":null,"resolution_evidence":"[[sessions/2026-10-16-Review-Timestamp]]","next_action":"Validate dates on a future authorized native version; do not build now"}
---
# LF-017: Review Date and Time Follow the Interface Language

The review renderer called `toLocaleDateString("ar")` and
`toLocaleTimeString("ar")` regardless of the current React language. English
labels and the input direction were already localized, but the timestamp was not.

The renderer now passes the original timestamp and current language to
`LorefyI18n.reviewTimestamp`. The formatter uses that language for both parts,
retains the device timezone and handles missing/invalid timestamps without
inventing epoch dates. Explicit numeric zero remains a valid timestamp. Stored
timestamps, review prose and author names are not changed or translated.

[Tests](../../tests/review-timestamp.test.js): six failed before implementation;
22 related tests and the complete 1,256-test suite passed afterward. Browser
AR/EN review screens confirmed the same sample date and unchanged Arabic prose.

[[sessions/2026-10-16-Review-Timestamp]] | [[15-Work-Control]] |
[[12-Device-Repairs|Source verification does not update the installed binary]] |
[[05-Verification]]
