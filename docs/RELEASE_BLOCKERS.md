# Lorefy Release Gate

Latest verification update: 7 October 2026. Historical release evidence below is from 21 September unless explicitly updated.

## Current beta repair gate

The review collection, username changes, review privacy repairs and exact-ID AniList relationships are implemented; the latest run passes 749 automated tests with zero failures, skips or cancellations (70.528 seconds). Writer-role metadata now distinguishes the author from the original creator/illustrator, with exact-ID, narrowly scoped credit correction and browser reload verification. Earlier rollback-only SQL checks passed for the deployed `profile_username_changes` and `review_account_privacy` migrations. Source and derived iOS assets were synchronized and SHA-256 checked after the final code change. AniList relationship support does not cover all book/comic series or certify a complete reading order. See `docs/DISCORD_STATUS_RECONCILIATION_2026-10-07.md` for current evidence and remaining work.

This is not approval for a 9/10 readiness claim or a public release. Real-device Google/Apple authentication, account-to-account persistence/artwork, native external sharing, APNs configuration/delivery, catalog quality/rights and complete accessibility/theme/localization acceptance remain open. No new IPA was uploaded in this repair pass.

The latest diary/feed localization follow-up passes **768/768** tests with zero failures, skips or cancellations (77.023 seconds). The browser reopened successfully: the English review editor, reading diary, note/quote modes, session picker, Following empty state and chapter comment controls were verified without posting or deleting content. Diary directions, dates, durations and captions now localize directly while preserving private notes, quotes and source titles. Spoiler controls retain focus using stable identifiers. Source and derived iOS assets match after preparation and copy; cache is `lorefy-v368-diary-feed-language`. The actual browser viewport was 422x788; requested overrides did not change it, so this pass does not certify desktop or 390px layouts. Some legacy surfaces still rely on delayed DOM translation and some legacy review reaction buttons need clearer accessible names. See the latest section of `docs/BETA_REPAIR_VERIFICATION_2026-10-07.md` for proof and open gates.

The code, database policies, Edge Functions, legal pages, and iOS bundle are prepared. Do not upload a new TestFlight build until every unchecked item below is complete.

## Account providers

- [x] Release configuration requires Google and Apple and disables Email authentication.
- [x] Native Google OAuth uses PKCE and returns through the Lorefy app callback.
- [x] Native Apple sign-in registers the one-time authorization code for later revocation.
- [x] Account deletion revokes the stored Apple authorization before deleting the user.
- [ ] Test first Apple sign-in, repeat sign-in, and account deletion on a real iPhone.

The deployed `apple-authorization` function exchanges the one-time Apple authorization code and stores the refresh token encrypted. The deployed `delete-account` function revokes that token before deleting the Supabase user.

## App Store Connect

- [ ] Enter the privacy answers from `docs/APP_PRIVACY_ANSWERS.md`.
- [ ] Enter the reviewer instructions from `docs/APP_REVIEW_NOTES.md`.
- [ ] Set the support URL to `https://lorefy-help.m-a-f-sh10.chatgpt.site/support/`.
- [ ] Set the privacy URL to `https://lorefy-help.m-a-f-sh10.chatgpt.site/privacy/`.
- [ ] Resolve the content rights audit in `docs/CONTENT_RIGHTS_AUDIT.md` before marking rights verified.
- [x] Update the TestFlight marketing URL, privacy policy URL, and beta review instructions for the required Google/Apple account flow.

## Verified in this release candidate

- 353 automated tests pass.
- The bundled catalog plus the lazy API baseline remains above 22,000 canonical works.
- Google and Apple native authentication contracts pass the automated release suite. A real-device acceptance pass is still required before launch.
- Profile blocking, server-owned review publishing, and private review-media path policies passed a live transactional smoke test with rollback.
- `review-media`, `profile-media`, and `custom-covers` are private and limit MIME types to JPEG, PNG, and WebP.
- Legal pages are publicly reachable and include privacy, support, terms, community rules, and source attribution.
- The prepared iOS welcome screen keeps Google and Apple visible at 390x844 and 375x667.
- Native Supabase sessions use iOS Keychain through `@aparajita/capacitor-secure-storage`.
- Native authentication now fails closed if the Keychain plugin is unavailable; it cannot silently fall back to web storage on iOS.
- Community mutations use real Supabase UUIDs, inherit blocking/privacy rules, and serialize per-user quotas.
- Account deletion blocks racing uploads before private media cleanup and auth deletion.
- Supabase Edge Functions `apple-authorization` v4 and `delete-account` v10 are active with JWT verification.
- Review publishing now enforces at most 10 unique images and verifies every path exists in the private `review-media` bucket; migration `20260813214432_review_media_integrity` is active.
- Review reactions are serialized and rate-limited per signed-in reader; migration `20260813221522_reaction_rate_limit` is active.
- Apple authorization codes are accepted only when the verified Apple identity-token subject matches the Apple identity linked to the signed-in Supabase user.
- Account deletion now requires a recently authenticated session before private media and the auth identity can be removed.
- Account deletion bounds private-media traversal and Apple revocation requests, while the local catalog proxy rejects untrusted browser origins.
- The release configuration records Google `enabled`, Apple `enabled`, and Email `disabled`.
- A live rollback-only smoke test verified review publishing, comments, reactions, reports, and valid private image paths; invalid extensions and cross-user paths were denied.

## Build decision

The code and native bundle are ready for a TestFlight candidate. Final App Store submission remains gated by the privacy-label confirmation, the real-device authentication acceptance pass, and the content-rights decision that is intentionally deferred.
