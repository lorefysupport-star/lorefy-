---
kind: session
status: source-browser-verified-device-pending
date: 2026-10-29
---
# Category character-board portrait recovery

Continuation of [[sessions/2026-10-29-UI-Foundation-Phase-Nineteen]]. Existing
Plugin Management, Apple, UI/UX Pro Max touch-target guidance, test-first
debugging and Playwright used. No installation or new runtime dependency.
Local source only; no GitHub, native build or production-service change.

## Cause and changes

- Category-board slots, picker candidates and current preview used raw images
  that were removed on failure. Queued provider callbacks could append another
  raw image into a detached/stale node. cbPortrait now adopts the existing DOM
  owner, preserving custom-over-provider precedence and original display URLs.
- cbRefreshPortrait ignores disconnected/leaving nodes, preserves a newer custom
  image and avoids remounting an identical source. Replacement disposes only old
  owned media. Provider lookup/rate limiting/cache-write behavior is unchanged;
  UI result invalidation does not abort transport or clear provider caches.
- Slots and candidates have separate native named selection and image Retry,
  no nested controls. Retry does not open the picker or select a character;
  keyboard focus returns to the correct selector. Current preview recovery
  returns to its image-options action. Source share metadata is forwarded to
  every managed native image, including retry attempts; export helpers unchanged.
- Filtering releases candidate images; picker close releases its own media and
  exact nested image picker. Category changes release the old embed. CB.embedEl
  retains the last owned embed so cleanup still runs after the parent hub has
  already been removed from the document.
- A category picker captures its originating owner and node. File-read results,
  image save/reset completions, image-picker callbacks and work-cast completion
  check that picker/owner before updating UI. Image save actions are single
  flight. An already-started save is not cancelled by closing a picker; its late
  completion cannot reopen or replace a newer picker. Existing artwork backend
  ownership rules remain a separate boundary and were not deployed or rewritten.
-44px Retry must not cover slot numbers or names. Small board slots reserve a
  minimum108px height. Inspection found aspect-ratio transferred that minimum
  into81px width on44px tracks; explicit width100%/min-width0 fixes the overlap.
  Source grid widths and candidate56x68/current44x44 dimensions are retained.
  Current-image row uses a scoped two-row grid so title/preview and two44px-high
  equal-width actions do not crowd each other at320px. Theme tokens retained.

## Verification

- Seven new regressions cover custom/share precedence, detached provider result,
  replacement/newer custom image, separate actions, cleanup, picker-owner guards
  and geometry/focus. Additional failing assertions captured transferred-width
  overflow and the compressed custom-image row before their fixes. Existing
  work-loader harness now supplies/checks isPickerCurrent and preserves live
  search text. Focused suite42/42; complete source suite2932/2932,0 failures.
-60 actual UI cases: AR/EN x320/390/768, pink/dark. Slot/current/candidate error
  recovery; original share metadata; independent actions and keyboard focus;
  no board opening/selection on Retry; filter and obsolete-image cleanup; native
  fixture selection/restoration; category replacement and close/disposal. Grid
  has no horizontal overflow, custom actions fit equal44px-high tracks and have
  clearance from title. Custom image is unchanged; no actual photo saved.
- Five boundary cases: file read after close/replacement/owner change cannot
  save, pending save cannot replace the new picker, and parent close releases
  the exact nested image picker. File reading/writing and owner identity are
  controlled fixtures; one pending-save writer is mocked, never production.
-66 fresh legacy top-ten list/podium regressions still pass. Total131 browser
  cases,0 uncaught errors; all isolated contexts closed. Test-only source hooks
  expose existing private board functions and hold provider/file jobs; no QA
  bridge was added to shipped code and no provider/physical acceptance claimed.
- Six before/after configurations preserve12 candidate/current-preview sizes
  and6 slot widths within1px. Slot height intentionally grows to108px on small
  screens; desktop original178px remains. Narrow AR board/picker screenshots
  reviewed before/after; overlapping cards and compressed action row repaired.
- Five web/entry assets selectively mirrored to both runtime copies, hash parity
  and JS parse verified. Cache lorefy-v631-category-board; changed asset key
  20261029-category-board-v1. No Capacitor prepare/sync or new binary.
- External evidence: `artifacts/ui-execution-phase20-20261029/` holds scripts,
  browser JSON, screenshots, geometry snapshots, focused/full logs and parity
  verification. Initial seven-test failure: `artifacts/category-board-media-red.log`.
  Browser fixture boards use all10 saved slots; initial short arrays were fixed
  to the existing contract, not treated as an app persistence failure.

## Remaining

F07 is partial: public/rated/profile character tiles, modern profile-list image
renderers, other picker candidates, character-page work cover, avatars/banners
and published review/quote media remain separate owners. Legacy share-poster
images retain their separate export lifecycle. F08 edition grouping and real
services/two-account/iPhone accessibility/performance require independent checks.
No real board, image, account, post or list was changed; nothing was pushed.

[[13-Project-Story]] | [[14-Feature-Coverage]] | [[systems/Language-Media]] |
[[systems/Profiles-Lists]] | [[systems/Explore-Works]]
