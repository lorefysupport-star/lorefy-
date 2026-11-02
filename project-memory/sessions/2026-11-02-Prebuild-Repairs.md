---
kind: repair-session
status: partial-source-verified-service-device-gates-open
date: 2026-11-02
---
# Prebuild finding repairs

Owner requested repairing the findings in the November2 local prebuild audit.
Preserve source/UI/data; push each verified repair separately. No native build,
Apple upload, bulk migration, billing change or legal attestation is authorized.

## R-04: development-tool dependency advisories

The CLI8.4.3 -> rimraf6.1.3 -> glob13.0.6 -> minimatch10.2.6 development chain
matched GHSA-3g3m-2fjr-6pw4 and GHSA-g3hv-75wg-m249. This is not evidence of an
exploit through Lorefy's remote UI. Capacitor's literal sync cleanup and migration
paths, rimraf's sync/async glob API and signals were traced before patching.

Scoped npm overrides under rimraf pin glob14.0.2 and minimatch11.0.1. Package lock
contains only their required transitive graph updates; no runtime dependency,
Capacitor version, native Swift package, signing or archived artifact changes.
Both pinned versions support Node18/20/22+, including configured EAS22.14.
Actual checks ran on Windows Node24.16, not EAS or a native compiler.

Two valid regressions failed before repair: vulnerable lock resolution and five
directory reads after cancellation. After repair: four behavioral/lock tests,
20 packaging/tooling focused checks, CLI --version8.4.3 and npm ls pass. Full
suite3361/3361, exit0,62081ms; npm audit reports zero vulnerabilities. Literal
cleanup, opt-in glob cleanup, sync/async matches, spaces and exclusions preserve
legitimate behavior in a bounded disposable directory. No production files are
deleted by these fixtures. The initial cross-platform expectation was corrected
to native path separators before the valid red run.

Independent compatibility review: changed graph only affects dev tools; both
glob entry points and default literal rimraf remain functional. The existing
Node22 build engine satisfies the dependency engines. No audit-fix downgrade or
global override of unrelated runtime modules. Browser UI checks are irrelevant
to this tooling-only patch; native build/publish acceptance remains open.

Managed evidence is outside Git in the Codex Security target collection:
`artifacts/tooling-glob-red.txt`, `artifacts/tooling-glob-green.txt`,
`artifacts/tooling-audit-clean.json`, `artifacts/tooling-full.log`,
`artifacts/tooling-tree.json`. The prebuild audit is a separate historical receipt
for92e4c23, not overwritten as if it had tested this patch.

Primary advisory references:
- https://github.com/isaacs/node-glob/security/advisories/GHSA-3g3m-2fjr-6pw4
- https://github.com/isaacs/minimatch/security/advisories/GHSA-g3hv-75wg-m249

## Remaining, not silently completed

- R-01: live Supabase Apple provider is enabled with Bundle ID only and an empty
  OAuth secret. Native ID-token authentication is a different path. Owner reports
  a dedicated Sign in with Apple key exists; its path/Key ID/web Service ID are
  needed. Never substitute the APNs key or publish key material.
- Startup performance requires a measured source-level trace and narrow fix.
- App Privacy and content rights require actual evidence, not flipping flags.
- Physical-device and real two-account/server acceptance remain separate gates.

[[systems/Native-Release]] | [[systems/App-Boot]] | [[13-Project-Story]]
[[14-Feature-Coverage]] | [[15-Work-Control]]
