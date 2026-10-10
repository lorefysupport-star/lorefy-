# Build 34 readiness

Date: 2026-10-09

## Included

- 3 original Lorefy bundles and all 24 PFP Vibes prototype bundles.
- Every bundle has avatar frame, profile page frame and animated effect.
- Complete imported artwork is copied byte-for-byte into launch/decorations/pfpvibes.
- Original owner banner remains unchanged when decorations are applied.
- Beta opt-in uses normal owner-scoped decoration storage and cloud sync.
- Public artwork projection allows all 27 known IDs with existing account visibility, block and owner checks.
- QA fixtures and fictional users are excluded from EAS upload and native runtime entries.
- Build number 34 matches app.json and both native Xcode configurations.

## Verification

- Full suite: 985 passed, 0 failed (qa/build34-tests.txt).
- Native packaging and beta-decoration focused suite: 18 passed, 0 failed.
- Capacitor iOS sync completed with all eight native plugins.
- Native runtime contains betaProfileDecorations=true and all 24 overlays plus manifest.
- Native web entry opened at the sign-in screen with no browser error logs.
- Local isolated test account: applied Maple Drift, reloaded, retained all three components.
- Animation counters advanced from 2 to 301; no browser error logs.
- Arabic followers, reader navigation and complete public library opened correctly; all nine library images loaded.
- Database projection contains 24 additional IDs; anon execution denied, authenticated execution allowed. Unauthenticated projection returned null.

## Limits

- Browser checks and automated tests do not prove absence of native iOS crashes.
- Native Apple/Google login, photo permissions, push delivery, background resume and memory behavior still require a physical-device TestFlight run.
- The website Apple OAuth endpoint reports missing OAuth secret. The native Apple flow uses ID tokens and was not exercised on hardware here.
- Existing privacy-nutrition and content-rights verification gates remain false. The user explicitly requested a beta upload despite these outstanding items. This is not a public App Store readiness claim.
- PFP Vibes releaseAllowed metadata remains false; inclusion is explicit beta opt-in, not a claim of a verified distribution license.
- Existing database advisories are not treated as new regressions. Review guidance: https://supabase.com/docs/guides/database/database-linter

## Build and submission

- EAS build: 29797ce0-a6f0-488b-afb8-7cb66c5b1f6d
- EAS submission: 51b3647f-1e11-46af-96bd-23b363af9121
- Initial auto-submission scheduling rejected the optional TestFlight changelog (Enterprise-only). The same build was scheduled successfully without that optional field; no duplicate build was created.
- Final EAS build status: FINISHED, 2026-10-09T17:05:28Z.
- Final EAS submission status: FINISHED, 2026-10-09T17:05:44Z. App Store Connect accepted the binary; Apple processing is separate from this upload success.
- Build details: https://expo.dev/accounts/lorefy/projects/lorefy/builds/29797ce0-a6f0-488b-afb8-7cb66c5b1f6d
- Submission details: https://expo.dev/accounts/lorefy/projects/lorefy/submissions/51b3647f-1e11-46af-96bd-23b363af9121
- Downloaded final signed IPA (70.57 MB): confirmed native runtime build 34, beta decorations enabled, all 24 manifest entries and corresponding images present, zero public/qa files.
