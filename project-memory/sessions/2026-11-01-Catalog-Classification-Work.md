---
kind: session
status: source-browser-verified-device-pending
date: 2026-11-01
source_commit: 1dd2964
---
# Remove duplicate classification work without changing catalog policy

Second measured performance repair after [[2026-11-01-Slow-Media-Recovery]].
The existing recommendation/discovery cache computed the same title, adult/AI
labels and classification evidence twice for every uncached record. A regression
counted two title normalizations where only one shared classification is needed.

Compute discovery classification once, then apply recommendation-only rating
and source gates. Remove the duplicated classification path/allowUnrated branch.
Keep signature-based invalidation, nested label changes, unrated discovery,
unknown/adult/AI exclusions and verified source IDs unchanged. No new cache,
catalog deletion, network requests or policy loosening. Main/worker import and
loader/cache references versioned, ten runtime mirrors synchronized, cachev648.

## Evidence

- Three new regressions, focused11/11, final full suite3145/3145, no failures.
  The first full run was started before runtime synchronization and caught the
  stale policy mirror; the subsequent stable-source full run passed.
- Seven fresh cold passes over the actual1322-record part05 fixture: median
  45.56ms before vs27.36ms after. Normalizations22764 to11382 (half). Full output
  digest identical:33f55ab1055b6ead5419017ed48de3008ed3d65615fd13c92631ef05ca0883e0.
  This is this workload's local CPU time, not overall app startup/search latency.
- Actual app44/44 browser checks, AR/EN x320/390. Main loads new policy version;
  seven paired passes per context match old/current boolean eligibility vectors
  for1322 actual loaded records. Browser median old15.4-17.1ms vs8.7-10ms new.
  Home/Explore/Library/Profile navigation and no horizontal overflow pass;
  no page errors. Isolated demo, external requests blocked; no service claim.
- Outside-Git receipts: output/playwright/catalog-policy-benchmark.cjs,
  catalog-policy-browser.js, results and performance-home-verified.png;
  artifacts/catalog-classification-20261101-red.log and verified.log.

Preserve active layouts, artwork and opt-in designs. Physical device timing,
provider image delivery and real account/cloud latency remain separate.

[[systems/Catalog-Search]] | [[13-Project-Story]] |
[[14-Feature-Coverage]] | [[15-Work-Control]]
