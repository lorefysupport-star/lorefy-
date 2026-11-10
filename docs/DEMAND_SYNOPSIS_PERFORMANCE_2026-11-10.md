# Performance phase one: demand-loaded Arabic synopses

Date: 2026-11-10. Baseline source: `c3143a5`, clean main.

The owner approved implementation after the Lootd product/performance study.
This batch changes the shared loading foundation only, not screen design or the
community algorithm. No database deployment, native build, install, or release.

## Confirmed cause

`index.html` scheduled the complete `uploads/lorefy-ar-enrichment.js` map after
6.5 seconds, followed by catalog ingest/refresh. The measured request began at
7025ms and finished at7082ms, transferring6,020,864 decoded bytes. Moving that
download later did not remove its network, parse or allocation cost.

The source contains12,071 Arabic synopsis entries, mostly generated descriptions,
not the Arabic title/alias search index. It remains canonical and unchanged.

## Repair

- `tools/build-arabic-enrichment.js` deterministically produces256 local JSON
  shards and a325-byte manifest from that exact source. Each entry and metadata
  value is retained. The largest shard is34,968 bytes; the tested budget is64KiB.
- `modules/lorefy-arabic-enrichment-loader.js` requests a shard only for opened
  work details. No homepage timer loads the map. Same-shard requests share a job,
  network concurrency is two, and decoded shard LRU capacity is eight.
- Eight-second timeout, abort and settled-job guards allow retry without a late
  response overwriting the successful attempt. Malformed response objects are
  rejected; missing IDs do not create arbitrary catalog entries.
- Only the requested entry is published into the shared enrichment map. The
  existing enrichment consumer still protects available Arabic summaries and
  personal covers, reading progress and ratings. The main search index is intact.
- Selected-work clicks use `LorefyEnrich.enrichOne`; direct links and later
  catalog ingestion and legacy-to-canonical ID aliases are covered separately. A completed request for a route no
  longer open cannot refresh a different route.
- Service worker cachev702 precaches only the small manifest/loader, not all256
  shards. Successful static shard reads can fall back to their own cached URL.
  This allowlist does not extend caching to authenticated APIs.
- Native preparation regenerates the shards and omits the unused legacy map from
  the prepared bundle. The canonical build input remains in source. Modified web
  entries and new assets were selectively mirrored locally, without preparing a
  new binary. Both synchronized web copies include the shards and omit the old
  runtime map; the canonical source/build input is untouched.

## Current-run verification

Thirteen new regressions were observed failing before their corresponding repair.
They cover startup, exact entries, sharing, queue/cache bounds, retry/timeout,
route races, personal state, complete data parity and packaging rules.

- Focused46 tests passed before the final packaging assertion was added.
- Final full suite:3445 passed,0 failed/skipped/cancelled, exit0,72.14s.
- `git diff --check` passed.
- Browser: Arabic search `بيرسيرك` returned Berserk; a clicked Berserk work
  loaded its26,713-byte shard and displayed the curated Arabic summary.
- A clicked Pride and Prejudice work loaded a24,341-byte shard. Its existing
  reviewed Arabic summary was preserved instead of replacing it with this map.
- A fresh direct Pride and Prejudice URL recovered the entry before/after
  catalog arrival. No browser console errors were observed in the sampled flow.

Local raw receipts/screenshots are outside Git in the workspace artifact folder
`artifacts/lootd-performance-20261110/`; they contain no production account audit.

## Controlled loading observation

Same local server, browser tab and demo state, HTTP cache disabled for both
measurements. Resource entries were bounded to completion within the first15s.
No CPU/network throttling. One baseline and one after sample, not field metrics.

| Metric | Before | After |
| --- | ---: | ---: |
| Decoded JavaScript resources |13,084,595 bytes|7,068,471 bytes|
| Decoded JS in MiB |12.48|6.74|
| Reduction | |6,016,124 bytes /45.98%|
| Whole-map request |6,020,864 bytes|not requested|
| Replacement startup manifest + loader |0|4,590 bytes|
| Resource count |175|175|
| First Contentful Paint |176ms|188ms|

This proves lower post-entry resource weight, not a46% latency improvement.
FCP did not improve in these samples and was not this repair's target. It is not
an iPhone frame-rate, LCP/INP/CLS, all-provider, offline-first-visit or live-account
certification. On web, an unvisited uncached shard can be unavailable offline;
the existing catalog summary remains. Native runtime assets are packaged locally.

## Remaining phases

Phase0 baseline coverage remains partial: repeat cold/warm trials, first3s and
first15s CPU/long-task traces, real WKWebView, scrolling and memory cycles.
Phase1 remains partial: catalog part granularity, chapter overrides, icon subset,
route-specific tools and CSS budgets still need separate verified batches.

Community work follows a separate trace/reproduction pass. Preserve its existing
pagination, scoped requests and scroll anchoring rather than reimplementing them
from the visual reference. No wholesale framework migration is required here.
