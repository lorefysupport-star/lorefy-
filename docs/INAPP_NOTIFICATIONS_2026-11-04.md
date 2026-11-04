# In-App Notification Delivery

## Implemented

- In-app receipts for review Like/heart/Dislike, post/reply Like/Dislike,
  comments, replies to comments, replies to posts and follows.
- Both thread/review owner and the addressed comment author receive a receipt
  when different. The actor never receives their own notification.
- Server-validated reply context, same-thread and visibility checks; client
  supplied usernames are not trusted. Blocked pairs are excluded.
- Persistent server inbox with owner-only read access. Marking read does not
  delete history; duplicate reaction/follow events do not create repeated rows.
- Bounded cached metadata retains destinations and localized actor copy.
  The unread indicator follows the selected theme, including pink.
- Follow targets the actor's profile; review targets fetch the exact review
  rather than waiting for it to appear in the newest timeline page.
- Private bookmarks/saves do not notify another person. A public work rating
  is not an interaction with another reader and does not notify all followers.

## Verification

- Failure-first tests reproduced metadata loss, missing comment recipients,
  discarded reply context, cross-thread targets, missing Dislike receipts,
  blocked notifications, old-review opening and fixed-purple styling.
- Nine isolated PGlite tests execute the actual notification/community SQL,
  including RLS, read receipts and migration repeatability. PGlite is dev-only;
  it is not added to application assets or run against production data.
- Full Node suite on the notification-only publication snapshot:
  **3383 passed, 0 failed**. The earlier3396 result included unrelated local
  development changes and is not the publication acceptance count.
- Local Playwright: Arabic dark390, English light320, Arabic pink320,
  English dark768. Three received notifications, duplicate/self/wrong-owner
  suppression, unread/read history, restart offline, actor-profile opening,
  no horizontal overflow, row hit targets at least44px, no page errors.
  Delivery is injected locally for deterministic UI tests, not claimed as live
  cross-account acceptance.
- Artifacts outside the app: `output/playwright/notifications-v693/` in the
  parent workspace. Publication browser results: `output/playwright/notifications-publish/`;
  fresh full log: `output/notifications-publish-tests.log`.

## Supabase

The owner explicitly approved the focused update after isolated testing.
Dashboard inspection confirmed five interaction triggers, owner SELECT policy
and realtime publication. The transaction in
`supabase/migrations/20261104120000_notification_interaction_delivery.sql`
was applied through SQL Editor to the existing Lorefy project. It returned
success; a subsequent catalog query confirmed all seven function updates.
This was a manual SQL deployment, not a migration-history replay or a claim
that a CLI migration-history row was created.

No real-user test post, notification, reaction or follow was inserted; no
APNs credentials, grants to public inbox writes or native settings changed.
The backend applies to new interactions immediately. Existing stored rows
were retained, not rewritten or resent.

## Delivery Limits

The five edited web assets are mirrored to `ios-web` and `ios/App/App/public`;
cache ID is `lorefy-v693-inapp-interactions`. No native build or Apple upload.
The owner subsequently requested a GitHub checkpoint. Its source snapshot is
isolated from unrelated local design/Halloween/share changes and was tested
independently before publication. Other local work is preserved.
The updated UI remains local: installed native clients need a separately
authorized release for new navigation/localization changes. Production event
acceptance between two real accounts and physical-device display remain
pending owner feedback. Notification history currently displays the latest60
rows; older records remain in the database but pagination is not added here.
