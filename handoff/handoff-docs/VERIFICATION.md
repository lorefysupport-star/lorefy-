# Fresh Handoff Verification

Date: 2026-10-10. Checks were performed on the copied project, not by changing the original application.

- Dependency install: `npm ci --ignore-scripts`, exit 0. 107 packages installed. Installed `node_modules` is verification-only and is not archived.
- Full suite: `node --test --test-reporter=tap --test-concurrency=1 tests/*.test.js`, Node v24.16.0 on Windows. 985 tests passed, 0 failed, 0 cancelled, 0 skipped, 0 todo. Latest duration 60,771.8092 ms. See `verification/test-result.json` and full `handoff-tests.txt`.
- EAS build configuration remains Node 22.14.0; this fresh local test run was on v24.16.0 and is not a fresh EAS/Xcode rebuild.
- Signed IPA CRC passed. Info.plist confirms build 34 and bundle com.lorefy.app. All 489 current native public files match the IPA. All 24 imported overlays are present. Native public contains no QA directory entries.
- Live Supabase inventory and all five deployed function sources were obtained read-only. No production data/configuration was mutated or user rows exported.
- File-copy SHA-256 checks passed for 5,918 source/media/supplemental files. Final ZIP CRC and per-member SHA-256 outcomes are recorded only after archive creation in `DELIVERY_MANIFEST.json`; each archive carries its own `ARCHIVE_MANIFEST.json`.
- Secret-pattern review and explicit exclusions are recorded. Two catalog URL-slug false positives were reviewed and restored unchanged. This is not an exhaustive secrets/security audit.
- Fresh npm audit found 4 affected dependency entries (2 critical, 2 high). See `KNOWN_GAPS.md`; no upgrade or fix is claimed.

No physical iPhone run, Apple processing refresh, new build/upload or destination account receipt occurred during this handoff. Passing JavaScript tests do not establish no native crashes or successful reauthorization on the new computer.

## Destination Acceptance

1. Match each ZIP SHA-256 to `SHA256SUMS.txt`/`DELIVERY_MANIFEST.json` before extracting.
2. Extract project and media archives into the same empty folder and preserve the relative layout.
3. Compare extracted files to each `ARCHIVE_MANIFEST.json`. Identically named archive manifests are archive-specific; inspect them inside each ZIP rather than assuming one overwriting the other describes both archives.
4. Confirm signed IPA SHA-256 and build number; retain it unchanged.
5. Open the extracted root in Codex with the new account, read handoff guidance, install dependencies and run tests.
6. Start the local API server and verify the normal phone preview, Arabic/English language, representative decorations and library/community/profile navigation.
7. Reauthorize the existing services manually, then verify safe read-only access to the intended projects before any mutation.
8. Establish a new working baseline without replacing the snapshot with the old Git HEAD. Record any changes made after import.

Only then report the destination transfer as accepted. Local packaging success alone is not destination receipt.
