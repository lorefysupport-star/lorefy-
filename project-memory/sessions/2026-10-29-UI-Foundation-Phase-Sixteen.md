---
kind: session
status: source-browser-verified-device-pending
date: 2026-10-29
---
# Explore art and review work-cover recovery

Continuation of [[sessions/2026-10-29-UI-Foundation-Phase-Fifteen]]. Plugin
Management selected existing tools. UI/UX Pro Max error-recovery guidance,
Apple, test-first/debugging and Playwright used; no dependency installed.
Local-only source work, no account publication or new native build.

## Scope and implementation

- `modules/lorefy-explore-studio.js`: featured poster and representative format
  cards reuse `LorefyLibraryMedia.card`. The large background has managed
  lifecycle, decorative aria-hidden semantics and a separate Retry artwork
  action. Existing commissioned-art/work binding and rights-safe branch remain
  in `featureArtwork`; no selection, ranking, filter or stored-cover change.
- Poster and category Open remain native controls, separate from Retry. Format
  copy is pointer-transparent above the Open overlay, so clicking its title
  still chooses that format. Formats without a representative retain their
  original icon/button; missing cover is not a disabled category.
- `modules/lorefy-friend-activity.js`: work covers adopt the shared adapter;
  author avatars, profile actions, ratings, follow/privacy/safety filters and
  refresh/account-request guards are unchanged. No friend rating was created.
- `uploads/files/lorefy-app.js`: the shared review-card work attachment uses the
  adapter and an explicit lf-community-work-card anchor. Its existing callback
  still stops review-card propagation and opens the selected work. Retry stops
  propagation independently; source artwork is not replaced on request failure.
  The compact34x48/38x52 and timeline64x92 art containers retain existing sizes.
- `styles/lorefy-cover-media.css`: sharp1.2x mobile background crop and desktop
  crop preserved. Decorative messages are hidden, not announced as useful art.
  Retry on small review attachments sits over the cover, not in title space.
  An initial end-padding reservation changed narrow row height and was removed
  after geometry comparison. Outer focus-visible outline avoids clipping the
  Open/Retry keyboard indicator inside overflow-hidden cover containers.
- `tools/patch-review-work-media.mjs` mechanically patches the one guarded
  minified review attachment. `tools/refresh-editorial-media-assets.mjs` updates
  six affected entry/runtime assets and selectively mirrors both web copies.
  Cache `lorefy-v627-editorial-media`, asset key `20261029-editorial-media-v1`.
  No native prepare/sync, archive change, GitHub or Supabase write.

## Verification

- Seven new regressions: six adoption/geometry cases failed before fixes, then
  one outer-focus assertion failed before its rule was added. Full suite2900
  passed,0 failed. Existing exact entry/offline-version expectations updated.
-36 actual UI cases: AR/EN x320/390 with pink/dark presentation, each exercising
  artwork retry, poster recovery and keyboard Open, format retry/title opening,
  friend cover recovery, compact review cover recovery/Open and sampled saved
  state invariance. Failed images remain hidden; success decodes original-key
  fixture images; buttons are separate and44px. No real reaction/save action.
- Retry adds at most one request. A second image instance can recover from the
  browser's successful cache without another HTTP request; this is accepted,
  not forced to refetch or mistaken for failure. No new auto-retry mechanism.
- Four boundary cases: a cancelled/late old artwork request cannot fail the next
  selected work, and missing feature/format/review art retains identity and Open.
-14 fresh Home Continue reading regression cases still pass. Total54 browser
  cases,0 uncaught page errors; all isolated contexts closed. The outer keyboard
  focus indicator is also checked by computed outline in the actual hero.
-12 before/after geometry configurations preserve92 sampled card/art sizes
  within1px. These compare dimensions, not native text scaling or all positions.
  Representative hero/review screenshots inspected; no new imagery shipped.
- External evidence: `artifacts/ui-execution-phase16-20261029/` contains tests,
  controlled browser fixtures/JSON, geometry snapshots, screenshots and parity
  verification. Provider-shaped image URLs are intercepted; not live-provider QA.

## Remaining

F07 is not fully closed. Work hero, profile banners/avatars, character art,
review uploaded pictures/quote media and picker internals retain separate image
owners. Other reused review locations, real accounts/services, physical iPhone
permissions/performance/accessibility and F08 edition grouping still need their
own acceptance. No user image, catalog, review or reading data was saved.

[[13-Project-Story]] | [[14-Feature-Coverage]] | [[systems/Language-Media]] |
[[systems/Catalog-Search]] | [[systems/Community-Notifications]]
