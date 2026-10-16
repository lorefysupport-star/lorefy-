---
{"kind":"bug","id":"LF-023","status":"closed","priority":"P1","area":"reading","date":"2026-10-16","reviewed_on":"2026-10-16","source_commit":"e116b58","source_verified":true,"device_verified":false,"service_verified":false,"requires_device":false,"requires_service":false,"verified_on":"2026-10-16","resolution_evidence":"[[sessions/2026-10-16-Home-Continuation]]","next_action":"Verify future installed source; no native build or service change was made"}
---
# LF-023: Continue Reading Is Not Connected to Current Home

The review asks for continuation from a saved stop point. Current Home renders
the social feed directly and never calls the older catalog renderer `ir`.
The continuation section remained in that old renderer; its selector also used
the status string instead of the work id to read the progress map. A prior
static test asserted that wrong expression instead of executing it.

Two causes, one workflow: reconnect the compact existing section to the current
social Home without restoring the catalog switch, and correct the fallback
selector. The current section uses the already account-derived `Hn` works,
bounded to four. Only active-reading entries with a positive saved chapter,
page or volume are eligible. No metadata-based progress, auto-completion or
storage migration is introduced. Native buttons open the selected work.

Verified source browser: EN/AR dark at 320px, persisted checkpoint after reload,
Enter opens the correct work, and returning it to Completed removes the section
without changing its 420-chapter checkpoint. The fictional demo was restored.
Nine regression tests include actual selector execution and renderer activation.
[[sessions/2026-10-16-Home-Continuation]] retains the verification boundary.

[[15-Work-Control]] | [[12-Device-Repairs]] | [[17-Extended-Review-Plan]] |
[[systems/Reading-Library]]
