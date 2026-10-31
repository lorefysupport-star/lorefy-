---
kind: session
status: source-browser-verified-device-pending
date: 2026-11-01
source_commit: 22f062f
---
# Reuse bounded pure identity text normalization

Fourth measured repair after [[2026-11-01-Diary-Idle-Work]]. Home CPU profiles
still attributed substantial time to identity normalization. Repeated exact
short inputs now reuse a FIFO memo:512 entries maximum,256 code units maximum
for both input and output. Large/expanding strings and failed platform Unicode
normalization are not retained. Convert objects to strings on every call so
mutable input changes stay fresh. Identity keys, alias merging and Unicode
rules are unchanged. Cachev650; ten main/worker runtime mirrors synchronized.

## Evidence

- Four additional regressions cover reuse including empty results, bounded
  eviction, oversized/Unicode-expanding values, failed normalization recovery,
  mutable inputs and exact Unicode results. Focused16/16; final full3153/3153,
  zero failures, exit0 (64992ms). Existing full bundled catalog and hostile
  identity-group tests remain enabled.
-1322 actual part05 records, seven cold runs per version: median29.06ms before
  vs25.68ms after, Unicode normalization calls6674 to3956. Exact serialized
  records, aliases and report digest unchanged:
  86f93aa471a78eab3f3748b907986441846129c189726fc429199d94305df274.
-8/8 actual-app AR/EN browser checks: new asset loaded,1322 records produce
  identical organization/alias/report output against prior source, mutable
  string inputs remain fresh, no page errors. Isolated demo, external requests
  blocked; not provider/device acceptance.
- Outside-Git receipts: output/playwright/identity-benchmark.cjs,
  identity-browser.js/results; artifacts/identity-memo-20261101-red.log/full.log.
- Aggregate scope, evidence and remaining startup/network/device gates are in
  docs/PERFORMANCE_REVIEW_2026-11-01.md. No active legacy layout was deleted.

[[systems/Catalog-Search]] | [[13-Project-Story]] |
[[14-Feature-Coverage]] | [[15-Work-Control]]
