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

## Remaining Acceptance

Next separate source audit: obsolete format pagination outcomes after changing
format/query. Native keyboard/safe-area/long-scroll performance and live provider
coverage remain independent. This is not every-catalog or zero-latency proof.

[[systems/Explore-Works]] | [[systems/Catalog-Search]]
[[13-Project-Story]] | [[14-Feature-Coverage]] | [[15-Work-Control]]
