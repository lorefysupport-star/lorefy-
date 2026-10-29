---
kind: session
status: source-browser-verified-device-pending
date: 2026-10-25
---
# Existing Frame Catalog Restoration

The owner requested the same page/PFP quality repairs across the existing Lorefy
catalog after [[2026-10-25-Elven-Frame-Repairs]]. This session changes local source
and selectively mirrored native web source only. No GitHub push, native binary,
Apple upload, cloud migration, purchase or real-account write occurred.

## Inventory and Root Causes

- 39 existing IDs: three basic atlas frames,24 imported PFP Vibes frames and12
  illustrated collections. Offered/hidden catalog membership remains unchanged.
- Most old avatars were a static raster with moving generic particles. Some
  page borders stretched the same PFP raster or narrow connector samples.
- The original illustrated `page.png` assets can contain a colored backdrop;
  restoration reads their already-clean `page-still.png` counterparts instead.
- Default portrait geometry did not follow each actual opening. A wide-offset
  Moth Lantern rim also exposed the header's width-only text-clearance estimate.

## Implementation

- [Frame directions](../../tools/frame-restoration-spec.json) assign material/
  character action families to all39 unchanged IDs. The deterministic
  [preprocessor](../../tools/prepare-frame-restoration.ps1) derives normalized
  transparent avatars and72-point inner-rim photo contours from existing source
  art. Sources are retained unchanged. Rotor materials have circular clearance.
- [Restoration renderer](../../modules/lorefy-frame-restoration.js) uses cached
  connected texture skins for ears/tails, wings, reaching, breathing, flame/water
  displacement, mechanical rotation, local eye closure and other material modes.
  Eye regions are detected from bounded white components; the source drawing is
  retained, not replaced with a new procedural face. These are raster deformation
  rigs, not hand-authored character sprite animations or physical fluid simulation.
- [Shared bitmap core](../../modules/lorefy-bitmap-rig.js) is reused by the elf
  renderer, preserving its existing authored poses. No new package or private
  runtime animation loop is introduced.
- Page rails follow continuous top/side/footer curves using cached original
  material strips. Real illustrated crests keep their proportions and connected
  secondary motion. Ring-only collections derive their matching rail material
  from the original circumference rather than stretching an entire ring.
- [Decorator](../../modules/lorefy-profile-shop.js) overlays renderer/geometry
  metadata without changing catalog IDs, eligibility, prices, entitlements,
  selected parts, account storage, profile avatars or banners. Missing calibration
  falls back to existing renderers. Basic-only catalogs do not enable beta IDs.
- [Header geometry](../../modules/lorefy-profile-header.js) now includes actual
  directional rim offset in text clearance. Scoped
  [frame CSS](../../styles/lorefy-frame-motion.css) reserves crest/identity space.
- Restored offscreen storefront cards defer bitmap-rig loading until visible.
  The existing single scheduler still pauses hidden/offscreen drawing. A failed
  manifest request can retry, and viewed fixed artwork is cached for reuse by
  the service worker. Unseen artwork is not claimed pre-cached for offline use.

## Fresh Verification

- Full suite: **2475 passed, zero failed**. New regressions were observed failing
  before repair: missing restoration, asymmetric inset, manifest retry and eager
  offscreen allocation. See [restoration tests](../../tests/frame-restoration.test.js)
  and [header tests](../../tests/profile-header-extent.test.js).
-306 browser cases cover all51 frames (39 restored plus both six-pack local
  batches), three layouts and widths320/440. Arabic/light and English/dark cases
  verify actual viewport width, two loaded canvases, no horizontal overflow,
  name/bio clearance and bounded PFP geometry. The Moth Lantern English reader
  overlap was reproduced, repaired and the reader matrix rerun successfully.
-39 screenshot pairs show changed artwork on all four page edges and the PFP.
  The protected inner portrait core, measured14px inside the source aperture,
  has zero changed pixels. Small near-boundary differences under the earlier4px
  inset remain recorded as `portraitFringe`; their exact compositing/rasterization
  cause is not certified. Do not describe the entire aperture as pixel-invariant.
- Actual demo-owner profile opened with its previously selected Ribbon Bunny
  frame/page and two moving canvases; the selection was not changed. The in-app
  storefront opened with the existing offered membership. No real user data was
  edited and no live owner/visitor persistence guarantee is inferred.
- Actual renderer video exports were recorded for Ribbon Bunny and Moth Lantern.
  The local comparison gallery is [Frame Restoration](../../qa/frame-restoration.html).
- Test logs, screenshots,306-case JSON, pixel counts and video are outside the
  repository under this chat's `artifacts/frame-restoration-*`,
  `all-frame-layout-matrix.json`, `restored-frame-*` and `restored-*` files.
- Nine changed runtime source files and the40-file derivative-art directory are
  selectively mirrored into both native web source directories. Cache version:
  `lorefy-v582-frame-restoration`. This is not a native compile or distribution.

## Remaining Acceptance

Physical iPhone frame pacing, thermal/memory behavior, native safe areas and
real-account acceptance remain untested. Existing imported-art release/rights
flags, beta gates and privacy/release requirements are not changed. The owner
must still approve these visual results; green geometry tests are not aesthetic
approval or a claim of production readiness.

[[systems/Appearance-Bundles]] | [[13-Project-Story]] | [[14-Feature-Coverage]]
