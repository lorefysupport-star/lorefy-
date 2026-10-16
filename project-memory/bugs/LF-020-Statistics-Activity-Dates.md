---
{"kind":"bug","id":"LF-020","status":"closed","priority":"P2","area":"reading","date":"2026-10-16","reviewed_on":"2026-10-16","source_commit":"47a3861","source_verified":true,"device_verified":false,"service_verified":false,"requires_device":false,"requires_service":false,"verified_on":"2026-10-16","resolution_evidence":"[[sessions/2026-10-16-Statistics-Activity-Dates]]","next_action":"Check the corrected source on a future authorized device version; saved history is unchanged"}
---
# LF-020: Activity Dates Must Match Chart Days

The main application supplies the last seven local calendar days as objects with
`key` and `value`. The statistics normalizer ignores `key` and pairs values with
a fixed Saturday-to-Friday sequence. It happens to align on Friday, but not on
other days. This is a current source finding, not evidence of lost history.

Acceptance: valid non-padded/padded date keys produce the corresponding localized
weekday and date; invalid keys never fabricate a calendar date. Preserve order,
zero and counts. No storage migration, account write or timezone-based day shift.

Resolved in the source renderer: validated local calendar keys drive localized
Gregorian weekday/date labels and accessible bar names. Missing history has an
explicit empty state; an explicit zero does not fall through to legacy fields.
Invalid/negative display counts are bounded without writing storage. Eleven
regression tests and isolated AR/EN browser checks are in
[[sessions/2026-10-16-Statistics-Activity-Dates]]. Installed Build 35 is unchanged.

[[15-Work-Control]] | [[12-Device-Repairs]] | [[systems/Reading-Library]] |
[[bugs/LF-019-Statistics-Locale]]
