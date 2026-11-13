# Notification Studio v714

Verified 2026-11-13. This is an application-source update plus the explicitly
authorized targeted Supabase rollout, not a native build or device certification.

## Product Behavior

- One persistent inbox for interactions, read history and existing local chapter
  alerts. All, Unread, Mentions, Replies, Likes and Follows use keyboard-accessible
  tabs; source content is rendered as text, never trusted markup.
- Theme-owned glass header, quiet category icons, unread indicators, refresh,
  recoverable offline state and on-demand older history. Reading does not delete.
- Rows retain their nodes on unchanged snapshots. Older history uses the stable
  timestamp/UUID cursor; duplicates and departed-account responses are discarded.
- Read updates from other devices cover older loaded pages as well as the head.
  Mark-all drains loaded history in batches of at most200 receipts. The displayed
  unread count describes loaded history, not an unbounded server-wide total.
- Notification links retain validated review/comment and root-post/reply IDs.
  A linked older standalone reply is shown separately from latest replies, so
  fetching its context does not skip or corrupt the normal pagination boundary.

## Mentions

`20261113055739_notification_mentions_inbox.sql` resolves canonical @usernames
on the server for public posts, reviews and comments, including newly added
mentions on edit. Email-like strings, unknown/self recipients and duplicate
names do not generate notifications. A source mentions at most20 recipients.

The existing private enqueue function remains responsible for owner/block and
event-key deduplication. Mention generation also checks the parent conversation
owner's block boundary. An ordinary direct reply and a mention to its same
recipient produce one receipt, not two. No historical backfill was executed.

## Authorized Production Rollout

Applied to the existing project through its authenticated dashboard after tests:

- The transaction completed with `Success. No rows returned`.
- Read-only verification found three distinct source tables with mention triggers,
  a kind constraint accepting `mention`, and the timestamp/UUID cursor index.
- Notifications remain in the Realtime publication and have RLS enabled.
- Authenticated clients cannot INSERT notifications or execute the private trigger.
- The existing `dispatch-notifications` Edge Function was updated. The staged
  source matched the tested file before deployment; Overview subsequently showed
  its new deployment time. Authentication prefix and environment-key references
  were preserved. No settings, credentials or secrets were changed.

The sender skips an already-read notification, derives the OS badge from the
actual unread count, and omits the badge if that optional count fails. Existing
bounded APNs transport, per-device failure isolation and invalid-token handling
are included in this deployment. No synthetic production alert was sent.

## Evidence

- Full `npm test`: **3559 passed, 0 failed**, including executable PGlite trigger
  checks, session/pagination/read races and dispatch tests with mocked APNs.
- Browser: real application inbox mounted; fixture covered unchanged-node
  retention, filters, mark-all retaining five read rows, live new mention,
  offline/recovery, AR/EN and dark/light/pink. Emulated320px DOM measurements
  returned clientWidth=scrollWidth=frameWidth=320, without horizontal overflow.
- Controlled visual fixture: `qa/notification-studio.html`. Its transport and
  readers are synthetic; it never sends to Supabase or Apple.
- Selective root assets match both existing iOS web copies. This does not compile
  or install a binary. Cached offline history remains bounded to the latest60;
  older history is fetched on demand in the active authenticated session.

## Remaining Acceptance

The new inbox UI requires this web source to reach an installed client through a
later authorized release. End-to-end APNs delivery, native cold launch, device
badge clearing after read, and all permission states need a physical-device test.
Apple/OS permission and Focus settings remain authoritative. No claim that every
push will arrive or that this reproduces Lootd's private backend is made.

Lootd reference observations were limited to its visible persistent history,
category filtering, refresh, mark-read and older-page controls. No reference
account settings or interactions were changed.
