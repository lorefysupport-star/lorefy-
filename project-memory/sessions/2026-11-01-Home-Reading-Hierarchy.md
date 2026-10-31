---
kind: session
status: source-browser-verified-service-device-pending
date: 2026-11-01
source_commit: 278260a
---
# Home reading hierarchy, stable chrome and correct progress units

Second bounded repair after [[2026-11-01-Home-Reaction-Feedback]]. Owner asked
for Pro Max/Apple-guided Home fixes and verified GitHub pushes. No native build,
production mutation or replacement artwork/theme.

## Reproduced

Reading thumbnails floated above the selected work without a visible group
label. The header changed height/brand visibility at a fixed scroll threshold.
Arabic checkpoint numbers were visually reversed by auto direction. The Library
action was ambiguously named All. Seven new regressions initially failed.

Visual review then found two numerical faults despite green layout checks:
- Ongoing Hunter x Hunter showed13/420 but0%, because the shared application
  progressTotal intentionally returns zero for ongoing publication. Home had
  combined a published-count checkpoint with a final-completion percentage.
- The old percentage callback uses chapter only, so page/volume checkpoints
  could show zero despite a known positive saved amount. Four additional focused
  percentage cases reproduced this; four ongoing-status cases reproduced the
  first problem. These are distinct from image loading or mere typography.

## Repair

- Home header uses a smaller stable height including the original safe area;
  scrolling changes material only, not height, title visibility or reading data.
- Reading choices follow selected-work content in normal flow, labeled Reading
  now/قراءاتك, with44px targets, selected border and exact full-title tooltips.
  Names distinguish switching from opening. Numeric/string IDs agree on selection.
- Library/مكتبتي is an explicit navigation action. Checkpoint text is isolated
  LTR inside its correctly directed paragraph; stored strings/values unchanged.
- Ongoing uses the exact existing application status classification and saved
  checkpoint summary, without a false final denominator or0% completion meter.
- Pure `LorefyLibraryCinema.percentage` reuses savedUnit's chapter/page/volume
  matching, clamps to100 and returns null for unknown/mismatched totals. Home
  adopts it; no other Library consumer/persistence contract is changed. Known
  completed totals still show real unit-based percentages; no invented total.
- Existing sources, clear backdrop, image retries, onOpen/onLibrary callbacks,
  four-work Home bound and uncapped Library retained. Cachev646; only touched
  assets selectively mirrored to both runtime folders, no native compilation.

## Fresh evidence

-15 additional tests across the hierarchy, ongoing status, per-unit Home
  calculation and shared helper. Final full suite **3137/3137**, zero failures,
  exit0,70,746ms. Relevant focused tests and JS syntax checks passed. Old static
  expectations for collapsing chrome and bare thumbnail labels updated to the
  new explicit behavior, not removed. No user data migration or server request.
- **288/288** actual local-app browser checks, AR/EN x dark/pink x320/390/768.
  Actual locale/theme asserted;0/1/4 reading items, header bounds and equal
  height across scroll states, no horizontal overflow, thumbnail touch geometry,
  selected work's own progress, no saved-state changes from switching, ongoing
  no false percentage, Library navigation,100/400 pages=25% and4/20 volumes=20%.
  No page errors. Fixtures change metadata/state only inside isolated demo
  contexts; external requests blocked, so unavailable remote images are tested
  failure states, not evidence of a live provider outage.
- Workspace evidence outside Git: output/playwright/home-reading.js,
  home-reading-results.txt, home-reading-*.png; artifacts/home-reading-20261101-
  full.log and the ongoing/units red logs. Before/after actual-source screenshots
  retain the original commissioned background and selected cover where loaded.

## Remaining boundaries

Physical iPhone gesture/performance, production account/cloud acknowledgment and
live remote artwork remain separate acceptance. This repairs Home's presentation
and displayed percentage, not every historical app percentage consumer. No new
publication status, chapter/page/volume value, reading completion or review is
persisted by selecting or rendering a work.

[[systems/Reading-Library]] | [[13-Project-Story]] |
[[14-Feature-Coverage]] | [[15-Work-Control]] | [[10-Open-Questions]]
