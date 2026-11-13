# Notification retest - 2026-11-13

Scope: source, controlled local browser fixtures, and read-only production
inspection. The owner explicitly declined a real test send. No notification,
interaction, device token, secret, production schema or function was changed.
No native build or installation was performed.

## Results

| Layer | Fresh verification |
| --- | --- |
| Focused regression suites | 130 passed, 0 failed |
| Full application suite | 3560 passed, 0 failed |
| Generation | Executable local Postgres tests cover likes, comments, nested replies, follows and mentions |
| Isolation | Local session races, denied writes, self/block and duplicate suppression pass |
| Inbox browser | New fixture event appears, filters work, mark-all retains history, offline preserves rows and recovery clears error |
| Continuity | Unchanged refresh and clock advance retain the same row; no text/icon subtree replacement is needed for time alone |
| Production configuration | Owner RLS, Realtime publication, three mention source tables and enabled Push hook confirmed |
| Production RLS behavior | Inside a rolled-back transaction, the authenticated role saw six own rows and zero foreign rows |
| APNs sender | Local transport tests cover actual badge count, read-before-send skip, timeout, per-device failure and invalid token handling |

## Found and Fixed

The inbox cached row rendering by notification content and language. The relative
time was updated only when that signature changed, so an unchanged notification
could keep saying `1m ago` after later refreshes.

A new failing regression reproduced `1m ago` remaining instead of `4m ago`.
The renderer now updates just the relative-time text and accessible label when
they differ, retaining the button, content and icons. A controlled browser clock
advance changed the visible first row from one minute to six minutes while its
node remained connected. The fixture's refresh measurement now uses the node
immediately before that refresh rather than an obsolete startup-cache row.

The module has a fresh asset query key and matching copies in both existing iOS
web bundles. This is not an installed-client update.

## Production Transport Limits

At approximately11:42UTC, read-only aggregates showed15 stored notifications in
the preceding24 hours and13 retained responses matching the sender's result
format. All13 were HTTP202, with no positive APNs delivery count, no positive
unavailable count, and no retained network timeout/4xx/5xx in that sample.

The latest response and notification in that sample were on November12 at23:43UTC,
before the November13 sender rollout. These are historical observations, not
evidence that the newly deployed sender delivered to Apple or the phone. Current
device registration counts cannot prove which tokens existed at a past send.
No real event was generated to fill that evidence gap, as requested.

Remaining: real APNs acceptance, on-device display/tap/cold launch and badge
clearing. The authenticated-role SQL check is a database-policy test, not an
end-to-end OAuth, signed JWT or two-device acceptance test.
