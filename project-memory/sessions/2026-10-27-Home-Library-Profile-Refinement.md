---
kind: session
status: source-browser-verified-owner-device-review-pending
date: 2026-10-27
---
# Home, Library and Original Profile Refinement

Owner authorized all items in the UI follow-up, implemented sequentially: Home,
Library, then the original Normal/Panoramic/Reader layouts and shared interaction
verification. This supersedes the pending implementation queue in
[[2026-10-27-Home-Approved-Reference]], not the owner's approval boundary.
Explore remains the approved reference and was not edited. No Git commit/push,
native build/prepare, Apple upload, database change or production publication.

## Source Changes

- `modules/lorefy-home-cinema.js` reuses Library's saved-unit checkpoint and
  known-total checks. A visible percentage is shown only when the saved unit has
  a denominator; unrelated chapter totals cannot imply a page percentage.
- `styles/lorefy-home-immersive.css`: compact scrolled chrome, metadata in a
  shrinking grid instead of an absolutely positioned rating,44px reaction/menu
  targets, readable review copy and bounded attached-work rows. Scroll anchoring
  is disabled on Home to avoid a position jump when chrome height contracts.
- `modules/lorefy-library-cinema.js` distinguishes search misses from empty or
  filtered collections, offering Clear search or Explore through existing state
  callbacks. The guarded Library hook wires this into the canonical React app.
- `styles/lorefy-library-refined.css`: compact view controls, semantic checkpoint
  ink/progress color, coherent filter/sort/search treatment and small-width
  stacking. The320px browser run exposed search/view overlap, then a wooden-board
  overflow caused by44px minimum book widths and a card-derived row board. Book
  widths now follow their seven grid tracks; the board uses its own container.
  All four view modes remain available. No cover-background imagery was added.
- `styles/lorefy-profile-refined.css`: visible follow labels, readable metric
  captions, consistent tab/section/action hierarchy, horizontally scrollable
  reading filters and unframed community/import utilities. Banner/avatar/frame
  geometry, original layouts, favorites modes and list envelopes are retained.
- `modules/lorefy-profile-sections.js`: Overview's panel ID no longer duplicates
  its tab ID; controls resolve to the content element rather than the tab itself.
- `modules/lorefy-page-refresh.js`: recognizes the complete Home and Library,
  not only the nested Home community feed. Home uses existing posts/reviews/friend
  refresh handlers; Library reuses the account handler. Gesture threshold,
  coalescing, timeout, cancellation and dialog blocking remain in place.
  `styles/lorefy-page-refresh.css` uses shared material and safe-area positioning.
- Cachev605, changed runtime entries version20261027-ui-refinement-v1. Two new
  scoped styles load before shared glass. Eleven web files selectively mirrored
  into the two existing derived web directories;22 SHA256 comparisons match.

## Fresh Evidence

-12 new focused regression tests observed failing before implementation.
- Final `npm test`:2610 passed,0 failed,exit0,53.5 seconds. An initial full run
  caught one stale expected Library cache version, updated before the final run.
-96 local-demo browser cases: Home, four Library modes and three profile layouts;
  Arabic/English,320/430px and Pink/Dark/custom-blue. Long author names, rating/menu
  separation, touch bounds, empty-search recovery and profile tab controls passed.
  Reading/progress/favorite/identity values stayed unchanged by presentation tests.
-24 decorated-profile cases: Bunny, Tidal Glass, Opal Silk and Living Grove across
  three layouts and two widths. Both page/avatar canvases remained in bounds,
  painted nonblank pixels, advanced frames and changed sampled pixel hashes.
  Decoration application did not replace the saved avatar/banner.
-11-book wooden Library tested at320,430 and1280px without horizontal overflow.
- Like/Dislike mutual exclusion and Save feedback passed in demo. Composer draft
  and footer stayed bounded at390x540; nothing was published. A synthetic touch
  pull from Home's reading title invoked each existing feed handler once; Library
  refresh invoked its account handler once. These integration checks substituted
  local handlers, so they do not certify current production service availability.
- `git diff --check` exit0; existing line-ending warnings only.

Raw browser images/scripts/full test log remain in the task's external artifacts
directory, not the Git tree or vault. The existing user in-app-browser storage was
not seeded; temporary fictional data were confined to the isolated QA browser.

## Still Open

Owner visual acceptance, actual iPhone keyboard/gesture feel, native performance,
VoiceOver and live account/network failures require their own verification. The
540px viewport is a keyboard approximation, not a real iOS keyboard measurement.
Canvas motion evidence is not an FPS or energy certification. No redesign of the
approved Explore or changes to authentication, backend keys, billing or release
configuration occurred in this pass.

[[systems/Appearance-Bundles]] | [[systems/Profiles-Lists]] |
[[systems/Reading-Library]] | [[13-Project-Story]] | [[14-Feature-Coverage]]
