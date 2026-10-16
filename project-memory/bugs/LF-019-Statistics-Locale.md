---
{"kind":"bug","id":"LF-019","status":"closed","priority":"P2","area":"language","date":"2026-10-16","reviewed_on":"2026-10-16","source_commit":"9f972ae","source_verified":true,"device_verified":false,"service_verified":false,"requires_device":false,"requires_service":false,"verified_on":"2026-10-16","resolution_evidence":"[[sessions/2026-10-16-Statistics-Locale]]","next_action":"Verify on a future authorized device version; activity-date correctness is LF-020"}
---
# LF-019: Remaining Statistics Localization

During LF-018 browser validation at 320px in English, the new estimate labels and
method translated, but existing statistics headings/back label remained Arabic,
numbers used ar-SA, and the page kept RTL. Some existing metric text was mixed
language. The week labels were truncated Arabic. This is a current source/browser
observation, not a claim about the installed build or correctness of chart dates.

Next repair must keep the estimate, saved values and reading history intact.
Read the actual activity-entry shape before making claims about seven-day totals.
Do not turn a locale fix into reconstruction of user history.

Resolved at source/isolated-browser scope: the renderer receives React's language
explicitly and localizes its own headings, accessible names, numbers and direction.
Custom labels and input objects are preserved. Back uses the matching arrow and
a 44px target. Seven regressions and the 1,272-test full suite passed; see
[[sessions/2026-10-16-Statistics-Locale]]. No installed-app update occurred.
[[bugs/LF-020-Statistics-Activity-Dates]] separately tracks date-to-weekday mapping.

[[bugs/LF-018-Reading-Estimate-Labels]] | [[15-Work-Control]] |
[[systems/Language-Media]] | [[systems/Reading-Library]] |
[[12-Device-Repairs|Historical device evidence is a separate target]]
