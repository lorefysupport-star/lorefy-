---
{"kind":"bug","id":"LF-075","status":"closed","priority":"P1","area":"community-profile","date":"2026-10-19","reviewed_on":"2026-10-19","source_commit":"ba3cd99","source_verified":true,"device_verified":false,"service_verified":false,"requires_device":false,"requires_service":false,"verified_on":"2026-10-19","resolution_evidence":"[[sessions/2026-10-19-Pull-Refresh-Lifecycle]]","next_action":"Validate physical touch and production reads after a separately authorized future release; source acceptance only is closed"}
---
# LF-075: Pull Refresh and Repeated Community Rendering

The owner reported missing pull-to-refresh and a community page that repeatedly
renders or hangs. Reproduced independently: three simultaneous refresh events
started three review requests, unchanged graph responses replaced React state,
identical post state rebuilt cards, and post callers could return before a pending
request completed. The live review effect also polled unconditionally every30s
in addition to realtime and visibility refreshes.

New [page refresh](../../modules/lorefy-page-refresh.js) handles downward pulls
only at the top, with threshold/reversal/multitouch cancellation, manual keyboard
equivalent, coalesced named jobs,15s UI timeout and stale route/account guards.
[Backend](../../backend/lorefy-backend.js) refresh reuses account reconciliation,
preserves pending edits and emits changed-field events; it never pushes or reloads.
Community posts/reviews have14s internal deadlines and reject stale completions.
The arbitrary30s polling loop is removed; realtime/foreground refreshes remain.
Visitor refresh reads that visitor's public projection, never the viewer's state.

Tests: [gesture/coordinator](../../tests/page-refresh.test.js),
[account](../../tests/account-page-refresh.test.js),
[feed lifecycle](../../tests/community-refresh-lifecycle.test.js),
[visitor](../../tests/public-profile-loading.test.js).
Browser fixture uses real application DOM and synthetic TouchEvents with isolated
read-only jobs: short/cancelled pull sent no request, release sent one, controlled
failure ended in retryable error, community and profile returned to idle. It is
not physical iPhone gesture/FPS or production service certification.

Final source suite:2233 passed,0 failures/skips/cancellations;33 added cases
cover gestures, lifecycle, account reconciliation, visitor and friend refresh.
All nine repaired web assets match both native public copies; no native build.

Official references: [UIRefreshControl](https://developer.apple.com/documentation/uikit/uirefreshcontrol),
[TouchEvent](https://developer.mozilla.org/en-US/docs/Web/API/TouchEvent),
[preventDefault](https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault).
The touchmove listener is non-passive and only cancels a cancelable vertical pull.

[[sessions/2026-10-19-Pull-Refresh-Lifecycle]] | [[systems/Community-Notifications]] |
[[systems/Accounts-Sync]] | [[12-Device-Repairs]] | [[15-Work-Control]]
