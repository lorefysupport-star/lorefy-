---
kind: session
status: source-browser-verified-live-delivery-pending
date: 2026-10-27
---
# Durable In-App Inbox and Independent Review Credit

Owner's newest priority is delivery inside the application; OS push is optional.
This pass does not force native permission, publish a release, alter production
schema, commit or push GitHub. Other requested features remain explicitly open.

## In-App Notifications

`backend/lorefy-native-runtime.js` now persists the most recent60 inbox rows and
pending read receipts per authenticated owner. Restore follows authenticated
session identification; logout/account switches clear the visible inbox before
awaiting the next account. No foreign/self events are restored or displayed.

Read notifications stay in history rather than disappearing. Failed receipts
retry on the next authenticated refresh. Server snapshots preserve local read
state and inserts received while fetching, but otherwise remain authoritative.
Unchanged refreshes retain the same row nodes instead of replacing focus. A
failed empty fetch shows Retry rather than a misleading successful empty state.

The existing realtime subscription,30-second visible-page fallback, bell-open
refresh, foreground banner and exact-target navigation remain. None requires
OS push permission. `styles/lorefy-notification-center.css` reserves separate
header space for Back/title/Mark all, with semantic material and readable copy.

Read-only service inspection confirmed notification SELECT ownership policy,
Realtime publication, enabled follow/comment/reaction creation triggers and
recent rows of those kinds. No real recipient mutation or test notification was
sent in this pass. These checks do not certify current two-account delivery.

## Review-Earned Reading Credit

This supersedes the18 October automatic Completed-status policy for publication.
Successful current publication captures `completedByReview` and a one-time
`completionProgress` snapshot inside the owned review. Library status, explicit
checkpoints and removal markers are not changed. Edits preserve that snapshot.
`modules/lorefy-reading-metrics.js` counts the per-work maximum of manual and
review-earned units, never their sum; unknown totals do not invent progress.
Only the current owner's snapshots count. Historical reviews are not backfilled.

This is estimated reading credit, not measured elapsed time. Completed-library
count remains based on the reader's actual status choice. Public-profile server
projection parity with review-earned credit still needs its own service work;
it is not certified by the local owner-profile test.

## Fresh Evidence

- `npm test`:2620 passed,0 failed,exit0;75.2 seconds. Two stale source/cache
  assertions from the initial run were updated to the new equivalent ownership
  predicate and cache generation, without removing the checks.
-122 focused notification/review tests passed. New regressions were observed
  failing before the relevant implementation, including the empty offline inbox.
- Eight isolated-demo browser cases:320/430px,Arabic/English,Pink/Dark. Push
  preference was false throughout. A read event remained after reconnecting
  offline, unread count became zero, Retry sat below the header, and header/text
  stayed within bounds. Fictional fixture handlers, not production delivery.
- Actual demo review composer: publishing Berserk while Reading at chapter12
  preserved that status/checkpoint and stored384 review-credit chapters. The
  values persisted through reload. No review was posted to a real account.
- Fresh page-error capture: no JavaScript page errors. An unrelated remote
  catalog-Anilist request failed; this pass does not close catalog availability.
- Cachev606 and six selective web files mirrored to both existing derived web
  trees with `tools/patch-durable-inbox-runtime.mjs`; no native prepare/build.

Browser captures/scripts and test logs stay outside the repository/vault in the
task artifacts directory. User in-app-browser storage was not seeded.

## Remaining Requests

- Written-review import and resumable social publication still require parser,
  confirmation, rate-limit and session work. An experimental unconnected helper
  was removed rather than shipping an unwired import feature.
- Explicit work Dislike=0 and accurate public count remain unimplemented. The
  current reviews constraint/RPC already accepts0; no widening is necessary.
  Any new aggregate service operation needs review and deployment authorization.
- Character-photo entry points beyond the existing guarded picker remain open.
- Actual installed iPhone delivery, two-account flow, public credit projection,
  native accessibility and performance remain separate verification gates.

[[systems/Community-Notifications]] | [[systems/Reading-Library]] |
[[13-Project-Story]] | [[14-Feature-Coverage]]
