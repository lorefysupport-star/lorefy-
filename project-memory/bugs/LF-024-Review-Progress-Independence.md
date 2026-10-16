---
{"kind":"bug","id":"LF-024","status":"closed","priority":"P1","area":"reading","date":"2026-10-16","reviewed_on":"2026-10-17","source_commit":"8b18712","source_verified":true,"device_verified":false,"service_verified":false,"requires_device":false,"requires_service":false,"verified_on":"2026-10-17","resolution_evidence":"[[sessions/2026-10-16-Review-Progress-Independence]]","next_action":"Verify future installed source; review-only legacy seeding and async account guards are separate gates"}
---
# LF-024: Publishing a Review Completes an Explicit Library Entry

The actual `tr` publishing handler calls `Zn(m)` after saving the review. `Zn`
is the explicit completion action: it sets Completed, captures catalog totals
into the checkpoint and removes the work's removal marker. This overwrites a
reader's Reading/Wishlist/Paused/Dropped choice and even a partial checkpoint
already marked Completed. It also replaces explicit zero with provider totals.

The repair removes only this completion side effect from publication. Explicit
completion remains available in the library workflow. The existing legacy
review reconciliation policy remains unchanged: it may seed a missing library
entry, but must preserve explicit status/removal. This repair does not claim to
redesign review-only entries or diagnose historical account data corruption.

Six cases failed before repair by executing the real publishing and completion
handlers with all five statuses and explicit zero. They pass after removing the
completion call; failed network publication still keeps the draft and state.

Isolated source browser publication and reload retained Reading, one volume and
90 pages; reopening the editor retained its saved five-star rating and prose.
No real account or service mutation was used. See the linked session receipt.

[[15-Work-Control]] | [[12-Device-Repairs]] | [[17-Extended-Review-Plan]] |
[[systems/Reading-Library]] | [[systems/Community-Notifications]]
