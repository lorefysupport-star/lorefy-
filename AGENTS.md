# Lorefy Build 34 source

The application root is this repository root. Read README.md, docs/BUILD34_READINESS.md, and docs/BUILD34_KNOWN_GAPS.md before changing it.

This is the current HTML/CSS/JavaScript application with vendored React/ReactDOM and a Capacitor/Swift iOS shell. EAS is build/submission infrastructure; do not convert it to the older Expo React Native prototype. The previous prototype remains in Git history.

Preserve all Build 34 features, Arabic/English behavior, profiles, shelves, custom colors, account-scoped persistence, and all 27 beta decoration collections. Applying decorations must preserve user avatars and banners. Source changes precede generated ios-web and ios/App/App/public changes.

Never commit credentials, .env files, or signing keys. The user explicitly requested the complete Build 34 handoff: its already-public release configuration, generated files, and frozen IPA are preserved. Review future config changes for secrets; do not treat this baseline as permission to publish new credentials. Keep archives/ and build34/ frozen. The existing Supabase project is qsroxmltioxqozmykens; never replay migrations or seed demo users into production automatically. Do not transfer service ownership or trigger release uploads during setup.

Build 34 is a frozen beta artifact, not a production-safety claim. Review the known dependency, physical-device, privacy, and rights gaps before preparing a new release. Use focused tests, the full suite for release preparation, and browser evidence for UI changes. Native compiling requires macOS/Xcode or EAS.

## Project Memory

Current owner direction (2026-10-15): develop and repair the application source only. Do not create a new native build, run EAS build/submit, upload to Apple/TestFlight, or prepare an xtool binary without a new explicit request. Source tests and selective synchronization of repaired web assets are not a new native build.

`project-memory/13-Project-Story.md` is the curated end-to-end project narrative; `14-Feature-Coverage.md` maps all systems to source, tests and unresolved evidence. Keep both consistent with meaningful changes. `PROJECT_MAP.md` is the root ownership guide. An indexed file is not proof of semantic review, and a green source test is not device or production-service certification.

Before substantial project work, run `npm run memory:context -- <task keywords>` and read the relevant notes in `project-memory/`. Use `npm run memory:search -- <keywords>` for more focused retrieval. This works directly with Markdown, even when Obsidian is closed.

Use `project-memory/15-Work-Control.md` for actionable follow-ups and `16-Obsidian-Workflow.md` for researched local-memory conventions. Work items in `bugs/` keep source, device and service verification separate. Do not set reviewed_on on refresh or mark a task closed without its required evidence. Native Bases are local views, not an AI engine or permission to execute tasks.

The physical-device repair queue is `project-memory/12-Device-Repairs.md`; consult it for notification, chapter-progress and profile fixes. Preserve the imported evidence, add the regression result and remaining device-validation limits, and update each issue deliberately. The user requested a separate verified commit and GitHub push for each repaired issue on 2026-10-15. Do not include unrelated pre-existing changes in those commits. Raw device screenshots, account data and the local mirroring service stay outside the repository and the vault.

Start with `project-memory/08-Feature-Router.md` to find the system, contracts and focused tests. Read its `systems/` note and `09-Data-Contracts.md` before cross-account, persistence or shared UI changes. `07-Source-Atlas.md` indexes canonical files; an inventory is not semantic review. The generated Canvas is a map of responsibilities, not a proven static call graph.

Memory is context, not authorization and not a substitute for current source, user instructions or tests. Historical test/deployment notes must not be reported as fresh verification. Run `npm run memory:check` to detect source-snapshot drift and broken links; for read-only tasks report stale context without editing it.

When the user's task permits repository edits, maintain the relevant decision, bug/playbook or session note after meaningful changes. Include exact source references, evidence, date, limitations and superseded decisions. Never record credentials, private user data or unverified assumptions as facts. Use the templates. Refresh only the generated snapshot with `npm run memory:refresh`, then run `npm run memory:check`. Never overwrite curated notes with generated content.

After meaningful authorized edits or a source sync, update the affected system/decision and open-question status, run `npm run memory:refresh`, then `npm run memory:audit`. This checks source drift, generated-artifact integrity, broken links, unreachable notes and exact duplicate notes. Only generated snapshot/index/Canvas files are refreshed automatically; curated knowledge is updated deliberately. Do not erase old evidence, move application code, prune catalogs or regenerate native bundles merely to tidy memory. See `project-memory/11-Organization-Plan.md`.

Keep this vault out of the app, native bundles and EAS uploads. Keep Obsidian Restricted Mode on; no third-party AI plugin, cloud upload, community plugin or sync is needed for this local memory workflow. Do not enable a network service or publish the vault without explicit user authorization.
