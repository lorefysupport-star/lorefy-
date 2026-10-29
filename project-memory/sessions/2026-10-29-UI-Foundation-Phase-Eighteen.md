---
kind: session
status: source-browser-verified-device-pending
date: 2026-10-29
---
# Character rating-page portrait recovery

Continuation of [[sessions/2026-10-29-UI-Foundation-Phase-Seventeen]]. Existing
Plugin Management, UI/UX Pro Max touch/recovery guidance, Apple design,
test-first debugging and Playwright used. No plugin or dependency installation.
Local source only; no GitHub, native build, account save or service mutation.

## Cause and ownership

The character page uses imperative DOM, not React. Its old portrait owner hid
initials as soon as a URL existed, removed a failed image and offered no image
retry or visible request deadline. It also had no request cleanup on filtering.
Mounting independent React roots here would add a second lifecycle to manage.

`modules/lorefy-cover-media.js` now exposes LorefyPortraitMedia.mount separately
from the existing React cover component. It owns only its image, initials,
status and Retry nodes. The surrounding name, score and Edit control remain
owned by growth features. Loading/ready/error/missing,5500ms visible deadline,
240px lazy-observation margin, explicit single-flight retry and dispose token
guards mirror the cover contract. Original URLs, custom data images and
no-referrer requests remain; managed images opt out of global replacement art.

`modules/lorefy-growth-features.js` adopts it only in rating-page portraits and
the image picker's current preview. Repainting a portrait disposes/removes only
previous media nodes, preserving Edit. Filtering/Load more/remote cast refresh
dispose old rows; page close cancels pending search and releases media; picker
close releases its preview. Existing account/save/provider guards are retained.
Legacy standalone fixtures without the shared owner retain their old fallback.

Retry has a character-specific AR/EN name and a polite clipped status, with
initials visible until successful decode. Retry and Edit are separate44px glass
targets, at top and bottom of the160px portrait. Retry stays present but inert
during a retry; repeated clicks do not issue another request. On recovery focus
returns to Edit when available. A52px picker preview uses4px insets for its44px
Retry. All surfaces use existing semantic theme tokens; no new art/colors/fonts.

## Verification

- Eight new tests fail before implementation: source/state ownership, deadline,
  single-flight/obsolete callback, missing/Arabic copy, lazy/disposal, replacement
  with Edit preserved, parent cleanup and independent glass control sizing.
  Focused character/gallery/ownership suite59/59; full source suite2915/2915.
  Picker test harness now extracts the actual portrait-release helper too.
-48 controlled actual UI cases: AR/EN x320/390/768, pink/dark. Independent44px
  Edit/Retry, unchanged image dimensions on recovery, missing image with Edit,
  current-preview recovery, picker disposal/focus return, row disposal after
  search, obsolete image event and page close with a pending search. Sampled
  score/custom-image/cache/library/review keys remain unchanged. No rating input,
  upload, automatic-image reset, save, publication or provider write clicked.
- Preview fixtures use an independent controlled URL to force failure; Chromium
  may reuse a successful decoded image for identical URLs even with no-store.
  This is test isolation, not a source rewrite or a claim of a cache defect.
  Fixture images use an existing local bitmap; no new artwork is shipped.
-66 fresh Work/Review Editor cases and5 boundary regressions still pass. Total119
  browser cases,0 uncaught page errors; isolated contexts closed. Provider-shaped
  URLs are intercepted, not evidence of live-provider or physical-device health.
- Six before/after geometry configurations preserve18 sampled portrait/card/list
  dimensions within1px. Representative320px AR portraits/picker screenshots
  inspected; media status does not reflow rows or cover rating inputs.
- Five entry/web assets selectively mirrored to both runtime copies, with hash
  parity and JS parse verification. Cache lorefy-v629-portrait-media; changed
  asset key20261029-portrait-media-v1. No Capacitor prepare/sync or new binary.
- External evidence: `artifacts/ui-execution-phase18-20261029/` contains focused/
  full logs, browser scripts/JSON, geometry snapshots, screenshots and verification.
  Initial failing test log is `artifacts/portrait-media-red.log`.

## Remaining

F07 is not complete. Character boards, public/rated character tiles, list faces,
picker candidate images and character-page work hero still have separate image
owners, as do profile avatars/banners and published review/quote attachments.
F08 edition grouping, real services/accounts and iPhone performance/accessibility
need independent acceptance. Visible deadlines/disposal do not abort native
image transport; pending identical URLs can be coalesced by the browser.

[[13-Project-Story]] | [[14-Feature-Coverage]] | [[systems/Language-Media]] |
[[systems/Explore-Works]] | [[systems/Profiles-Lists]]
