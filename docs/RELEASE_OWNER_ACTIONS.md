# Lorefy Release Owner Actions

This document records the actions that cannot be proven or performed by the application source code. Do not change the corresponding flags in `config/lorefy-release.json` until the action has been completed in the production account.

## Current release gate

`npm run apple:audit:strict` intentionally blocks this release while these items remain `false`:

| Config field | Owner action |
| --- | --- |
| `appReview.emailProviderDisabled` | Disable Email/Password sign-in in the production Supabase project. |
| `appReview.privacyNutritionLabelVerified` | Complete and verify App Privacy for the exact released build in App Store Connect. |
| `appReview.contentRightsVerified` | Record and approve redistribution rights for every non-user-owned catalogue image, cover, and text source. |

## 1. Restrict sign-in to Google and Apple

The production app exposes Google and Apple as its supported entry points. The Email provider must not remain available through a direct Supabase Auth request.

1. Sign in to the production Supabase project.
2. Open **Authentication -> Sign In / Providers**.
3. Open **Email** and turn off email/password sign-in, then save.
4. Confirm that **Google** and **Apple** stay enabled and retain their native redirect configuration.
5. Set `appReview.emailProviderDisabled` to `true` locally and run `npm run apple:audit:strict`.

If email/password sign-in is ever brought back, require a strong password policy and leaked-password protection before enabling it. Supabase documents leaked-password protection as a paid-plan feature, so it is not a substitute for disabling an unused provider.

## 2. App Privacy declaration

The privacy label must be answered from the final build, production configuration, and every installed native SDK. The following is a **review worksheet**, not an App Store Connect declaration:

| Potential data category | Product use to verify | Release decision required |
| --- | --- | --- |
| Contact information | OAuth account email held by Supabase Auth | Declare only if retained or accessible by Lorefy. |
| Identifiers | Supabase user ID and public username | Mark linkage and purpose from the final implementation. |
| User content | Library state, lists, character ratings, reviews, comments, and reports | Review whether it is linked to the account and used for app functionality. |
| Photos / media | Optional profile avatar, banner, and review images | Declare the actual category and whether it is linked to the user. |
| Diagnostics | Redacted diagnostics remain on-device unless `LOREFY_MONITORING_ENDPOINT` is configured | Do not claim collection or tracking when no endpoint is enabled. |

Lorefy does not configure advertising tracking in `apple/PrivacyInfo.xcprivacy`. That does not replace the App Store Connect questionnaire. After checking all rows against the release build, complete App Privacy in App Store Connect and only then set `appReview.privacyNutritionLabelVerified` to `true`.

## 3. Content rights register

Network availability is not permission to redistribute media. Before public release, maintain a dated approval record for every source used by the catalogue and media proxy, including at minimum:

- AniList and Jikan / MyAnimeList metadata and images.
- MangaDex metadata and covers.
- Open Library and Google Books covers and metadata.
- Wikimedia, Wikidata, Wikipedia, Fandom, and any editorial or community source used for character data or images.
- User-uploaded profile, review, and shared media, which must remain governed by the Terms, reporting flow, and removal process.

For every source, record the exact API or asset terms, attribution requirements, commercial-use and caching limits, and the approved product use. Remove or replace any source without a clear redistribution right. After the register is approved, set `appReview.contentRightsVerified` to `true`.

## 4. Notifications and universal links

The app bundle contains the Capacitor push plugin, APNs registration forwarding, a protected notification inbox, realtime refresh, and strict Lorefy link parsing. Production delivery still requires credentials and public DNS that cannot be stored in source control:

1. Link this repository to the production Supabase project and apply `supabase/migrations/20260828204500_notifications_foundation.sql`.
2. Create an Apple Push Notifications authentication key for the same Apple Developer team as `com.lorefy.app`.
3. Set Edge Function secrets `APNS_TEAM_ID`, `APNS_KEY_ID`, `APNS_PRIVATE_KEY`, `APNS_BUNDLE_ID=com.lorefy.app`, `APNS_ENVIRONMENT=production`, and a random `PUSH_WEBHOOK_SECRET`.
4. Deploy `dispatch-notifications` with JWT gateway verification disabled. The function rejects every request that does not contain the matching `x-lorefy-webhook-secret` header.
5. Create a Supabase Database Webhook for `INSERT` events on `public.notifications`, target the deployed `dispatch-notifications` function, and send that secret header.
6. Make `lorefy.app` resolve over HTTPS and publish a valid `/.well-known/apple-app-site-association` file containing the real Apple Team ID plus `com.lorefy.app`. Include `/work/*`, `/review/*`, `/community`, `/notifications`, `/library`, and `/profile*`.
7. Enable Push Notifications and Associated Domains for the App ID and signing profile, then verify foreground, background, terminated-app, and notification-tap behavior on a physical iPhone.

The custom schemes `com.lorefy.app://` and `lorefy://` are already included for native callbacks and internal testing. Do not claim that public `https://lorefy.app/...` links are universal links until DNS and the association file are live.

## 5. Final owner check

After completing the three actions above:

1. Run `npm run apple:audit:strict` and require a zero exit code.
2. Re-run the released iOS build through Google sign-in, Apple sign-in, account deletion, profile media upload, review publishing, reporting, and logout.
3. Capture App Store screenshots only from that final build.
4. Preserve this document and the source-rights approvals with the release records.
