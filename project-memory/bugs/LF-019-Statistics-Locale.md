---
{"kind":"bug","id":"LF-019","status":"open","priority":"P2","area":"language","date":"2026-10-16","reviewed_on":"2026-10-16","source_commit":"5c07689","source_verified":false,"device_verified":false,"service_verified":false,"requires_device":false,"requires_service":false,"verified_on":null,"next_action":"Reproduce the statistics renderer in English, localize remaining headings/numbers and direction without inventing activity history"}
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

[[bugs/LF-018-Reading-Estimate-Labels]] | [[15-Work-Control]] |
[[systems/Language-Media]] | [[systems/Reading-Library]] |
[[12-Device-Repairs|Historical device evidence is a separate target]]
