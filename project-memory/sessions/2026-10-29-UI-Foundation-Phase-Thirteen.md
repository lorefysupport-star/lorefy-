---
kind: session
status: source-browser-verified-device-pending
date: 2026-10-29
---
# Managed cover states: Explore items and Work poster

Continuation of [[sessions/2026-10-28-UI-Foundation-Phase-Twelve]]. Existing
UI/UX Pro Max, Apple, test-first/debugging and Playwright guidance used. Plugin
Management selected installed tools; no new dependency. Local source work only.

## Reproduced

A native404 on the actual Work poster replaced its original src with a generated
data SVG through the legacy error path; there was no visible Retry cover action.
The global image guard also painted a fallback behind remote images. A failed
original could therefore look like a different loaded cover rather than a failed
request. Existing image-source/lazy/stale callback guards remain important.

## Scope and implementation

- New `modules/lorefy-cover-media.js` owns loading/ready/error/missing for opted-in
  React images. Native image events, a5500ms visible-request deadline and lazy
  IntersectionObserver determine status. No generated source replacement and no
  automatic request retry. Explicit Retry creates one new image attempt; duplicate
  pending taps are ignored. Generation/ref/lifetime checks invalidate stale events
  and deadlines. Success/unmount release listeners, observers and timers.
- Empty sources or an original source equal to its explicit generated fallback
  get a neutral missing state without a request. Other custom local data/blob
  sources remain eligible. This is a display choice, never a stored-cover change.
- A render callback lets Explore place Retry as a sibling of Open work, not a
  nested native button. Work poster uses the default noninteractive wrapper with
  a separate44px Retry. Messages/tooltips are direct AR/EN and theme-aware.
- `styles/lorefy-cover-media.css` reserves2:3 geometry, keeps loaded source pixels
  full-size, and provides quiet token-based placeholders and glass Retry. No
  layout animation, new imagery, catalog/provider rewrite or account persistence.
- `modules/lorefy-explore-studio.js`: opt-in item covers in search, rails and
  collection dialogs. Main feature/background art, format-tile art and existing
  open/ranking/filter callbacks remain unchanged.
- `modules/lorefy-review-editor.js`: WorkIdentity poster opts in; hero artwork,
  cover-picker choices and source-save logic are not changed. Legacy component
  fallbacks remain available when the new module is absent.
- `index.html`: the existing global image guard skips `data-lorefy-cover-managed`
  images so two owners do not compete. Other images and picker behavior retain
  their existing guard. New CSS loads before cinematic image sizing rules, and
  the module before consumers. Cache `lorefy-v624-cover-media`; changed/new module
  asset version `20261029-cover-media-v1`. Six web assets selectively mirrored to
  both runtime copies; no native prepare/sync/build.

## Verification

-15 new source regressions:13 initial failures and two material/asset gate
  failures were observed before fixes. Unit cases cover bounded requests, lazy
  deadlines, same-URL retry, late events, source keys, unmount cleanup, custom
  local images, no nested controls and direct labels.
- Full suite2874 passed,0 failed. Existing legacy image resilience/lazy/picker
  tests remain green. The earlier byline rendering fixture now provides the
  consumer's root dependency while keeping the same source-string/callback checks.
-43 browser cases,0 uncaught page errors:27 Work poster fixtures and16 actual
  Explore/lazy checks. AR/EN,320/390, pink/dark/custom green. Controlled404, held
  responses, successful retry, timeout, old-source failure, missing/explicit
  fallback, stable dimensions and actual nonblank decoded image checked.
- Actual Explore Retry is44px, outside its Open work button, and keyboard retry
  does not navigate. The separate Open work action still selects the expected ID.
  An unchanged catalog rerender keeps the ready image node. Far-offscreen lazy
  media starts no request until brought into view. Default/selected themes stay.
- Browser fixtures use intercepted local images/requests, not real provider
  outages or production writes. Sampled library/progress/favorites stay unchanged;
  contexts closed. Screenshots inspected for failed Work and Explore surfaces.
- External evidence: `artifacts/ui-execution-phase13-20261029/` contains scripts,
  JSON, screenshots, full test log and parse/byte-parity verification.

## Remaining

This is the first F07 consumer batch, not a full media migration. Library and
Profile cover layouts, Home cards, legacy/public-profile image consumers, feature
art and format tiles still use their existing paths. Preserve shelf/Showcase
geometry when adopting the new state contract next. Cover picker remains its own
owner. Provider availability/CORS, native image permissions/performance and device
accessibility are separate gates. F08 edition grouping and the27-unit plan remain
open. No GitHub, Apple, Supabase write, actual save or native build occurred.

[[13-Project-Story]] | [[14-Feature-Coverage]] | [[systems/Language-Media]] |
[[systems/Catalog-Search]]
