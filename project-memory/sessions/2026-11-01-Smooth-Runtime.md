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

## S-003: remove the preview review/completion update loop

The heavier four-route4x CPU probe found128 Explore ranking invocations in its
startup sample. In modules/lorefy-preview-readers.js, reviewState created a new
combined array every render and split even identity/no-op updater results into
two new state arrays. The completed-progress maintenance effect watches reviews,
so unchanged completion results could schedule another preview render repeatedly.

Memoize the combined view by its actual local/fixture inputs; identity updaters
do nothing, and functional partition setters retain unchanged row arrays. Actual
fixture and owner edits still update, including two queued edits/reversal before
render. Keep fictional reviews out of owner storage; live/non-preview behavior
returns the original owner collection and setter unchanged.

Four regressions added, three initially failed;10 focused and3250 full tests
passed, exit0 (105007ms). Actual AR320/EN390 demo navigation/reaction checks16/16
passed without page exceptions. Same instrumented4x startup scenario: Explore
ranking calls128 to3; Profile long tasks56 to15. This is a local preview repair,
not evidence of equivalent production startup gains. Absolute wall-clock times
are sensitive to local CPU load/network and are not an SLA. Cachev671, six
selective web mirrors byte-identical. No native build or production mutation.

Receipts: output/playwright/smooth-hotpaths-{before,after}.txt,
preview-stable-ui-results.txt; artifacts/preview-stability-20261101-full.log.
Next shared hotspot: the feed probe attributed300.5 of318.5ms of measured render
work to synchronous scrollTop layout reads; investigate before changing anchors.

## S-004: skip unnecessary feed layout on empty timeline status updates

Instrumented real Home at4x CPU isolated the expensive part of renderPostFeed:
four scrollTop reads accounted for300.5 of318.5ms. Reading geometry after other
UI writes forces synchronous style/layout. An empty post timeline's status and
pagination rows already sort after review cards and cannot shift their anchors.

modules/lorefy-community.js now avoids anchor reads only in that no-post,
no-error timeline case. Incoming/remaining/deleted post cards, appearing/removed
retry banners and non-timeline layouts keep conservative anchor measurement.
No new scroll cache, event listener, deferred reaction, request or persisted state.

The failing empty-status regression went from3 reads to0;36 focused tests pass,
including prepend/deletion/targeted refresh/reaction ordering. Actual Home's
same instrumented scenario goes318.5 to31.3ms in the measured feed calls, with
zero scrollTop reads on that path. This is one loading/status path, not a claim
that every feed or full app is10x faster. Independent runs have CPU variance.

Actual AR/EN x320/390 browser fixture with180 paged posts:120/120 checks passed,
no exceptions, native anchoring disabled. Full-window refresh, edited/deleted
rows, node identity, viewport anchor, targeted reads, optimistic reaction races
and subsequent fresh server counts all retained. No live backend was changed.

Cachev672, six selective web mirrors match byte-for-byte. First full suite caught
one stale stylesheet/module-version assertion; updated that expected URL only.
Final full rerun3255/3255, zero failures, exit0 (80598ms). A final four-route4x
sample also retained low Home feed work (21.4ms total,5.4ms maximum per call),
without claiming identical machine load or real-provider latency. Receipts:
output/playwright/smooth-feed-layout-{before,after}.txt,
feed-layout-window-results.txt, smooth-hotpaths-final.txt;
artifacts/feed-layout-20261101-full.log.

## Remaining measurement

The four-route settled/scrolling observer sample is complete but short and uses
demo content. Do not infer no-lag behavior or native frame rate from it. Cold launch,
large live feeds, physical-device gestures/keyboard, storage/image delivery and
long-session memory need independent evidence; do not delete features or artwork
as a shortcut to smaller measurements.

[[systems/Catalog-Search]] | [[systems/App-Boot]]
[[13-Project-Story]] | [[14-Feature-Coverage]] | [[15-Work-Control]]
