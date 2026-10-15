---
kind: session
status: configured-delivery-unverified
date: 2026-10-14
---
# APNs Server Configuration

Date: 2026-10-14
Source commit: f2eeedb
Working-tree changes: pre-existing build, runtime and memory changes preserved; no application source or deployment changed in this task.
User-requested scope: save the supplied APNs key in Lorefy server secrets only, leaving all unrelated secrets unchanged.

## Work Completed

- Saved APNS_PRIVATE_KEY and APNS_KEY_ID in the existing Supabase project qsroxmltioxqozmykens.
- Confirmed existing APNS_TEAM_ID, APNS_BUNDLE_ID and APNS_ENVIRONMENT match the supplied team, com.lorefy.app and production. Left these values unchanged.
- Verified the local key parses as PKCS8 EC P-256 and its SHA256 digest matches the saved secret.
- Confirmed PUSH_WEBHOOK_SECRET was unchanged. No key content was added to repository files, logs or this vault. No GitHub push, migration or function deployment was performed.

## Verified Results

- Inspected deployed dispatch-notifications version 3 and its required environment names.
- Sent an authenticated readiness probe through the existing database webhook credential, using all-zero notification and user UUIDs after checking both notification and device lookups were empty.
- pg_net request 202 returned HTTP 404 with notification_not_found, no timeout and no transport error. The handler passed authentication and required-configuration checks. No notification row was inserted and no real device received a test message.
- Focused command: `node --test tests/notification-delivery-runtime.test.js tests/native-notifications-links.test.js`; 14 passed, 0 failed.
- Source references: [dispatcher](../../supabase/functions/dispatch-notifications/index.ts), [webhook migration](../../supabase/migrations/20260830083000_push_dispatch_webhook.sql), [previous report](../../docs/NOTIFICATIONS_VERIFICATION_2026-10-13.md).

## Open Issues and Next Action

The historical server_not_configured result is superseded by this configuration check. The 404 probe does not execute JWT signing or contact Apple. APNs acceptance and actual background delivery to a physical TestFlight iPhone remain unverified and require a separate delivery test.

## Durable Notes Updated

[[10-Open-Questions]] and [[systems/Community-Notifications]] distinguish server configuration from verified delivery.

[[00-Home]] | [[03-Working-Agreement]]
