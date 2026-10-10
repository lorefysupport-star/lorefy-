# Lorefy Build 34 source

The application root is this repository root. Read README.md, docs/BUILD34_READINESS.md, and docs/BUILD34_KNOWN_GAPS.md before changing it.

This is the current HTML/CSS/JavaScript application with vendored React/ReactDOM and a Capacitor/Swift iOS shell. EAS is build/submission infrastructure; do not convert it to the older Expo React Native prototype. The previous prototype remains in Git history.

Preserve all Build 34 features, Arabic/English behavior, profiles, shelves, custom colors, account-scoped persistence, and all 27 beta decoration collections. Applying decorations must preserve user avatars and banners. Source changes precede generated ios-web and ios/App/App/public changes.

Never commit credentials, .env files, or signing keys. The user explicitly requested the complete Build 34 handoff: its already-public release configuration, generated files, and frozen IPA are preserved. Review future config changes for secrets; do not treat this baseline as permission to publish new credentials. Keep archives/ and build34/ frozen. The existing Supabase project is qsroxmltioxqozmykens; never replay migrations or seed demo users into production automatically. Do not transfer service ownership or trigger release uploads during setup.

Build 34 is a frozen beta artifact, not a production-safety claim. Review the known dependency, physical-device, privacy, and rights gaps before preparing a new release. Use focused tests, the full suite for release preparation, and browser evidence for UI changes. Native compiling requires macOS/Xcode or EAS.
