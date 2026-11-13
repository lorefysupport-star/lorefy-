---
kind: session
status: source-browser-verified-targeted-service-deployed-device-pending
date: 2026-11-13
---
# Persistent inbox, server mentions and bounded Push

The owner requested a redesigned inbox and mentions, and explicitly approved
the focused Supabase migration and existing Push sender repair after testing.
No native build, secret change or synthetic production alert was authorized or
performed. See [verification and rollout](../../docs/NOTIFICATION_STUDIO_V714.md).

The shared notification-center module owns categorized, keyed DOM presentation;
native-runtime owns authenticated snapshots, realtime and read receipts. Older
pages use a validated timestamp/UUID cursor. Read-all is bounded in200-ID batches;
older-row read updates no longer leave a stale badge. Read rows remain history.
Local chapter notifications remain visible under All/Unread rather than being
silently removed by the new interaction renderer.

Server mentions resolve usernames, not client recipient IDs. They respect actor,
parent-owner, privacy, self and duplicate boundaries; edits only add new mentions.
PGlite verified real trigger execution, replay safety and denied client grants.
The tested migration was applied and read-only trigger/constraint/index/RLS/
publication checks confirmed it. Push code matched the tested file before UI
deployment and the function's Overview reported a new deployment time.

Full3559 tests pass. Local browser evidence includes filters, live fixture events,
offline recovery, retained node identity, read history, AR/EN, theme variants and
320px non-overflow. New UI remains source-only until a later native/client release;
actual delivery, cold launch and system badge clearing remain device acceptance.
The displayed count covers loaded history; the Push payload uses server unread
total. Older pages are session-only; latest60 rows retain the existing offline cache.

[[systems/Community-Notifications]] | [[13-Project-Story]] | [[14-Feature-Coverage]]
