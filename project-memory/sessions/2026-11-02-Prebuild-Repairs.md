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

## Startup follow-up: request-local diversification features

Tracing the actual Explore page under Chrome4x CPU isolated repeated author/type
normalization in the120-candidate lookahead. The same candidates were analyzed
again on each of100 picks. A request-local, lazily populated Map now reads each
work's author/type/first genre once and reuses those features. The penalty weights,
candidate window, strict tie comparison and source ordering remain unchanged.
No persistent cache or account key was added; the Map dies with the call.

Four source regressions cover bounded feature reads on frozen works, exact legacy
ordering over500 candidates (Unicode, ties, prepared/missing metadata, duplicates
and five result limits), metadata changes between calls and unvisited candidates.
The repeated-read regression failed before repair; the parity controls already
passed. The complete suite now passes3365/3365, exit0,68712ms. A test extraction
boundary was made whitespace-tolerant after formatting this formerly minified
function; no taste assertion was removed. Six shipped mirrors are byte-identical,
asset query is20261102-ranking-features-v1, SW cachev689-ranking-features.

Browser acceptance used three alternating before/after pairs, fresh demo contexts,
390x844, service workers blocked, external/API requests aborted, catalog3305 and
the old function injected into the control response only. All output100-ID lists
matched their pair; no pageerror or horizontal overflow. Warm15-selection medians
for each context: before38.9/55.5/46.4ms, after4.5/5.7/3.9ms. Median-of-medians:
46.4 to4.5ms. Median cold diversification maximum56.1 to10.4ms; entire Explore
ranking maximum232.9 to215.7ms. This is a bounded algorithm improvement, not a
10x whole-app speed claim, real-network image check or physical iPhone result.
First trial ran alongside source tests and was noisier; the final receipt was
captured after those tests finished. Screenshots intentionally show missing remote
covers because the performance fixture blocks them; this is not a delivery test.

Evidence outside Git: output/playwright/prebuild-20261102/
ranking-features-acceptance-idle.txt, ranking-features-explore.png and
artifacts/prebuild-ranking-features-tests.log. Browser instrumentation does not
ship in the application. Native compiling and production changes were not run.

## Remaining, not silently completed

- R-01: explicitly deferred by the owner on2026-11-02. The live Apple provider
  observation was Bundle ID only and an empty OAuth secret. Native ID-token auth
  is separate. The attached4TUFJH4GN2 key was previously reserved for APNs and
  was not read or reused. Developer access was unavailable to the signed-in
  App Manager. Do not resume credential setup without the owner returning to it.
- Other startup long tasks still require their own traces; the measured
  diversification repair above does not certify all startup work as fast.
- App Privacy and content rights require actual evidence, not flipping flags.
- Physical-device and real two-account/server acceptance remain separate gates.
- A new read-only performance-advisor attempt returned connector unavailable.
  No production DB inspection, configuration change or migration is claimed.
- Source strict release preflight still intentionally fails on privacy and
  content rights. Build number stays35; choose the next number only during an
  explicitly authorized build after checking Apple. R-07 is not a runtime bug.

[[systems/Native-Release]] | [[systems/App-Boot]] | [[13-Project-Story]]
[[14-Feature-Coverage]] | [[15-Work-Control]]
