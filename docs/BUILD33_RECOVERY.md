# Build 33 recovery

Date: 2026-10-01.

## Changes

- Preserves build 32 native Apple/Google authentication recovery.
- Completed works contribute known catalog chapter/page/volume totals to the current account's derived reading metrics. Unknown totals fall back to explicit progress. Reading time uses chapters, else pages, else volumes; it does not add overlapping representations.
- Uses Capacitor Camera's native photo-library picker to deliver resized, orientation-correct JPEG files to the existing image-input handlers. Browser file inputs remain unchanged.
- Character image persistence reports storage failures, permits selecting the same file again, and includes custom images in the account-owned sync keys. Profile media replacement no longer advertises a one-hour cache lifetime.
- Dark surfaces use neutral black/gray tokens with teal reserved for accent controls.
- Native push enrollment is single-flight, retries a pending device token after authentication, respects explicit opt-out, and does not record permission denial as enabled.

## Verification and limits

- Final full test suite: 501 passed, zero failed. iOS assets synchronized; git diff --check passed.
- Production dependency audit: zero vulnerabilities.
- Browser demo verified completed-work metrics (3 completed works, 1776 chapters, 355 estimated hours), neutral dark profile/discover, and character image replacement. The test image was restored to the automatic image afterward.
- Physical iOS authentication, native photo selection, and remote delivery still require device acceptance. Mocked provider and native-picker tests are not a physical-device test.
- Public profile RPC metrics were inspected but not migrated in this change; they still use explicit server-side progress. The completed-work fix applies to the account's local derived metrics.
- Live push dispatch returned server_not_configured (503); no registered device tokens were present at inspection. The owner has no APNs p8 key. Actual outside-app delivery is blocked until Apple Push credentials are created and securely configured on the server. No credential was created or server secret changed, and no delivery success is claimed.

## Signed artifact and submission

- EAS build: 7203cf27-2ee0-48e4-b13d-09c1e203b8c1, FINISHED.
- Bundle com.lorefy.app, version 1.0, build 33; native auth hashing and Camera plugins present in the executable.
- Bundled native-photos, native-runtime, reading-metrics, and design-system hashes match source.
- IPA: artifacts/Lorefy-build33.ipa.
- SHA256: e18c3847a5973449fa45f93e99380e48818750829a3868f47aca6bbfac89e5e2.
- Submission scheduled: a550ec96-5b32-4f9e-b876-bf0d2a68ce96.
- Receipt: https://expo.dev/accounts/lorefy/projects/lorefy/submissions/a550ec96-5b32-4f9e-b876-bf0d2a68ce96.
- A scheduled submission does not establish Apple processing, TestFlight availability, tester distribution, or device acceptance.
