---
kind: session
status: source-browser-verified-live-device-pending
date: 2026-10-30
source_commit: 0df8087
---
# Discard queued read receipts before dispatch after session changes

Continuation of [[sessions/2026-10-30-Inbox-Reconnect]], pushed as `0df8087`.
Owner requests a separate verified GitHub push for each repair, not a build.

`flushReadReceipts` deferred its RPC through a microtask. It checked connection,
owner and backend after the response, but not immediately before invoking the
backend. A click followed by account switch/logout/backend replacement in the
same turn could dispatch the previous owner's queued IDs under a later context.
This is not evidence that production RLS allowed modifying another user's rows.

Three new runtime regressions reproduced the unwanted dispatch before repair.
The queued callback now returns false before HTTP/RPC invocation if its captured
connection, owner or backend is obsolete. Pending receipts remain in the original
owner's existing durable inbox; normal same-owner offline retry still works.
No new storage keys, permissions, identity changes or service operations.

Focused notification suites:74/74 passed. Fresh final synchronized source suite:
**3017/3017 passed**, zero failures, exit0 (67,153ms). Syntax and whitespace
checks passed. Existing actual-app browser fixture rerun:84/84,
zero pageerrors, AR/EN runtime strings and320/390/768 widths. No live account or
push sent. Same external evidence names as Inbox-Reconnect; added red/full logs
`artifacts/inbox-receipt-scope-20261030-red.log` and `-full.log`.

Native-runtime/index/sw mirrored selectively; cachev641. No compile or native
delivery. Physical device, server replication, responsive image transformation,
import jobs and backup/monitoring stages remain separate, not silently closed.

[[systems/Community-Notifications]] | [[09-Data-Contracts]] |
[[13-Project-Story]] | [[14-Feature-Coverage]] | [[15-Work-Control]]
