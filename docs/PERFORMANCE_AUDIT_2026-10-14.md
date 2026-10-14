# Pre-commit performance audit —341021

No commit/push/release upload. Existing local branch and all preexisting work preserved. Source edited before native generation; frozen archives unchanged.

Official guidance consulted: React recommends measuring interactions and avoiding unnecessary effects/renders, then memoizing costly calculations (https://react.dev/reference/react/useMemo). WebKit recommends focusing on main-thread JavaScript and object churn (https://webkit.org/blog/8970/how-web-content-can-affect-power-usage/). No new software installed.

## Findings and changes

- Noncompact/unprepared search records rebuilt normalized query index before checking whether cached contents changed. Check inexpensive raw field signature first, rebuilding only when contents change; in-place alias edits still detected.
- Fallback JS-loaded shards had no prepared indexes. Warm caches in100-record idle batches without changing runtime-derived `_indexed` state. Normal worker already prepares indexes off the main thread.
- Sort comparator repeatedly computed expensive rating confidence. Compute once per eligible work; cheap popular/year comparisons remain direct to avoid Map overhead.
- Inline search scanned catalog even in People/Lists mode and on unrelated renders. Memoize media results and skip scans outside Media.
- Hero's7-second rotation continued during search. Pause it while search is active.
- Stale character requests still processed associations/cache after editor/query changed. Skip that processing once epoch/connection guard fails.

## Measurements

Reproducible Node benchmark: tools/benchmark-explore-performance.cjs,121920 actual local works,6 passes/case. Raw shard warm Naruto search median1397.89ms before ->58.87ms after. Worker-prepared current search median33.58ms. Raw cold search remains1396.34ms; prepared current cold39.35ms. Preparation1337.67ms in synchronous Node benchmark; runtime worker/background batches distribute this cost. These are pure JavaScript measurements, not iPhone frame rate. All-popular warm90.48ms before ->95.05ms after (small regression/measurement variance; no improvement claim), Manga top-rated35.20ms ->30.77ms. Rating callback calls over6 passes1561584 ->68856.

Browser canonical demo with QA-only input probe: six Naruto letters retained; input-to-next-rAF callback0.7–0.9ms. Probe measures event handling after delivery, not hardware input latency/painting or physical device responsiveness. QA scripts excluded from native bundle. Full1081 tests passed including cache validity, alias edits, once-per-work scoring, and preserved runtime state.

## Limits / remaining work

No promise of zero lag. Network/image loading, startup/shard ingestion and real hardware still need user testing/physical-device traces. Unprepared cold queries can still be costly if invoked before warming completes. Native compiling succeeded, local simulator upgraded in place; inspect/retap flows without changing real data. Do not commit until user review.

Final simulator check: build341021 installed and launched with existing signed-in session. Focused Explore input, then sent N,A,R,U,T,O in separate keystrokes: all six appeared as NARUTO and search results refreshed. No posting, rating, library mutation or profile save. This confirms that particular native typing check; it is not a comprehensive frame-rate or first-focus timing certification.
