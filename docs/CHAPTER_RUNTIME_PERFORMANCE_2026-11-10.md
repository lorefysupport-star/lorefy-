# Performance phase one: synchronous chapter metadata

Date: 2026-11-10. Baseline source: `a8b3129`.

The owner requested continuation of the approved startup-performance work.
This batch changes the metadata representation, not reading rules or UI design.
No native build, installation, release, provider write or database change.

## Cause and decision

The entry point loaded838,685 decoded bytes for3,120 chapter records before the
application mounted. Most records repeat the same field names, source/status,
date, confidence, URL prefix and matching chapters/latestChapter values.
All totals must remain synchronous because saved progress and estimated hours
can read this map during startup. Delaying the whole map would change that rule.

A dictionary/front-coded experiment reduced bytes but increased Node VM execution
time. It was discarded. The accepted generator shares constant metadata through
16 private record factories, producing the same map immediately with independent
record objects. No runtime decoder loop, network request, timer or Promise.

`tools/build-chapter-runtime.js` generates `uploads/lorefy-chapter-runtime.js`
from the unchanged canonical `uploads/lorefy-chapter-overrides.js`. Map and field
iteration order, zero/string values, Unicode, source URLs, volumes, source/status
and latest counts remain exact. Unsupported new field shapes fail generation
instead of silently dropping data. Source snapshots/dates are not updated here.

The runtime uses the original Object.assign merge contract: preserve the target
map and unrelated records, replace supplied IDs, never share mutable record objects.
The app consumes it at the same entry-point position. Cachev703 and native asset
preparation use the generated file; the redundant old native copies are omitted.
The original source remains a required build input.

## Measured evidence

| Measurement | Before | After |
| --- | ---: | ---: |
| Decoded chapter asset |838,685 bytes|216,885 bytes|
| Gzip size, same local zlib settings |92,488 bytes|74,279 bytes|
| Node execution median |2.868ms|1.643ms|
| Local Home JS within first15s |7,068,471 bytes|6,446,671 bytes|
| Shared map entries after startup enrichment |3123|3123|

The chapter asset is74.1% smaller decoded; total observed Home JS is8.8% lower
than the previous repair. Node execution used25 interleaved fresh VM contexts
after five warmups for each version, excluding context creation. It is not an
iPhone or full-application speed result. Gzip is a local comparison, not proof
of the actual deployment's Content-Encoding or cache configuration.

The browser comparison used the same localhost Home demo, HTTP cache disabled,
one before/after sample, no CPU/network throttling. Connection/server/engine
caches can remain warm. First paint varied and is not used to attribute an
application-wide latency improvement. No INP/CLS or hardware fps claim.

## Verification

- Seven new focused cases failed before repair, then passed. Full metadata parity
  checks every field of every source record, not just aggregate counts.
- Edge fixtures cover differing latest totals, missing counts, zero volumes,
  numeric and string fields, signed zero, empty records and quoted Unicode URLs.
- Focused chapter/reading/offline group:37 passed.
- Full suite:3452 passed, zero failed/skipped/cancelled, exit0,74.07s.
- Actual browser Home renders; opened Berserk retains384 chapters,384/384
  progress and chapter ranges. No sampled console errors.
- Both native web copies match the new runtime. No binary was rebuilt.

Raw timings, browser JSON and screenshots stay outside Git in the workspace
`artifacts/chapter-runtime-20261110/` folder. They are local demo evidence,
not certification of live user accounts or provider freshness.

## Remaining work

The previous Arabic synopsis demand-loading repair stays intact. Catalog chunk
granularity, route-scoped tools, icons/CSS and broader CPU/device measurements
remain separate batches. Community work still needs its own reproduction and
before/after trace; this change does not rewrite its feed algorithm.
