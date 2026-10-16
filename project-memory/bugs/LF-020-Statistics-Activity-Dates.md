---
{"kind":"bug","id":"LF-020","status":"open","priority":"P2","area":"reading","date":"2026-10-16","reviewed_on":"2026-10-16","source_commit":"9f972ae","source_verified":false,"device_verified":false,"service_verified":false,"requires_device":false,"requires_service":false,"verified_on":null,"next_action":"Use validated readLog calendar keys for chart weekdays; test rolling-week and month boundaries without changing saved counts"}
---
# LF-020: Activity Dates Must Match Chart Days

The main application supplies the last seven local calendar days as objects with
`key` and `value`. The statistics normalizer ignores `key` and pairs values with
a fixed Saturday-to-Friday sequence. It happens to align on Friday, but not on
other days. This is a current source finding, not evidence of lost history.

Acceptance: valid non-padded/padded date keys produce the corresponding localized
weekday and date; invalid keys never fabricate a calendar date. Preserve order,
zero and counts. No storage migration, account write or timezone-based day shift.

[[15-Work-Control]] | [[12-Device-Repairs]] | [[systems/Reading-Library]] |
[[bugs/LF-019-Statistics-Locale]]
