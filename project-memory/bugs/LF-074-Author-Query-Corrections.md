---
{"kind":"bug","id":"LF-074","status":"closed","priority":"P2","area":"catalog-search","date":"2026-10-19","reviewed_on":"2026-10-19","source_commit":"3273bda","source_verified":true,"device_verified":false,"service_verified":false,"requires_device":false,"requires_service":false,"verified_on":"2026-10-19","resolution_evidence":"[[sessions/2026-10-19-Author-Query-Corrections]]","next_action":"Collect exact missing-title examples and validate the installed device separately"}
---
# LF-074: Author and Long Query Corrections

Discord search feedback did not name a failing book or author. Independent source
inspection showed suggestions only considered titles and one edit per full query.
The planner now includes textual author names and author aliases; long queries
(12-80 normalized characters) may correct two separate words by one edit each.
Short multi-edit guesses, arbitrary metadata, automatic query replacement and
edition merging remain excluded. Exact matches suppress suggestions as before.

Source: [planner](../../modules/lorefy-catalog-plan.js),
[tests](../../tests/catalog-search-suggestions.test.js).
Five added cases; four initially failed. 71 focused cases passed. Actual browser
showed Pride and Prejudice offered for Pride nad Prejudcie. This is not proof
every book or Arabic author alias exists, or that current source is installed.

[[sessions/2026-10-19-Author-Query-Corrections]] | [[systems/Catalog-Search]] |
[[12-Device-Repairs]] | [[15-Work-Control]]
