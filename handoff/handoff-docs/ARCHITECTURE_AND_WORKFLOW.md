# Architecture and Workflow

Snapshot date: 2026-10-10. Authoritative application root: `project/Lorefy-clean-app`.

## Technology and Files

This is an HTML/CSS/JavaScript web application using vendored React/ReactDOM and JavaScript modules, packaged with Capacitor 8 and a small native Swift iOS shell. Expo metadata and EAS support cloud building and submission; they do not make this an Expo React Native app. Preserve the current architecture.

| Location | Responsibility |
| --- | --- |
| `index.html` | Actual application entry and module/style loading |
| `phone-preview.html` | Phone-shaped iframe preview, iPhone 16 Pro Max target, 440x956 CSS pixels |
| `modules` | UI/state/domain logic, profiles, catalog, community, language, decorations |
| `styles` | Feature-specific CSS, themes, public profile/layout/shop |
| `auth`, `backend`, `monitoring` | Authentication, Supabase adapters, reporting hooks |
| `config` | Public build configuration, runtime template, release configuration |
| `uploads`, `output/api-catalog` | Catalog source/runtime records and media |
| `launch` | Branding, original decoration assets, imported PFP Vibes overlays |
| `ios/App` | Native project, entitlements, Swift support, generated bundled web content |
| `ios-web` | Generated native web bundle; not the source of truth |
| `supabase` | Local Edge Function source and SQL migrations |
| `legal-site`, legal HTML pages | Support, privacy, terms, community rules |
| `tests`, `qa`, `docs` | Automated tests, developer fixtures/evidence, historical verification |
| `tools`, `scripts` | Catalog/import, bundle generation, audits and release helpers |

The source archive includes developer QA material. `.easignore` excludes `qa` and tests/preview fixtures are not meant to become real production users. Read the current native packaging test and build34 verification, not only historical demo screenshots.

## Run Locally

Install Node.js 22 (the EAS configuration uses 22.14.0), npm and Git. On either Windows or macOS, use the actual application root as working directory:

```sh
npm ci --ignore-scripts
npm test
node tools/lorefy-api-server.js 8795
```

If port 8795 is occupied, choose another and adjust URLs. This application server supplies catalog/media APIs; a generic static server is not a full substitute. It binds localhost by default. `npm ci` uses the preserved lock file; do not replace it with an arbitrary dependency upgrade.

Open the actual app at `http://localhost:8795/index.html`. For the phone demo:

```text
http://localhost:8795/phone-preview.html?fresh=handoff-build34&preview=demo&demo=ready&route=profile&decorationLab=1
```

Demo data is fictional. Remove preview parameters for real sign-in; use the existing Supabase project and authorized owner account. `/qa/tester-lab.html` is a developer harness, not the ordinary user-facing experience.

Do not bind a production database to a network-exposed development server or insert fake users in production. The copy has no saved login session. Browser storage and authentication must be established again on the new device.

## Changes and Verification

1. Read the relevant modules, tests and most recent feature document before editing.
2. Preserve user changes and the snapshot baseline. Work in a separate copy or a deliberate new Git branch/repository; do not overwrite it by cloning the old remote into this folder.
3. Prefer existing module patterns and small changes. Several `tools/patch-*` scripts are historical transformations; do not execute all of them as setup commands.
4. Test both Arabic/RTL and English/LTR, dark/light/custom color, ordinary/panoramic profiles, own/visitor profiles, and normal/shelf favorites.
5. For decorations test aperture/ears, edge fit, button hit areas, safe areas, navigation, scroll and motion over time. Changing a decoration must not replace a user's cover or avatar.
6. Run targeted tests and then `npm test`. Capture current console/errors and screenshot evidence. Never cite old passing tests as a new verification.
7. Run native packaging/sync for a native release. Do not make direct edits only in `ios-web` or native `public`: regeneration will overwrite them.

## Native Packaging

```sh
npm run ios:prepare
npm run ios:sync
npm run apple:audit
```

`prepare-ios-web.mjs` builds the runtime catalog, regenerates `ios-web`, copies required modules/assets, writes native build number and public flags, and omits private release config from the native bundle. `ios:sync` patches Apple sign-in support, prepares the web bundle, invokes Capacitor and fixes native Swift package paths. Run these only in the chosen working copy; preparation replaces its generated output.

Capacitor plugins: secure storage, Apple sign-in, app, browser, camera, filesystem, push notifications, share. Native auth includes CryptoKit S256/nonce support and secure Keychain handling. Google OAuth uses PKCE and a single-flight native flow; avoid breaking custom-scheme callback recovery. Do not add service-role credentials or OAuth private keys to browser config.

Windows can run web checks and use EAS cloud builds. Local native iOS compiling, Simulator and Xcode checks require a compatible Mac/Xcode setup. A browser phone preview is not an iOS Simulator.

## Release Procedure

Build 34 is already recorded as built and submitted. Do not automatically upload another copy. For the next explicit release request:

1. Confirm Expo/Apple accounts and team/project identities from `SERVICES_AND_ACCOUNTS.md`.
2. Choose the next build number only with the user. Update `app.json` and both Xcode build configurations consistently, not just display metadata.
3. Run tests, sync, audit and current native/device checks; record unresolved gates honestly. Strict audit may intentionally reject unresolved privacy/rights settings; do not flip verification booleans to bypass them.
4. Authenticate to EAS manually; inspect current CLI help before relying on flags. Typical commands are `eas build --platform ios --profile production` and `eas submit --platform ios --profile production --id <new-build-id>`.
5. Download the finished signed IPA. Verify Info.plist build/bundle identifiers, runtime flags, all decoration assets, absence of native QA fixtures and all required catalogs.
6. Verify actual submission status separately from Apple processing and TestFlight availability. Store the exact build/submission IDs and dates.
7. Physical-device Apple/Google login, uploads, push, resume and memory testing remain essential.

Do not recreate signing certificates, credentials, OAuth clients, schemas or live project ownership solely because the Codex account changed.

## Catalog and Backend

Catalog source snapshots, runtime files and per-type API files are included. The current runtime manifest reports 121,920 records; this is an inventory count, not a claim every work has complete metadata, accurate covers or verified distribution rights.

`cloud-snapshot` contains the current migration inventory and deployed Edge Function source obtained read-only on 2026-10-10. Local migration files do not represent the complete live migration history and some timestamps differ. Reconnect the current database, compare remote state and review a narrowly scoped migration before changing it. Do not run every SQL file in order against production or restore a new database from these files without an explicit separate recovery plan.

`supplemental-workspace` preserves root-level docs and older catalog updater backend source separately. It must not overwrite the application's current `supabase` directory. Its `catalog-update` function is not among the five currently inventoried deployed functions.
