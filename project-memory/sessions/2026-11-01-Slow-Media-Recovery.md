---
kind: session
status: source-browser-verified-device-pending
date: 2026-11-01
source_commit: b9547e4
---
# Slow original artwork must recover without a second download

User requests measured performance work and removal of proven redundant code,
with separately verified GitHub repairs. No native build or production changes.

## Reproduction and repair

Managed React covers and imperative character portraits had a 5500ms UI deadline.
It detached load listeners permanently, so a valid original image arriving later
remained hidden. New regressions reproduced error instead of ready for both.

The deadline now retains current-attempt listeners. Successful late load reveals
the same original image; actual network error releases listeners. Retry, disposal,
source changes and terminal ready retain their generation/lifecycle guards. No
automatic retries, extra requests, replacement art or longer timeout added.
Cache v647 and the touched module/HTML/SW are selectively mirrored to both web
runtimes; archives and native binaries unchanged.

## Fresh evidence

- Five additional regressions; focused 33/33, full suite 3142/3142, zero failures,
  exit 0 (65680ms).
- Actual local app: 14/14 AR/EN checks. Both real managed implementations receive
  valid image bytes after 8500ms, show UI error first, then ready without retry,
  naturalWidth positive, cover opacity 1, portrait exposed, one request per image,
  retry removed/hidden, no page errors. Isolated demo, external requests blocked.
- Evidence outside Git: output/playwright/slow-media.js and results;
  artifacts/slow-media-20261101-red.log and full.log.
- Separate 4x CPU Home profile: interactive 3603ms, 21 long tasks (max 351ms),
  original public cover requests about 2.4-2.9s. This is a diagnostic sample, not
  a claim that all devices or providers have that latency. Deadline repair fixes
  false permanent failure, not remote provider transfer speed.

## Next bounded performance work

Catalog classification repeats the same content checks for recommendation and
discovery eligibility. Measure and deduplicate without changing policy/results.
Existing search audit fixes already ship; do not re-report them as new. Active
layouts, opt-in experiments and legacy consumers cannot be deleted solely by age.
Physical iPhone performance and service/load acceptance remain separate.

[[systems/Language-Media]] | [[systems/Catalog-Search]] |
[[13-Project-Story]] | [[14-Feature-Coverage]] | [[15-Work-Control]]
