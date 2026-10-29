---
kind: session
status: source-browser-verified-live-device-pending
date: 2026-10-30
source_commit: b322afd
---
# Inbox reconnect, cross-device read events and shared refresh

Owner authorizes each verified repair to be committed/pushed independently.
The preceding private media signing fix was pushed as `b322afd`, after a fresh
3004-test run and remote-ref equality. No build or paid/service operation.

## Reproduced

The notification channel listened only for INSERT. SDK subscription status was
not exposed, so reconnect did not trigger an immediate authoritative fetch.
Parallel inbox refreshes issued separate queries and invalidated each other.
Duplicate INSERT payloads could remove an existing read_at and re-announce an
already-read notification. Native App resume and browser online were not wired.
New failing tests reproduced these cases before changing implementation.

## Repair

- `backend/lorefy-backend.js`: same owner-filtered channel now receives UPDATE
  with an event discriminator. Optional status callback is scoped to the current
  client/owner/epoch/channel, and callbacks from obsolete channels are ignored.
  Channel identity is installed before subscribe so synchronous status is safe.
- `backend/lorefy-native-runtime.js`: coalesced refresh job per connection/backend;
  concurrent requests share results, rather than cancelling one another. A
  reconnect arriving during a fetch requests one trailing, non-overlapping
  catch-up. SDK SUBSCRIBED, browser online and native active resume request catch-up.
- UPDATE preserves history and order, merges read_at, never emits a new toast;
  unknown updated rows trigger a bounded snapshot rather than arbitrary insertion.
  Duplicate inserts cannot undo saved/local read state. Existing deduplication,
  pending read retry, offline inbox and account guards stay intact.
- Backend replacement and account/connection changes reject stale snapshots and
  callbacks. No test-only identity/data or callbacks are shipped with runtime.
- Source asset keys and cachev640 synchronized to both web-runtime mirrors.
  No native compile, SQL migration, Edge deployment, live message or schema write.

## Evidence

-10 new behavioral regressions in notification-backend-session and
  notification-delivery-runtime. Combined focused suite71/71.
- Final full source suite **3014/3014**, zero failures, exit0,64,059ms.
  First full run caught an old native-runtime cache expectation; it was updated
  and the complete suite was rerun, not waived.
- Actual local application, isolated demo contexts only, with external hosts
  blocked and mock notification service callbacks. **84/84 browser checks**,
  AR/EN runtime copy and320/390/768 widths; no pageerrors. Real bell navigation,
  reconnect, shared request count, Home badge before/after UPDATE, duplicate
  suppression, offline recovery, online catch-up and account isolation checked.
  No claim of full-app English localization from changing runtime document lang.
- External workspace evidence: `artifacts/notification-reconnect-20261030-red.log`,
  `notification-reconnect-20261030-full.log`,
  `notification-reconnect-20261030-browser.js` and `.json`,
  `inbox-reconnect-ar.png`/`inbox-reconnect-en.png`. Raw evidence stays outside Git.

## Remaining

Live two-account/two-device replication, APNs delivery, physical background
resume and long offline acceptance are not certified by fixtures. No new native
release means existing TestFlight users have not received this source repair.
F15 broader acceptance/pagination and other Pro adoption stages remain open;
do not call the whole app issue-free or re-do completed image-consumer batches.

[[systems/Community-Notifications]] | [[09-Data-Contracts]] |
[[13-Project-Story]] | [[14-Feature-Coverage]] | [[15-Work-Control]] |
[[19-UI-Execution-Control]] | [[10-Open-Questions]]
