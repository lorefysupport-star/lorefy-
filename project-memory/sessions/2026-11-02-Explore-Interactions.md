---
kind: repair-session
status: source-and-demo-browser-verified
date: 2026-11-02
---
# Explore interaction audit

## E-001: collection updates must not restart focus ownership

Actual React/browser reproduction: focus a work while See all waits for a local
controlled pager. Completion moved focus back to the close button. The effect in
`modules/lorefy-explore-studio.js` depended on the whole dialog object, which is
replaced on loading/success/error. Two new source regressions reproduced this
for successful and failed requests before the repair.

Each explicit open now has an instance counter; focus/background isolation
depends on that instance, visibility and owner, not streamed content. Cleanup
captures the correct opener and restores it without scrolling. Escape prevents
its default as well as stopping propagation. No artwork, palette, catalog,
ranking, persistence, provider request or reading-state contract changed.

Evidence:71 focused tests;3286/3286 full source suite, exit0,68335ms.162 actual
browser checks pass:140 cover AR/EN x320/430px for preferences, Types, format
filters/sort/search/back, global media search, clear/idle, search-mode keyboard
navigation, People/Lists selection and work open/return.22 delayed-pager checks
cover success/failure, retry, retained focus/isolation and restored navigation.
The fixture controls the pager/catalog only in isolated demo contexts. No live
user/service writes or native build. Cachev678; six selective web mirrors match.

Receipts outside Git: `artifacts/explore-dialogs-20261102-full.log`,
`output/playwright/explore-acceptance-v678-results.txt`,
`output/playwright/explore-delayed-dialog-v678-results.txt`,
`output/playwright/explore-focus-probe-v678.js`,
`output/playwright/explore-verified-v678.png`.

## E-002: format pagination request ownership

Controlled browser reproduction confirmed an old pending page prevented the new
format from loading independently. Source regressions additionally demonstrated
that old success/failure increased the new view limit from60 to120, a synchronous
loadMore exception escaped the handler and a retained old callback could dispatch
in a newer context. During repair, a separate regression caught the automatic
observer retaining an old sort closure. Seven source regressions now cover these
boundaries and cleanup, with six observed red before their respective fixes.

The pagination gate now belongs to owner/format/query/sort/filter and loader,
with per-request identity. Deferred invocation, results and cleanup check that
scope. New contexts do not wait for old requests; old completion cannot release
a current gate. Only successful current pages increase the display limit. Promise
invocation handles synchronous failures as retryable feedback. The observer is
rebound when context changes, and obsolete callbacks cannot start another load.
Catalog data, provider cache, IDs, query matching, artwork and reading data stay.

Evidence:70 focused tests;3293/3293 final full source suite, exit0,63970ms.30 new
AR/EN browser checks cover type/query/sort changes during pending pages, duplicate
gates, obsolete errors, current success and navigation. The blocked new-format
probe now passes. Re-ran the140 core and22 delayed-dialog checks on final source:
192/192 final browser checks, zero page errors. These local fixtures are not proof
of every provider/network or device condition. Cachev679; six mirrors match.

Receipts outside Git: `artifacts/explore-pagination-20261102-full.log`,
`output/playwright/explore-pagination-v679-results.txt`,
`output/playwright/explore-pagination-probe-v679.js`,
`output/playwright/explore-acceptance-v679-results.txt`,
`output/playwright/explore-delayed-dialog-v679-results.txt`.

## Remaining Acceptance

E-001/E-002 are source/demo verified. Native keyboard/safe-area/long-scroll performance and live provider
coverage remain independent. This is not every-catalog or zero-latency proof.

[[systems/Explore-Works]] | [[systems/Catalog-Search]]
[[13-Project-Story]] | [[14-Feature-Coverage]] | [[15-Work-Control]]
