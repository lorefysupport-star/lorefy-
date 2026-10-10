# Build 34 Provenance

Verification date: 2026-10-10. No new build or upload was performed.

## Signed Artifact

- File: `build34/Lorefy-build34.ipa`
- Bytes: 73,994,237
- SHA-256: `d876366302c741c8cee52dfe9fd051aa41411a4f1410632c0cc057773de2bbba`
- Info.plist bundle: `com.lorefy.app`
- Native version: `1.0`; build: `34`. Expo metadata has version `1.0.0`; do not confuse display-version formatting with the verified build number.
- ZIP CRC verification passed.
- Native `public` files: 489.
- All 24 imported collection records have their corresponding overlays in the IPA; beta decorations are enabled; there are zero `public/qa` entries.

## Local Native Match

Every one of the 489 current `ios/App/App/public` files matched the IPA by SHA-256. There were no different, missing or extra files. The generated `ios-web` tree matched 487 files, with only the two expected Capacitor-added `cordova.js` and `cordova_plugins.js` files absent before native copy. No content differences were found.

This proves the preserved native web bundle matches the signed artifact. It does not prove every developer-side tool/test/doc was present at the time of the build, reproduce Apple's signing process, or test physical device behavior.

## Source Snapshot

The actual current application filesystem is preserved, including untracked features/tests/assets and the actual nested legal site files. Last HEAD is `1fa902e0983751523408cb0c0fd85104a1290799`, an older build6-era commit, not the latest application version. See `verification/source-git-state.json` for read-only captured status/history/remote data.

Git metadata/history and dependency caches are not bundled; this is a portable filesystem snapshot. Do not overwrite it with that old HEAD. For subsequent version control, retain this snapshot and deliberately reconcile/import it in a new working repository rather than blindly copying files over a stale remote checkout.

`verification/copied-file-manifest.json` records each copied file's size and SHA-256. Packaging verifies those snapshot hashes again and verifies every archive member against its internal `ARCHIVE_MANIFEST.json`. `DELIVERY_MANIFEST.json` and `SHA256SUMS.txt` record the final archive hashes. Check those files for actual packaging outcomes, not estimates.

## Historical Receipt

`project/Lorefy-clean-app/docs/BUILD34_READINESS.md` records the EAS build and submission FINISHED statuses, asset/native smoke checks and explicit limitations. It is preserved unchanged. Its recorded Apple acceptance is not a fresh current TestFlight processing check.

Older prototype documentation states that imported decorations are QA-only/excluded from native release. Build 34 supersedes that inclusion scope: all 27 collections are in the beta runtime with ordinary owner-scoped persistence/public projection. Historical rights gates still apply; inclusion is not licensing proof.
