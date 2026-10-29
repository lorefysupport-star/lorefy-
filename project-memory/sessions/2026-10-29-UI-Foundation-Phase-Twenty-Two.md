---
kind: session
status: source-browser-verified-device-pending
date: 2026-10-29
---
# Rated-character profile strip and gallery recovery

Continuation of [[sessions/2026-10-29-UI-Foundation-Phase-Twenty-One]]. Existing
Plugin Management, UI/UX Pro Max, Apple guidance, test-first debugging and
Playwright used; no new plugin/dependency needed. Local source only. This batch
covers the owner's rated-character strip and its See all gallery, not favorite
character tiles, public-profile portraits or all character images.

## Cause and repair

- profileRatedCharacterPortrait removed failed images permanently. Its opt-in
  managed path now uses the existing DOM portrait owner for these two consumers,
  preserving custom-image resolution, original source and localized status.
  Existing favorite-editor consumers keep their read-only legacy path, so this
  change does not introduce image Retry inside their native selection buttons.
- Strip/gallery cards now contain an independent named native work-open button
  and image Retry, never nested controls. Retry is44px, centered in the art,
  does not navigate or change a rating and returns keyboard focus to Open.
  Quarter scores, low ratings, work navigation and AR/EN labels remain intact.
- Explicit disposal runs before gallery filtering/grouping/replacement and strip
  rerender/removal. The last strip section is retained only to release controllers
  when its parent has already disappeared. Signatures include owner/language.
  A detached gallery releases media; normal overlay close already releases it.
- A nested dialog can make the gallery temporarily inert. Preserve its state
  and search while paused; resume maintenance when active again. Account mismatch
  is checked before inert and closes the old gallery. This is not cancellation
  of provider transport or proof of backend account isolation.
- Visual review found the hidden native image was allocating a second grid row
  below initials. Scoped absolute image positioning centers the fallback. A
  before/after comparison then caught gallery auto-width shrinking to content
  size without intrinsic images. Reserve the gallery body width100% with
  border-box sizing; original card/portrait dimensions are preserved.

## Verification

-10 new regressions: projected/custom source and localization, keyboard recovery,
  unchanged read-only consumers, independent actions, lifecycle contracts,
  nested-dialog state, centered fallback and content-independent gallery width.
  Initial media failures and subsequent geometry failures were recorded before
  their fixes. Existing extracted card/gallery harnesses target native Open and
  supply the new disposal dependency. Focused31/31; full2950/2950,0 failures.
-78 controlled UI cases across AR/EN x320/390/768, pink/dark: strip/gallery
  image recovery, independent actions/focus, missing-image identity, custom-source
  precedence, stable unchanged strip, search/grouping, nested inert/resume, close,
  stored ratings/custom images unchanged and profile teardown. Character Open
  navigation is a spy that verifies its workId, not a real account action.
- Eight boundary cases: visible image timeout, no automatic retry, one pending
  native image despite repeated keyboard activation, pending close cleanup,
  no late-load repaint, account mismatch closes an inert gallery, external
  gallery removal and empty-rating strip removal. Identical pending requests can
  coalesce in the browser; native image insertion is counted independently.
  Total86/86 cases,0 uncaught errors; isolated contexts closed.
- Six before/after configurations preserve24 card/portrait dimensions within1px.
  Narrow strip and gallery screenshots reviewed. Four web/entry files mirrored
  to both runtime copies with SHA256/JavaScript-parse parity. Cache
  lorefy-v633-rated-profile-media; changed asset key20261029-rated-profile-media-v1.
  No native prepare/sync, GitHub, real account save, production write or build.
- Evidence: `artifacts/ui-execution-phase22-20261029/` contains scripts, geometry,
  browser JSON, screenshots, failing sizing logs, focused/full logs and parity
  verification. Initial media red run: `artifacts/rated-profile-media-red.log`.

## Remaining

F07 remains partial: favorite/public profile character portraits, favorite-editor
and other picker choices, character-page work cover, avatars/banners and
published review/quote media are separate owners. Share-poster/export lifecycle,
F08 edition grouping, live two-account behavior and physical-iPhone accessibility/
performance acceptance remain independent. No ratings or custom images from a
real user were changed; fixture storage is not a service certification.

[[13-Project-Story]] | [[14-Feature-Coverage]] | [[systems/Language-Media]] |
[[systems/Profiles-Lists]]
