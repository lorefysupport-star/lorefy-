---
kind: repair-session
status: source-browser-verified-device-pending
date: 2026-11-13
---
# Search format selection before typing

The owner reported Comics selected in Search while unrelated manga/light-novel
recommendations remained. Reproduced in an isolated390x844 browser: the select
showed Comics but the loader still had All and the six cards were unchanged.

Root cause: `searchIdle()` rendered unfiltered All-format `ranked` cards. The
media search effect skipped blank queries, so changing format did not request
its bootstrap. Typed-query filtering was already a separate working pipeline.

`modules/lorefy-explore-studio.js` now requests personalized ranking for the
selected format, filters before the six-card limit, applies advanced genre/
status/sort to the idle recommendations and requests that format on blank
input. No matches show the existing loading/error/empty message, not unrelated
fallbacks. Clearing text retains the selected format. People/Lists remain
separate, catalog generation/obsolete response guards are unchanged.

Twelve new regression cases cover the gap (initial ten observed failing before
implementation);48 search UI cases and130 focused cases pass. Browser checks
cover All plus eight concrete formats before typing, eight typed queries,
advanced format apply/reset, return from work and rapid changes. No page errors.
External API requests were blocked in this browser; provider availability and
physical iPhone validation remain separate. Screenshots are outside the repo.

Final full source suite:3594 passed,0 failed,108327ms (exit0). Log:
parent workspace `output/search-format-v718-tests.log`; browser evidence:
`output/playwright/search-format-v718.json` and matching PNG.

The Explore script/offline cache use v718 and only the changed web assets are
mirrored to both iOS web directories. No catalog regeneration, service change,
native build or Apple upload. See [[systems/Catalog-Search]],
[[13-Project-Story]] and [[14-Feature-Coverage]].
