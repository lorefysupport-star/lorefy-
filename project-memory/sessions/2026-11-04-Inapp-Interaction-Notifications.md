---
kind: session
status: source-browser-service-verified-device-pending
date: 2026-11-04
---
# In-app interaction notifications

Owner requested complete in-app Like/comment/follow delivery and explicitly
approved the focused Supabase update after isolated tests. No native build or
Apple upload. Prior unrelated working-tree changes were retained.

## Repairs

`cleanInbox` retained only `postId`, losing actor/routing metadata after a
snapshot or restart. A bounded allowlist now preserves destinations without
arbitrary payloads. Follow opens the actor through the existing profile flow.

Review-comment triggers ignored the parent author. Community publishing
discarded reply context. The focused migration now validates same-thread
targets and derives usernames server-side, then notifies owner and addressed
author once each, excluding self/blocked pairs. Like/heart/Dislike/follow
receipts contain explicit localized-copy metadata. A reply reaction opens its
root thread. Repeated identical reactions do not create duplicate receipts;
private saves do not notify. Read state does not delete history.

Older review notifications no longer depend on the latest feed page: an
exact-ID lookup opens the review or displays a recoverable message. Session
and per-request guards reject stale results. Injected unread colors now use
theme tokens instead of purple constants.

## Evidence And Limits

Full3396/3396; nine isolated executable SQL tests; failure-first source cases;
four Playwright contexts with AR/EN, dark/light/pink and320/390/768 widths.
Banner, inbox, mark-read, offline restart and actor navigation verified with
controlled local fixtures, not real-user delivery. See
[implementation report](../../docs/INAPP_NOTIFICATIONS_2026-11-04.md).

Supabase inspection confirmed triggers/policy/publication. The approved SQL
transaction succeeded and catalog checks confirmed all seven functions.
Applied manually in SQL Editor, not a replay or CLI migration-history claim.
No production fixture events or APNs changes. Cache v693; five web files
selectively mirrored. New UI remains local; no native build/Apple upload or
GitHub push. Real two-account/device receipt remains pending owner feedback.
The client shows the latest60 rows; older server history is retained without
adding pagination in this repair.

## Requested Source Checkpoint

The subsequent owner request authorizes publishing this notification repair to
GitHub. The isolated publication snapshot excludes unrelated local Halloween,
profile, share and broader visual changes. Its own full suite passed3383/3383;
the same four browser contexts passed against that exact snapshot on port8802.
This supersedes the preceding no-GitHub-push state for the notification scope,
not the no-native-build constraint or pending physical acceptance.

[[systems/Community-Notifications]] | [[12-Device-Repairs]] |
[[13-Project-Story]] | [[14-Feature-Coverage]]
