# Lorefy Release Gate

Last verified: 13 August 2026

The code, database policies, Edge Functions, legal pages, and iOS bundle are prepared. Do not upload a new TestFlight build until every unchecked item below is complete.

## Sign in with Apple

- [ ] In Apple Developer, enable **Sign in with Apple** for App ID `com.lorefy.app`.
- [ ] Create a dedicated Sign in with Apple private key associated with that App ID.
- [ ] Record its Key ID and the Apple Team ID, and download the `.p8` file once.
- [ ] Do not reuse `ApiKey_ZGVRDZNJF4IA.p8`; that is an App Store Connect API key, not a Sign in with Apple key.
- [ ] In Supabase Auth > Providers, enable Apple for project `qsroxmltioxqozmykens` with client ID `com.lorefy.app`.
- [ ] In Supabase Edge Function secrets, store `APPLE_CLIENT_ID`, `APPLE_KEY_ID`, `APPLE_TEAM_ID`, and `APPLE_PRIVATE_KEY`.
- [ ] Disable Email provider in Supabase Auth; production Lorefy supports Google and Apple only.
- [ ] Test first Apple sign-in, repeat sign-in, and account deletion on a real iPhone.

Access check on 13 August 2026:

- The App Store Connect session is `lorefysupport@gmail.com` with the App Manager role.
- Apple Developer rejected access to Certificates, Identifiers & Profiles. The Account Holder must enable that access or create the dedicated Sign in with Apple key.
- The open Supabase dashboard session only owns project `ihmavkhlpllqcnsiskep`; it cannot open the production Lorefy project `qsroxmltioxqozmykens`.

The deployed `apple-authorization` function exchanges the one-time Apple authorization code and stores the refresh token encrypted. The deployed `delete-account` function revokes that token before deleting the Supabase user.

## App Store Connect

- [ ] Enter the privacy answers from `docs/APP_PRIVACY_ANSWERS.md`.
- [ ] Enter the reviewer instructions from `docs/APP_REVIEW_NOTES.md`.
- [ ] Set the support URL to `https://lorefy-help.m-a-f-sh10.chatgpt.site/support/`.
- [ ] Set the privacy URL to `https://lorefy-help.m-a-f-sh10.chatgpt.site/privacy/`.
- [ ] Resolve the content rights audit in `docs/CONTENT_RIGHTS_AUDIT.md` before marking rights verified.
- [x] Update the TestFlight marketing URL, privacy policy URL, and beta review instructions for the required Google/Apple account flow.

## Verified in this release candidate

- 145 automated tests pass.
- The bundled catalog plus the lazy API baseline remains above 22,000 canonical works.
- Google OAuth reaches Google; Apple currently returns HTTP 400 because its Supabase provider is disabled.
- Profile blocking, server-owned review publishing, and private review-media path policies passed a live transactional smoke test with rollback.
- `review-media`, `profile-media`, and `custom-covers` are private and limit MIME types to JPEG, PNG, and WebP.
- Legal pages are publicly reachable and include privacy, support, terms, community rules, and source attribution.
- The prepared iOS welcome screen keeps Google and Apple visible at 390x844 and 375x667.
- Native Supabase sessions use iOS Keychain through `@aparajita/capacitor-secure-storage`.
- Native authentication now fails closed if the Keychain plugin is unavailable; it cannot silently fall back to web storage on iOS.
- Community mutations use real Supabase UUIDs, inherit blocking/privacy rules, and serialize per-user quotas.
- Account deletion blocks racing uploads before private media cleanup and auth deletion.
- Supabase Edge Functions `apple-authorization` v3 and `delete-account` v8 are active with JWT verification.
- Supabase Auth is currently Google `enabled`, Apple `disabled`, Email `enabled`; Apple and Email remain release blockers.
- A live rollback-only smoke test verified review publishing, comments, reactions, reports, and valid private image paths; invalid extensions and cross-user paths were denied.

## Build decision

The next EAS/TestFlight build is intentionally gated. Uploading now would ship a visible Apple button backed by a disabled provider and would fail the required account-deletion revocation path.
