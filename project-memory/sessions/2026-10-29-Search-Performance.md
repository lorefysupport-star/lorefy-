---
kind: session
status: source-and-browser-verified-device-pending
date: 2026-10-29
verified_on: 2026-10-29
source_commit: 91c71ec
---
# Remove search startup and provider bottlenecks

Owner requested inspection of latest GitHub, a substantial performance repair,
and direct commit/push without questions. Latest fetched main is `74fbee4`;
this repair continues its Jikan replacement in an isolated worktree. Original
checkout security edits and frozen artifacts are excluded. No native build or
release authorization is inferred.

[Report](../../docs/SEARCH_PERFORMANCE_2026-10-29.md) records source references,
controlled browser receipts, before/after CPU numbers and fresh verification.
`index.html` separates search helpers from Arabic enrichment and loads them on
idle/intent, eliminating 11.1 seconds of fallback startup timers. API results
publish per source, book coverage starts in the first concurrent pair, request
abortion reaches all adapters, and epochs reject obsolete same-query responses.
Cached no-op ingestion is skipped. Local/remote debounce is shortened; normalized
multilingual fields are reused. Identity, aliases, editions, artwork and account
persistence remain unchanged. Workers, cache v638 and seven selective web copies
are synchronized without a native compile.

Fresh full suite:2990 passed,0 failed, exit0. Four startup and six responsiveness
checks reproduced failures before repair. Additional cancellation/race checks
pass. The dependency-fixture-only initial failure was resolved by reusing the
original checkout's installed dependencies; no dependency manifest change.
121920-record cold search:1696.33→789.07ms; identical60 results. Preparation:
1805.37→753.56ms; warm median69.38→65.84ms. Controlled browser sources80/1400ms:
first usable result1416→85ms. Actual demo AR author and EN titles, People/Media
transition and interface-language switch pass. These are source/local-browser
measurements; physical iPhone, peak-load services and release delivery remain
open. Earlier service reports retain their separate evidence boundaries.

[[systems/Catalog-Search]] | [[13-Project-Story]] | [[14-Feature-Coverage]] |
[[15-Work-Control]] | [[10-Open-Questions]]
