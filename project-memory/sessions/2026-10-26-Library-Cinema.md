---
kind: session
status: local-browser-verified
date: 2026-10-26
aliases: ["glassy library", "Library cinema"]
---
# Library Cinema

Owner follow-up: [[2026-10-26-Explore-Cinema]] removes the automatic Library
background photograph completely. The remaining design and four modes stay.
That later decision supersedes backdrop descriptions below, retained as history.

Owner authorized Library after the Home follow-up, using the approved dark
Apple/Glassy image. Source implementation is local only. No push, native build,
Apple upload, migration or production change.

## Changes

- `modules/lorefy-library-cinema.js` supplies presentation-only header, controlled
  search/clear, filtered result count, actual-owner background and saved-unit
  formatting. It does not write library entries, ratings, totals or checkpoints.
- `tools/patch-library-cinema.mjs` guards unique hooks into the legacy React
  renderer. Existing filtering, sorting, counts and opening callbacks are retained;
  a module-missing fallback is preserved.
- `styles/lorefy-library-cinema.css` scopes the approved glass/dark treatment to
  Library: a three-cover phone grid, aligned title/progress tracks, glass search,
  status filters, view controls and navigation. Wide screens use four columns.
- The source backdrop follows the first actual reading entry (or actual first
  library work), not filtered results; typing does not select a different artwork.
  Empty accounts do not get fabricated books or progress.
- Known matching units display saved/total. Unknown matching totals retain the
  existing summary and hide the misleading meter. No progress is inferred from
  ratings or publication status.
- Covers, seven-spine wooden shelves, three-position showcase rows and List all
  remain selectable. Existing preference persistence is unchanged. The switcher is
  inserted before Search so keyboard order follows the visual header.
- Runtime assets selectively mirrored into both shipped web folders. New modules
  are included by the existing runtime packaging entries; no preparation/build ran.

## Evidence And Remaining Check

Four new focused Library tests fail before implementation and pass afterward.
They cover real-owner backdrop identity, known/unknown unit formatting, controlled
search/clear, page isolation and preservation of all four modes. Combined full
JavaScript suite:2530 passed, zero failures.

The browser-control tool failed with a missing kernel-assets path before the new
Library could be visually inspected. A reset and dependency refresh did not fix
it. Alternative Playwright approval was requested. Phone/wide screenshots, all
four live view modes, live search/sort/empty state, and final composer keyboard
geometry remain pending. Source tests are not a visual/native-device certificate.

[[sessions/2026-10-26-Home-Cinema]] | [[13-Project-Story]]

## Browser Acceptance Completed

Owner explicitly authorized alternative Playwright inspection after the tool
failure. On2026-10-26, tested a separate demo browser with eight real catalog
records and synthetic reading checkpoints. No real-account library was modified
and no post/review was published. Temporary text-post DOM was removed afterward.

The live screenshot exposed legacy `padding-inline-end:148px` on the title and
absolute positioning on the view switcher. Home-specific header rules now cancel
those old positions. A failing regression preceded the fix. Numeric checkpoint
direction in List and wrapping of long grid captions were also corrected, with
source regressions before each correction.

Final Playwright matrix:24/24 cases pass (Arabic/English x320/390/768 x four
modes), checking document width, title height, header separation, one selected
mode and retention of all eight cards. Seven spines share one baseline; the
eighth remains on the next wooden shelf. Intentional angled/showcase and wooden
ornament overhang stays inside the page, not clipped or made into page overflow.

Search returned one Berserk result, zero-result feedback and Clear restored the
library. Reading/completed filters returned2/3 fixture works; title sort matched
the actual titles. Opening Berserk reached its correct detail; Back retained
the selected grid mode. Source full suite:2531 passed, zero failures.

Raw screenshots and logs are outside the repository in the task artifacts folder.
[Library design QA](../../docs/LIBRARY_CINEMA_QA.md) records the final scope.
Native keyboard/safe-area performance and real-account persistence still require
separate hardware/service verification. A public catalog AniList request during
detail inspection hit remote CORS/preflight failure; no production configuration
was changed, and this is not certified by the local UI checks.
