---
kind: session
status: source-browser-verified-device-pending
date: 2026-10-29
---
# F12: shelf and Showcase count acceptance

One bounded Library/favorites journey after
[[2026-10-29-Search-Edition-Groups]], following [[19-UI-Execution-Control]].
Existing Plugin Management, UI/UX Pro Max overflow guidance, Apple, debugging,
test-first and browser tools used. No new plugin or dependency needed.
Local only: no GitHub, native build, production write or real account save.

## Reproduction and minimal repair

- The actual Library passed counts1/2/3/4/7/8/10/14/15, AR/EN,320/390/768,
  in spines and Showcase:108 geometry cases. Existing wood/supports, seven
  spine tracks, triplet rows and uncapped total Library were not redesigned.
- Visual review of Reader favorites found a real regression despite the initial
  coarse count/baseline checks passing: its normal cover caption was made visible
  by an early important CSS layer in both special modes. As a flex sibling it
  reduced some spines to about6-16px on320; Showcase also duplicated its title.
  Strengthened browser checks failed20 of60 cases before the fix.
- `styles/lorefy-profile-refined.css`: scope the two-line normal-poster caption
  to favorites excluding spines and Showcase. Existing special-mode hiding now
  wins; cover widths recover without new dimensions or selector-priority escalation.
- A real native click then timed out because the vertical spine title intercepted
  `.lf-cover-open`. `styles/lorefy-cover-media.css` makes only decorative titles
  in managed cards pointer-transparent. Open/Edit/Retry remain separate controls.
- `tests/library-shelf-acceptance.test.js`: caption exclusion, count/placement
  contracts and pointer routing. Both repairs had failing tests before editing.

## Evidence and retained contracts

Evidence outside repo: `artifacts/library-f12-20261029/`.

- Library matrix108/108. Profiles180/180 across AR/EN,320/390/768, normal,
  immersive and Reader, counts1/2/3/4/7, both modes. Width/baseline, no duplicate
  caption, visible count and unchanged saved favorites asserted.
- Native mouse click actions17/17: first/last work opens its expected title in
  Library and each profile layout, both modes; Reader normal-grid captions still
  show. Saved library/progress/favorites/custom-cover strings unchanged.
- Favorites keep7 saved; Showcase displays3; Library keeps all15 fixture works,
  using7 per spine row or3 per Showcase row. No catalog ID/storage migration.
- Controlled remote artwork requests return one existing local bitmap solely to
  isolate geometry/actions. This is not cover accuracy or live-provider acceptance.
- Fresh full source suite2966/2966; focused75/75. No page errors in stored matrices.
  Four changed runtime assets selectively mirrored; cache `lorefy-v635-shelf-acceptance`.

## Limits and next

This closes bounded local F12 geometry/count/open acceptance, not the whole
Library filter/sort/search journey, every touch target, visitor/device behavior,
physical font scaling or production artwork. Seven narrow spine tracks are not
a claim that every track is44px wide. Physical iPhone QA remains independent.
F13 cover edition/source choice is next. F07 image-consumer work stays deferred
as one task; do not restart the old consumer batches.

[[systems/Reading-Library]] | [[systems/Profiles-Lists]] |
[[15-Work-Control]] | [[10-Open-Questions]]
