# Lorefy Build 34 Handoff

Read START_HERE_AR.md, PROMPT_FOR_NEW_ACCOUNT.md and handoff-docs before editing. Work in project/Lorefy-clean-app. The user moved to a new Codex account on a different computer; this is a filesystem snapshot, not a clone of a fully up-to-date Git remote.

Do not overwrite the snapshot with its old build6-era HEAD. Keep a read-only baseline. Preserve all features and user changes. No reset, blind patch-script replay, automatic migration replay, database reseeding, service ownership transfer, or release upload as part of initial setup.

Web frontend: HTML/CSS/JS with vendored React/ReactDOM. Native shell: Capacitor/Swift. EAS is build/submission infrastructure, not React Native architecture. Source changes precede generated ios-web/native public changes. Use tests plus browser evidence and sync native assets for a release.

Existing service identifiers and manual reauthorization steps are in SERVICES_AND_ACCOUNTS.md. Never ask for secrets in chat or introduce server keys into client config. Reconnect the existing Supabase project rather than creating a new database.

All 27 decoration collections are included in beta Build 34 and currently free. Do not replace owner avatar/banner on apply. Preserve full-color themes, safe frame geometry, public appearance, shelves, bilingual labels, community routing and account-scoped durability. Fictional users belong to demo/QA only.

Build 34 is a frozen signed artifact, not a claim of production safety. Newly observed dependency advisories and remaining device/privacy/rights gates are in KNOWN_GAPS.md. Do not silently upgrade the frozen snapshot or claim a fix without verification; use a working copy for authorized improvements.

Prefer concise Arabic progress/results. Implement requested feasible changes and verify them. Do not infer account identities from unrelated browser tabs. Read verification manifests before saying transfer succeeded; destination receipt must be established separately from local packaging.
