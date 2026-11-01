---
kind: session
status: source-browser-verified-device-pending
date: 2026-11-01
source_commit: d7710d8
---
# Measured smooth-runtime pass

Owner asks for smoother navigation, scrolling, images, search and interactions.
Keep glass, artwork, themes, frame motion, reading state and account contracts;
push independently verified repairs, no new native build or production mutation.
Installed systematic-debugging, UI/UX Pro Max performance guidance, Apple design
and Playwright were used; no new dependency/plugin is required.

## S-001: repeated cover URL preparation

Actual Home startup CPU profile at4x slowdown identified normalizeUrl/displayUrl/
coverDedupeKey as repeated CPU work alongside React/community rendering. This
profile is diagnostic, not a before/after whole-app benchmark: remote cover
delivery and local machine load vary substantially.

modules/lorefy-cover-api.js now memoizes only pure normalized source URLs and
edition keys. Each map holds at most1024 exact strings, evicts its oldest entry
and excludes inline image data and strings over2048 characters. Validation output,
cover/edition identity and source images stay unchanged. Rights-safe processing,
native/demo detection and proxy selection remain live on every displayUrl call.
No persistent cache or extra network request.

Evidence:
- New repeated-preparation regression failed first (2505 URL parses versus5
  warmed); all34 focused cover/source/rights/image tests pass after repair.
- Five paired local microbenchmarks,100 source-shaped URLs x50 preparations:
  median54.03 to11.09ms,25000 to200 URL parses; outputs identical. This measures
  CPU preparation, not image downloads or end-to-end startup speed.
- Full3240/3240 tests, exit0 (87012ms). Actual app demo AR320/EN390 at4x CPU:
  16 navigation/reaction/cover checks and12 rapid-search/cancel checks pass,
  no page exceptions. External providers deliberately unavailable; local search
  still resolves the latest query. First exploratory reaction check selected
  Comment; corrected to the actual Like action and rerun successfully.
- Parent receipts: output/playwright/smooth-cover-benchmark.json,
  smooth-cover-ui-results.txt, smooth-search-results.txt; full log
  artifacts/cover-preparation-20261101-full.log. Cachev669; six selective mirrors.

## S-002: bounded, immediate scroll restoration

The settled four-route observer probe did not reveal an idle update storm in
its short demo window. A separate source/DOM reproduction found that a pending
scroll restoration writes scrollTop synchronously for every content-mutation
delivery.100 deliveries meant100 repeated layout writes; it now queues one RAF
attempt. Pending-job identity and cancellation prevent an obsolete callback or
timeout cancelling a newer page job. Touch/wheel/keyboard release the frame.

Actual app checking also exposed CSS scroll-behavior:smooth on screen roots:
the old scrollTop setter animated restoration instead of restoring immediately.
Use scrollTo with explicit instant behavior for restoration only (plain-object
fallback retained), without changing the page's smooth-scroll preference.
This follows https://drafts.csswg.org/cssom-view/#scrolling; auto behavior may
still honor the element's smooth CSS and is not an instant override.

Quickly leaving a still-loading page must not replace its640px saved target
with a clamped0. Click capture and route capture now skip pending restoration;
ordinary reader scrolling still updates saved positions after cancellation.
Six new regressions cover batching, obsolete jobs, cancellation, timeout/removal,
instant restoration and quick leave/return;24 focused tests pass. Final full
suite3246/3246, zero failures, exit0 (105113ms). Actual app AR320/EN390 and real
DOM late-content/quick-navigation fixture:13/13 checks, no page exceptions.
Earlier app checks exposed CSS smooth restoration; final run asserts restored
positions and unchanged smooth CSS. Six selective index/SW/module mirrors match
byte-for-byte; cachev670. No gesture animation, scroll CSS or frame-motion edits.

Receipts: output/playwright/smooth-observers-before.txt,
smooth-scroll-results.txt; artifacts/scroll-restore-20261101-full.log.

## Remaining measurement

The four-route settled/scrolling observer sample is complete but short and uses
demo content. Do not infer no-lag behavior or native frame rate from it. Cold launch,
large live feeds, physical-device gestures/keyboard, storage/image delivery and
long-session memory need independent evidence; do not delete features or artwork
as a shortcut to smaller measurements.

[[systems/Catalog-Search]] | [[systems/App-Boot]]
[[13-Project-Story]] | [[14-Feature-Coverage]] | [[15-Work-Control]]
