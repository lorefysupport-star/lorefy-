---
kind: session
status: source-verified-device-pending
date: 2026-10-19
---
# Shared Pending Character Name Queries

[[bugs/LF-084-Character-Search-Coalescing]]: seven new lifecycle cases, six
failed before repair on duplicate request counts. 106 focused tests pass.
Full suite: **2315/2315**, zero failures/skips/cancellations.

Coverage includes normalized identical queries, per-caller work identity,
inactive-caller persistence guards, shared malformed response and timeout retry,
late JSON rejection, independent names and a memoized valid empty response.
The public remote payload is shared; favorites, active state, catalog projections
and account-owned actions are not. Existing ten-second whole-request deadline,
schema validation, forty-entry result cache and identity exclusions are retained.

Only canonical index/worker/character module synchronized to both native source
directories; hash equality checked. No build, install, service deployment, live
account mutation or device/two-account certification.

[[systems/Explore-Works]] | [[18-Progress-Handoff]]
