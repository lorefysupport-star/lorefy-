---
kind: session
status: source-browser-verified-device-pending
date: 2026-10-29
---
# Work hero and draft review image recovery

Continuation of [[sessions/2026-10-29-UI-Foundation-Phase-Sixteen]]. Existing
Plugin Management, UI/UX Pro Max error-recovery guidance, Apple patterns,
test-first debugging and Playwright used. No new plugin or runtime dependency.
Local source only; no GitHub, native build, account publication or service write.

## Implementation

- `modules/lorefy-review-editor.js`: WorkHeroMedia uses the shared lifecycle,
  with decorative art hidden from assistive technology and a separate named
  Retry artwork button. The main Work hero retains its original source, crop,
  gradient, navigation and size. Hero fetch is eager/high priority.
- The Review Editor mini work cover uses the same owner at its existing60x90
  dimensions. The caller passes legalCoverOf explicitly: a known generated
  fallback is a missing surface rather than substitute art. Custom covers stay
  eligible; title/creator and draft editing do not depend on image availability.
- Draft attachments opt in with kind=image and AR/EN image-specific copy, not
  cover copy. Duplicate URLs retain ordered slots; removal uses the existing
  guarded parent callback. No upload, publication or saved-review data changed.
- Attachment tile reserves96x124 with a96x72 image and separate44px Retry/Remove
  slots below,8px apart. Inspection caught a legacy72px unlayered rule overriding
  the initial normal layered height; important scoped dimensions now prevent
  attachment controls overlapping the attach/paywall action. All colors remain
  semantic theme tokens; no new artwork, palette, font or motion introduced.
- Shared lifecycle remains bounded at5500ms, explicit retry only, old callback
  guards and teardown. Native image fetch is not abortable by this state owner;
  browsers can coalesce a still-pending identical URL. Boundary verification
  releases an expired fixture response before retry, not a false abort claim.
- `tools/patch-work-hero-media.mjs` guards the exact minified hero and composer
  caller edits; `tools/refresh-work-editor-media-assets.mjs` selectively mirrors
  six entry/web assets to both runtime copies. Cache lorefy-v628-work-editor-media,
  asset key20261029-work-editor-media-v1. No Capacitor prepare/sync or build.

## Evidence

- Seven new regressions. Five adoption/geometry cases plus shared picture-copy
  failed before fixes; explicit fallback caller test also failed before patch.
  Existing ownership harness now provides the caller's legalCoverOf dependency;
  account-switch/late-publish/image-upload guards still pass. Full suite2907/2907.
-66 actual UI cases: AR/EN x320/390/768, pink/dark. Hero, mini cover and picture
  failure/recovery retain dimensions; original-key fixtures decode; no nested
  buttons, separate44px actions,8px control gap, no flow overlap, preserved draft
  text, ordered mock removal, editor Close and sampled stored-state invariance.
  Hit target bound permits0.01px Chromium float rounding, not smaller CSS sizes.
- Five boundary cases: visible deadline/no background retry loop, obsolete
  image event after recovery, missing hero with identity/back, missing mini
  cover with work title, and removable missing attachment. No real upload/save.
-36 fresh Explore/friend/review cover regression cases still pass. Total107
  browser cases,0 uncaught errors, all isolated contexts closed. Fixture removal
  changes only a local wrapper; production remove callback checked by unit tests.
- Six before/after geometry configurations compare24 hero/mini/work-row/sheet
  elements within1px. Attachment tile size intentionally grows to fit controls.
  Representative AR/EN mobile screenshots inspected. This is not device QA.
- External evidence: `artifacts/ui-execution-phase17-20261029/`: red/focused/full
  logs, controlled browser scripts/JSON, before geometry, screenshots and hash/
  syntax verification. Intercepted provider-shaped URLs are not live-provider QA.

## Remaining

F07 remains open for profile banners/avatars, character portraits, published
review uploads/quote media and picker internals. Character provider hydration is
not the UI owner; actual portrait UI in growth features needs its own DOM
lifecycle cleanup, not a broad data-provider rewrite. F08 edition grouping and
physical iPhone, real providers/accounts and native accessibility/performance
acceptance remain independent gates. No real review was published or removed.

[[13-Project-Story]] | [[14-Feature-Coverage]] | [[systems/Language-Media]] |
[[systems/Catalog-Search]] | [[systems/Community-Notifications]]
