# Native authentication recovery - Build 32

Date: 2026-10-01.

## Observed failures

- Tester screenshot shows Safari attempting to open 127.0.0.1 after authentication.
- Live Supabase Site URL was http://127.0.0.1:8002/. The explicit native callback was already allowlisted.
- Native provider bridges waited for a complete cloud pull before reloading the authenticated app, which repeated that pull at boot.
- Apple also awaited an optional authorization-retention Edge Function before completing login.
- The base backend could execute web OAuth inside the native shell when the provider bridge was not available. Google explicitly fell back to that path if its client was not initialized.
- Logs for the previous 24 hours contained 34,377 /logout 403 Session not found events and 18,151 /user 200 events. These aggregate logs do not establish that every event came from a tester, or identify each screenshot's exact path.
- The iOS config requested an unsupported https local scheme. Capacitor normalizes unsupported WKWebView schemes back to capacitor. Auth assumed crypto.subtle.digest was always present, which is not a valid assumption for custom-scheme WebViews. The no-WebCrypto Apple regression failed before the fix; the shipped Supabase SDK falls back to plain PKCE in this environment.

## Changes

- Updated the live Supabase default Site URL to com.lorefy.app://auth/callback. Preserved the existing exact callback allowlist; did not enable broader wildcard redirects or weaken authentication.
- Native web OAuth fallback now fails closed with a retryable user-facing error rather than sending an iPhone to a local web URL.
- Cold-launch Google callbacks wait for the client to initialize. PKCE exchange remains single-flight and requires a real session/user before handoff.
- Removed redundant cloud hydration from both native provider completion paths. Boot continues to hydrate the correct account before showing its UI.
- Apple persists its one-time authorization code in Keychain, then registers it server-side after startup. The pending code is owner-bound, expires after four minutes, and is removed only after registration or expiry. Temporary registration errors do not discard the authenticated session.
- Supabase network requests abort after 15 seconds. Concurrent session verification shares one request. Signed-out checks do not call /user or /logout. Invalid-session cleanup is idempotent.
- Updated auth asset versions and offline cache version; prepared build number 32 in both app and native configurations.
- Added an explicitly registered native authentication hash plugin using Apple's CryptoKit SHA256, and selected the supported capacitor local scheme. Apple nonce hashing works without WebCrypto. Google upgrades any plain SDK challenge to native S256 before opening the provider, without changing the stored verifier or weakening PKCE.

## Verification

- Regression failures were reproduced before implementation for the native web fallback, duplicate checks, missing-session logout requests, and provider completion blocked on cloud work.
- Targeted native/backend tests passed, including the shipped Supabase SDK with the raw Keychain adapter, Google PKCE exchange, Apple token exchange, and persisted-session restoration.
- Cloud configuration screenshot: artifacts/auth-url-fixed-20261001.png.
- Signed physical-device acceptance remains required: new Google account, existing Google account, Apple with hidden email, cancellation/retry, cold launch after provider return, relaunch, and account switching. Simulated provider responses do not verify Apple/Google production credentials or operating-system UI.
- Build/upload status is recorded separately when a fresh receipt is available. Source changes do not retrofit build 31.

## Build receipts

- Final source synchronization succeeded with all seven existing Capacitor dependencies, plus the explicitly registered app-local CryptoKit plugin.
- Full suite after the native hashing fix: 495 passed, 0 failed. `git diff --check` passed.
- Initial EAS build 32 candidate `32f9f91f-7064-436b-b97c-cad83187e4d6` finished before cancellation could take effect. It was NOT submitted to Apple and must not be distributed; it lacks the native hashing fix.
- Corrected EAS build 32 candidate: `41704605-d82e-4804-8365-ab03f20fbd90`. Source upload accepted. Receipt: https://expo.dev/accounts/lorefy/projects/lorefy/builds/41704605-d82e-4804-8365-ab03f20fbd90 .
- Corrected build finished at 2026-10-01T16:40:18.784Z. Downloaded signed IPA: `artifacts/Lorefy-build32.ipa`; SHA256 `a49c4a958a6df232f93d15021caef7b15006e5940b2fcdbada93963185492798`.
- Inspected the actual IPA: bundle `com.lorefy.app`, version `1.0`, build `32`, supported `capacitor` local scheme, native CryptoKit plugin and bridge controller in the compiled executable. Bundled authentication JavaScript and index hashes match the synchronized source.
- Apple submission started for the corrected build only: `f6296fdf-5ae8-4184-80ca-63072bd1c463`. Receipt: https://expo.dev/accounts/lorefy/projects/lorefy/submissions/f6296fdf-5ae8-4184-80ca-63072bd1c463 . Distribution and physical-device acceptance are not implied by successful upload.
- Latest verified submission UI: `Queued Free Tier Queue`, with no submission logs yet. Apple still lists build 31, not 32. The local CLI wait was interrupted without issuing a cloud cancellation. The remote submission remains queued; successful delivery, Apple processing/compliance, and device acceptance are still unverified.
