---
kind: session
status: source-browser-verified-device-pending
date: 2026-11-01
source_commit: b335e75
---
# Simplify owner top characters and rated-character surfaces

Follows [[2026-11-01-Reading-Favorite-Type]] under the owner's direct repair/push
direction. Installed UI/UX Pro Max search/selection guidance and Apple design
guidance were consulted; no new dependency or external plugin was needed.
Existing artwork, four-rank storage, quarter scores and all3 layouts remain.

## Implemented

- Top-character editor defaults to a single character/work query. Matching
  works appear without changing search mode; the optional By work filter stays.
  Existing library work suggestions appear before typing. Unrated loaded cast
  remains selectable. A query memo avoids rescanning on selection/image renders,
  and catalog growth invalidates it without requiring the user to retype.
- Adding a new choice advances to the next empty rank. Explicit slot selection
  still allows replacement/swapping. Keep existing immediate persistence and
  the final Done command, including failed-save recovery and owner guards.
- Owner profile top cards gain names/ranks and independent native Open and
  image buttons. Use article wrappers so legacy book-cover selectors do not
  hide buttons or apply overlapping book dimensions. Four stable grid tracks
  remain usable at320px, including empty slots and all layouts.
- Top editor candidates/current selection, profile top cards, owner rated strip
  and rated gallery expose the existing image picker. Commands capture owner,
  reject obsolete controls and refresh after the nested picker resumes its
  parent. No new upload/storage contract. The work-rating page keeps its existing
  image command, now a44px target. Choosing an image cannot change ratings/ranks.
- Rated cards open the selected character through the existing work-rating
  page's search, not the entire unfiltered cast. Gallery stays two columns on
  phones with compact square art and exact quarter-score badges. Image actions
  and badges occupy opposite corners in both directions.
- Shared theme tokens, translucent headers/search, readable Done/current-work
  commands, focused search outlines,44px image actions and Lucide image/search
  symbols align these surfaces with the current app. No new design system,
  framework migration or unrelated profile/header/decoration changes.

## Verification

- Added failing regressions for unified work discovery, automatic next rank,
  owner-scoped image actions, nested-picker pause/resume and late catalog results.
  Existing ownership/failure/search/keyboard/quarter-score tests remain enabled.
  Updated only superseded labels/DOM assumptions and the two-command card count.
- Focused tests80/80 before the additional late-catalog/rank-toolbar regressions;
  the final focused editor/image subset passed37/37. Final full3234/3234, zero
  failures, exit0 (78670ms). Twelve canonical/mirrored web files are not a native
  build; the eight changed index/SW/growth/atlas mirrors match byte-for-byte.
- Actual app AR/EN at320/390px:76/76 interaction checks, no page exceptions.
  This includes unified work lookup, next rank, manual rank/image toolbar,
  nested image save, exact unchanged scores, outer top/gallery/work image
  commands, targeted character opening, separate score/image controls, native
  button semantics and overflow. An earlier run's external-image load wait was
  changed to DOM-ready navigation; final run has no navigation timeout.
- Actual3 layouts x dark/pink x320/390:108/108 checks including asserted layout
  and applied palette, four non-overlapping cards,44px image controls, opening,
  contrasting Done colors and overflow. Favorite-format QA was also rerun6/6
  with asserted canonical layout attributes. These are local demo/fixture tests,
  not proof of actual-user durability or native rendering.
- Actual app in isolated demo contexts uses bundled Berserk cast with controlled
  cast/search/image-option responses. Image selection saves to demo-only artwork
  storage; no real account is modified. Earlier browser failures caught hidden
  buttons,320px overlap, Done contrast and overlapping score/image controls.
- Layout matrix asserts actual `normal`/`immersive`/`reader` attributes and
  actual dark/pink tokens, not merely configured labels. The first exploratory
  fixture used the display word panoramic and JSON-encoded theme; it was
  corrected and rerun with canonical values/raw theme before acceptance.
- Parent workspace receipts: `output/playwright/character-studio-results.txt`,
  `character-studio-layouts-results.txt`, `favorite-reading-type-results.txt`;
  screenshots `character-studio-top-ar.png`, `character-studio-rated-ar.png`,
  `character-studio-pink-reader.png`; log
  `artifacts/character-studio-20261101-full.log`. Not shipped in the repository.
- Cachev667; canonical growth/atlas/index/SW and eight selective web mirrors.

## Remaining Gates

No live search-provider SLA, actual-user cloud image durability, native Photos/
camera permissions, physical-device acceptance, build or Apple upload. Visitor
profiles remain read-only; owner editing does not grant rights to others' art.

[[systems/Profiles-Lists]] | [[systems/Language-Media]] | [[15-Work-Control]]
