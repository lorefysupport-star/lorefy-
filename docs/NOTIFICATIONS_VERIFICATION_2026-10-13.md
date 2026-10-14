# Notifications: local fixes and live delivery blocker — 2026-10-13

## Live read-only findings

Queried the existing Lorefy Supabase project without generating interactions, changing accounts, registering devices, deploying functions, modifying secrets or running migrations.

- Review comments/reactions and community replies/likes have notification triggers; the notification inbox contains both comment and reaction events.
- `notifications` is in `supabase_realtime`.
- `dispatch_notification_push` is installed, the Vault webhook secret exists, and the deployed protected `dispatch-notifications` function is active (version 2).
- Six iOS production device registrations exist (aggregate only; tokens were not retrieved).
- Four recent webhook responses are HTTP 503 with `server_not_configured`, including 2026-10-13 08:02 UTC. In the deployed function this means one or more required server settings are absent. Supabase supplies its URL/service role internally; required APNs settings are `APNS_TEAM_ID`, `APNS_KEY_ID`, and `APNS_PRIVATE_KEY`. Their exact presence was not inspectable through the available connector.

Existing inbox/event logic is present; actual external delivery is not currently ready. This is an Apple Push server configuration issue, not evidence that the feature source was lost or that Windows prevented the database setup.

## Implemented canonical changes

`backend/lorefy-native-runtime.js` now:

- Shows themed, dismissible foreground alerts using the authenticated notification body, which includes the actor name from existing database triggers.
- Deduplicates realtime/push-refresh alerts; rejects self/other-recipient events.
- Clears inbox, badge and alert state on account changes, and ignores late requests from older sessions.
- Preserves realtime inserts arriving during the initial inbox fetch; preserves the inbox during temporary network failures.
- Refreshes on foreground return, bell opening and a 30-second foreground fallback.
- Supports English bell labels, LTR notification lists and English elapsed-time labels.
- Carries a validated community post ID from database or native APNs payloads into navigation; cold-launch navigation uses the existing `openThreadById` fetcher.
- Retains the native token for authenticated account rebinding, respects opt-out and unregisters the native device even if server cleanup fails (while surfacing cleanup failure).

Capacitor foreground presentation uses `badge` / `sound`; Lorefy supplies its own foreground banner to avoid displaying both an OS banner and an app banner. Background APNs alert display is separate and still uses the existing server `aps.alert` payload. Background network delivery remains unverified and blocked by live configuration.

Canonical source was updated first, then `tools/prepare-ios-web.mjs` and Capacitor `copy ios` regenerated shipped assets and configuration. Cache version updated. No app installation, upload, push, merge or deployment was performed for this task; `archives/` and `build34/` are unchanged.

## Verification

- Full JavaScript suite: **1,072 passed, 0 failed**. Corrected an already stale decoration test harness after the earlier shop component added a state hook; no decoration behavior changed in this task.
- New behavioral tests exercise actor text, duplicate prevention, account isolation, logout clearing, stale-response rejection, realtime/fetch overlap, temporary failures, payload routing, opt-out and denied permissions.
- Browser: real runtime rendered named like/comment alerts, unread badge, Arabic RTL / English LTR, no horizontal overflow, and Mark all as read. Events were generated only in a disposable in-memory QA fixture at `/qa/notifications-delivery-check.html`; this is not evidence of live APNs delivery.
- iOS simulator: Xcode Release build succeeded at `/tmp/lorefy-notifications-ios/Build/Products/Release-iphonesimulator/App.app`. Compilation is not a physical-device or live-delivery test. No simulator installation was performed here.

## Remaining owner setup

1. In Apple Developer, create/download a private key with APNs enabled for the Lorefy team/app. Keep the `.p8` file outside GitHub and the application bundle. Record its Key ID and the Apple Team ID.
2. With explicit authorization to configure the live service, set `APNS_TEAM_ID`, `APNS_KEY_ID`, `APNS_PRIVATE_KEY` securely in Supabase Edge Function secrets. Confirm `APNS_BUNDLE_ID=com.lorefy.app` and the correct environment. Preserve the existing webhook secret; do not replace it without synchronizing its Vault counterpart.
3. Test on two authorized test accounts and a physical iPhone: like, comment, foreground, background/locked, terminated app, notification tap, opt-out, and account switching. Record APNs acceptance separately from actual device display. Do not mutate production accounts for the test.

References: [Apple APNs authentication](https://developer.apple.com/help/account/capabilities/communicate-with-apns-using-authentication-tokens/), [create a private key](https://developer.apple.com/help/account/keys/create-a-private-key/), [Capacitor Push Notifications](https://capacitorjs.com/docs/apis/push-notifications), [Supabase Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes).
