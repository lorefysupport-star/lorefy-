---
kind: session
status: local-verified-device-pending
date: 2026-10-25
---
# Elven Local Motion

Visual follow-up: [[2026-10-25-Elven-Frame-Repairs]] supersedes the static page
base, cut-out PFP layer masks and conservative portrait geometry described here.
The initial implementation and its historical evidence remain recorded below.

## Owner Direction

Continue the six selected ear/woodland designs from [[2026-10-25-Elven-Concepts]].
The owner requested a free alternative or professional local implementation, not
another paid subscription. Earlier unrelated moon/court concepts remain unapproved.
No GitHub push, production service change, native build, trial, purchase or paid
generation was performed. Existing avatars/banners and previous packs are preserved.

## Research and Choice

- Plugin search for Rive/Lottie/animation returned installed Figma/Runway and an
  unconnected video-generation provider, not a verified free frame-authoring tool.
  No additional plugin was suggested or connected.
- [Rive pricing](https://www.rive.app/pricing) and
  [PixiJS meshes](https://pixijs.com/8.x/guides/components/scene-objects/mesh) were
  reviewed as alternatives. Neither is needed to extend this existing renderer.
- Used the standard [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
  and the existing shared Lorefy scheduler. No new runtime dependency, external
  image upload, generation service, credit charge or watermark.
- Previously installed motion-design/ui-animation skills inform independent
  pivots, secondary follow-through, cached work and offscreen/background pause.

## Implementation

- [Source rig definitions](../../qa/elf-motion/rig-source.json) describe original
  source-pixel regions/pivots for exactly1A-1C and2A-2C.
- [Deterministic extraction](../../tools/extract-elven-art.ps1) separates the
  original two approved comparison sheets by alpha components. The one joined
  woodland avatar/page component has an explicit source-space separation line.
  Antialiased edges are retained, almost-transparent backdrop pixels excluded.
- Six512x512 PFPs and512x768 page frames are normalized with16px minimum margins.
  Portrait calibration uses a distance field and720-ray alpha validation, with a
  further4px clearance. Thin chains/jewels make some apertures narrower than.4;
  only the new local catalog permits.35. Old catalog geometry rules are unchanged.
- [Elven renderer](../../modules/lorefy-elven-motion.js) caches a fixed base plus
  four/five independently cropped pieces per pack. Feathered attachment masks
  and fixed ear roots avoid hard cut lines. No entire-PNG rotation or wobble.
- Ear pairs have separately delayed intermittent twitches below3.2degrees, long
  resting phases, and independent jewelry or silk movement. Woodland leaves sway;
  ranger arrow tips/fletching have separate channels; autumn moth wings fold from
  separate pivots and amber ornaments swing. The portrait aperture is clipped out.
- Page artwork retains its composition using existing shared page-art geometry.
  Compact original jewel/foliage glyphs animate separately at the top, both sides
  and footer. This is ornament motion over a stable border, not fluid simulation
  or a claim that every original page-frame pixel deforms.
- One existing30fps scheduler per document drives mounted parts; no extra runtime
  animation loop. Offscreen/hidden entries stop rendering and cleanup is shared.
- [Catalog installer](../../modules/lorefy-profile-shop.js) strictly accepts six
  known local paths/IDs, `releaseAllowed:false`, localhost+decorationLab+demo only.
  Live/remote/duplicate inputs are rejected. Existing Atelier and paid/beta packs
  remain unchanged. Account media is not replaced; no production ID projection.
- Existing articulated-rim identity clearance also applies to Elven packs.
- [Live gallery](../../qa/elf-motion.html) displays six moving PFPs and the real
  public-profile component in normal/immersive/reader layouts with light/dark
  controls. [Focused QA](../../qa/avatar-animation.html) supports the elven
  collection and exports a local recording of the actual renderer.
- Original concept gallery links to the live gallery; the old ear-only study is
  retained as historical QA, not the current runtime implementation.
- Runtime entry/cache references updated to lorefy-v580-elven-local. Exactly five
  modified/new runtime files were byte-mirrored to both native web snapshots.
  QA artwork stays excluded from native/release packaging. No native build ran.

## Fresh Evidence

- TDD: renderer/catalog tests failed before the implementation, then passed.
  Focused tests verify material-specific bounded transforms, twelve-second joins,
  safe page bands, input rejection, local gating and scheduler cleanup under both
  reduced-motion signals. New packs retain the owner's explicit always-moving
  choice; legacy preference behavior is unchanged.
- Full suite:2466 passed,0 failed,0 skipped. Log outside repo:
  `artifacts/elven-full-tests.txt` in the chat workspace.
- Browser36-case matrix:6 packs x3 layouts x320/440 widths. Arabic/light small
  and English/dark large with reduced-motion state. Both canvases load in every
  case; no horizontal overflow, ring/name overlap or ring/bio overlap. Public
  fixture is fictional; this is not a second real account/device test.
- Six actual screenshot pairs: changed artwork pixels1095,3578,3682,5981,1293,
  6841 respectively; protected portrait-center changes0 for ALL six. Captures and
  `elven-pixel-results.json` stay outside the repository.
- Actual local renderer video:12seconds,640x640,H.264,30fps,360frames, combining
  ear and autumn examples. `artifacts/elven-motion-demo.mp4` outside repo.
  Encoded30fps is not evidence of physical-device frame pacing.
- No browser error logs in the inspected gallery/focused view.

## Remaining Limits

Physical-iPhone FPS, memory/thermal behavior and safe areas remain unverified.
Owner/visitor real-account persistence and a production catalog rollout were not
performed. These are local-demo development packs, not released commercial assets.
The portrait remains static; only the ornament layers animate. Source test success
and local screen recordings do not certify a new native version.

[[systems/Appearance-Bundles]] | [[13-Project-Story]] | [[14-Feature-Coverage]]
