# Search performance repair — 29 October 2026

The owner requested a substantial speed improvement, inspection of the latest
GitHub source, and direct commits/push without further questions. Work starts at
`origin/main` `74fbee4d4c9f907c9d2de30db589cef8bb5720af`, preserving the October 29
UI checkpoint and the preceding Jikan replacement (`91c71ec`). The original
checkout's unrelated pending security changes are excluded.

## Causes and repairs

- **Online search was loaded too late.** In `index.html`, the fallback schedule
  waited 6500 ms, loaded Arabic enrichment, waited another 1400 + 900 ms,
  loaded the open adapters, then waited another 1400 + 900 ms to load the search
  engine: **11,100 ms of timers plus downloads**. A stalled enrichment request
  prevented search loading. Search helpers now start on idle with a 600 ms
  deadline (200 ms fallback), or immediately on media search focus/input.
  Adapter order is retained; Arabic enrichment loads independently and still
  refreshes its catalog. Failed helpers can retry on later search intent.
- **Every source waited for the slowest source.**
  `modules/lorefy-api-catalog.js` now ingests successful provider results as they
  arrive. Final completion still records partial failures and a short retry cache.
  The two-job format concurrency limit stays in place; books start in the first
  pair rather than waiting behind all three Asian comic formats.
- **Obsolete requests consumed resources.** Each input search owns an abort
  controller, propagated through all adapters, HTTP fetch and JSON parsing.
  Edits and navigation abort it. Request epochs also prevent an older response
  from becoming current when the same query is typed again. Cancelled searches
  cannot add late results/cache/error state, and queued format jobs stop.
- **Stacked input delays.** Remote debounce drops from 650 to 250 ms; the local
  discovery-index debounce drops from 450 to 150 ms. Explore's existing 180 ms
  render debounce and worker architecture remain intact.
- **Redundant catalog work.** Cached hits with no new records no longer invoke
  a full ingest/refresh. `modules/lorefy-catalog-data.js` reuses normalized source
  fields while expanding multilingual alias groups, instead of normalizing
  each title repeatedly for every group. In-place alias edits still invalidate
  indexes; Arabic author/title aliases and edition IDs remain authoritative.

Source asset URLs, both worker imports, and service-worker cache v638 are updated.
Seven changed web assets are selectively synchronized into `ios-web` and
`ios/App/App/public`. No native compilation, EAS/Apple submission, credential
change, production schema change or deployment occurs in this repair.

## Fresh measurements

[Before CPU receipt](../qa/search-cpu-before-20261029.json) and
[after CPU receipt](../qa/search-cpu-after-20261029.json) retain the raw results.
The same Node pure-function benchmark, `node tools/benchmark-explore-performance.cjs`,
ran against all **121,920 bundled records** before and after the repair:

| Work | Before | After |
| --- | ---: | ---: |
| First Naruto name search | 1696.33 ms | 789.07 ms |
| Index preparation | 1805.37 ms | 753.56 ms |
| Repeated Naruto search, median | 69.38 ms | 65.84 ms |
| Search result count | 60 | 60 |

Cold search CPU time fell about **53%**. Already-warm search changes little;
this is a desktop CPU benchmark, not an iPhone frame-rate claim. Browse sorting
was not optimized by this change: timing variation there is not an improvement.

A temporary loopback browser fixture loaded the real old/new API modules with
controlled sources: AniList after 80 ms, MangaDex after 1400 ms. The old code's
first visible fixture result arrived at **1416 ms**, the repaired code at
**85 ms**, while MangaDex remained pending. Both ultimately returned the same
fixture title. These are controlled first-result measurements, not promises of
live upstream latency. Receipts: [before](../qa/search-provider-before-20261029.txt)
and [after](../qa/search-provider-after-20261029.txt). Temporary fixture files
were removed after verification.

The actual local demo also booted and searched successfully in Arabic and English:
Arabic `نجيب محفوظ`, English titles `Naruto` and `Hunter x Hunter`, People mode,
returning to Media, and switching the interface language through Settings.
The English final view showed 41 available results, including separate source
editions. This count includes live/cache enrichment and is not the fixed
bundled-catalog benchmark count. [Browser image](../qa/search-performance-english-20261029.png).

## Tests and remaining limits

Three startup regressions and six responsiveness regressions failed before the
fix. Additional checks cover HTTP abortion, queued-job cancellation, open-source
adapters, late JSON, same-query response races, and duplicate cached ingestion.
Focused startup/search/identity/ranking checks passed; the final full suite is
**2990/2990 passed**, exit 0 (`node --test --test-concurrency=1 tests/*.test.js`).
[Full test receipt](../qa/search-performance-tests-20261029.txt).
The first full attempt had one missing dependency fixture in the isolated
checkout; reusing the original installed dependencies fixed that environment
issue, and the complete rerun passed. No package or lockfile changes.

Full tests include generated-asset equality and preservation of identity,
Arabic/English, account ownership, saved progress, decoration and artwork rules.
Memory refresh/audit follows the curated update. No physical iPhone timing,
peak-load service test or installed-client update is established. Existing
native clients receive these JavaScript changes only through a separately
authorized build/release. The prior live server optimization and Jikan
compatibility repair have their own reports and evidence; this report does not
relabel those checks as fresh production certification.
