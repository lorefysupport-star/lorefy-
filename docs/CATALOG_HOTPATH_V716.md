# Catalog Preparation Performance, v716

## Scope

Continue the owner-requested smoother Lorefy runtime without replacing its UI,
removing selected animation or claiming knowledge of Lootd's private code.
CPU profiling of the current local Explore entry identified repeated policy
normalization and comic classification as measurable startup work. The initial
observer/scroll probe did not establish an observer feedback loop to repair.

## Changes

- `modules/lorefy-catalog-policy.js`: reuse pure normalized strings in a bounded
  FIFO Map (1,024 entries, inputs no longer than 256 UTF-16 code units). Work
  eligibility still uses the live field signature. No work, owner, token or
  persistence data is stored in this new cache; it holds catalog text only.
- `modules/lorefy-comics-taxonomy.js`: prepare each classification's combined
  description once. Reuse that snapshot for publisher matching, and reject
  inapplicable early-text/adaptation conditions before publisher matching. Each
  new call sees edits; no cross-record classification cache was added.
- Version only these assets and the service worker (`lorefy-v716-catalog-hotpath`).
  Synchronize the four changed web assets to both bundled web directories.

The public taxonomy API, categories, content restrictions, rating eligibility,
recommendations, layouts, themes and interaction timing are unchanged.

## Evidence

Six regression cases: five failed on the previous implementation for the expected
repeated-work/bounded-cache reasons; the live-safety case already passed. All six
then passed. Tests include eviction, oversized input, mutable nested tags/title,
adult status and fresh classification after an in-place edit. The focused suite
covering policy, taxonomy and Explore passed 67 cases.

Three alternating browser pairs (before/after, after/before, before/after) compare
the same current app with the original two modules from commit `71f26bd` versus
the repaired modules. Chromium, 390x844, service workers blocked, CPU throttling
4x, fresh context per run. Non-local requests and non-GET/HEAD requests are
blocked. Identical wrappers measure the actual taxonomy and Explore paths.

| Measured scope | Before median | After median |
| --- | ---: | ---: |
| Taxonomy apply CPU, four calls per startup | 310.0 ms | 158.9 ms |
| Explore ranking CPU, two calls per startup | 173.8 ms | 115.0 ms |
| Explore shelves CPU, one call per startup | 41.1 ms | 40.5 ms |
| Long-task duration sum in sampled startup window | 1,972 ms | 1,449 ms |

Combined taxonomy text preparation calls dropped from 4,577 to 1,157. Every run
had 3,305 loaded records and the same SHA-256 for IDs, types, comic publisher/
universe, correction and discovery/recommendation flags:
`8e24dd1fb7fd` (prefix). No sampled page exceptions. The warm reuse test avoids
2,500 repeated Unicode normalizations; this is an operation count, not a browser
latency claim. Live IAB navigation opened a work, returned to Explore and opened
the populated Library and decorated Profile without changing reader data.

Reproducible local scripts/results are in the parent workspace's
`output/playwright/catalog-hotpath-compare-20261113.cjs` and `.json`;
`runtime-profile-20261113.json` is the original CPU profile. They use isolated
demo contexts, not production account fixtures. The live screenshot is
`output/playwright/catalog-hotpath-v716-live.png` in that workspace.

## Limits

This is a targeted CPU improvement, not a universal app-speed percentage, INP,
FPS, provider/image latency or iPhone certification. The six-run sample is not
a population-level benchmark. No release build, Apple upload, server deployment,
production mutation or test notification was made. Physical WebKit/device
acceptance remains separate.

Final verification: 3,572 full-suite cases passed, zero failed after final asset
synchronization. An initial run caught the policy asset before that selective
copy; the 17-case package/version check and complete rerun subsequently passed.
Project-memory audit: fresh, 883 source files, 380 notes, no issues or orphans.
