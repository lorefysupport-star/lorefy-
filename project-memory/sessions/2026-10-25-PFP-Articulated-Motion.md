---
kind: session
status: local-verified-device-pending
date: 2026-10-25
---
# PFP Articulated Motion

The owner reviewed the previous implementation in a5.6-second clip and clarified
that PFP frames must perform actual actions, not just whole-PNG wobble. Page
borders were approved and must remain unchanged. Future character/animal frames
were context, not a request to create those assets now. Local-only source work;
no push, native build, service changes or production pack enablement.

## Implementation

- New [PFP rig](../../modules/lorefy-avatar-rig.js) is separate from the shared
  [Atelier renderer](../../modules/lorefy-motion-atelier.js). It receives the same
  shared scheduler time. No private runtime loop, framework or new dependency.
- Removed whole-image horizontal strip wobble from the avatar branch. That branch
  now clips the protected portrait aperture and draws independently cached layers.
  The page header/perimeter/ornament branch is unchanged.
- Water: three independently transformed breaking-crest layers, advected bitmap
  foam/current around the ring, and18 ballistic spray instances with launch/fall
  and fade lifetimes. Ink has independent layers, an advected stream and12 drops.
- Organic sectors use feathered alpha masks rather than hard radial pie slices.
  A restrained static material anchor maintains continuity. Masks are prepared
  once at128px resolution and sampled smoothly into the512px artwork layers.
  No image readback or mask creation in the animation loop.
- Astrolabe: fixed outer material and independently rotating inner gear, with
  orbiting star sprites. Sakura has three articulated swaying branch layers and
 12 wind-driven falling petals. Tech has eight sequentially opening/closing panels
  and separate chip poses. Origami has orbiting birds with separately pivoted
  left/right wing masks and a central body layer.
- Pivots, per-layer rotation/translation/scale, particle trajectories and wing
  channels support separate illustrated parts. This is not a complete character
  animation editor; future cats/eyes/tails still require appropriate artwork and
  authored joints/poses. No claim that such a collection has been created.
- [Focused QA](../../qa/avatar-animation.html) displays a larger single PFP and
  six selections. Its optional local video export renders the actual code at
 640x640, preserving the same center-cover portrait crop as the live view.
  Recording's temporary loop is confined to this QA page, not app runtime.
- Helper script is ordered before the renderer in index and both existing QA
  pages. Runtime source/cache references updated and selectively mirrored to
  both existing native web trees. QA assets/videos stay outside native releases.

## Verification

- [Rig tests](../../tests/avatar-rig.test.js) observed failing before implementation:
  missing layer rig, insufficient crest overlap/feather masks and zero-phase flow
  blinking. Four rig tests now cover independent action timelines, bounds, loop
  joins, feather masks, unknown styles and script/export integration.
- Focused rig/motion/frame/shop tests:51 passed. Final full source suite:2461
  passed,0 failed/skipped/canceled. Four runtime files match both web mirrors.
- Actual screen pairs for all six frames: changed artwork pixels above20 RGB
  delta were18018/12451/9735/28165/4962/2593. Protected portrait-center pixels
  changed0 in every pair; screenshot geometry stayed fixed.
- Browser matrix:36 cases, six frames x three layouts x320/440 widths. Arabic/
  light and English/dark, reduced-motion enabled. No ring/name or bio overlap;
  page and avatar canvases loaded and painted in every case.
- Six-frame contact sheet and actual-renderer water/origami videos were visually
  reviewed. Final water MP4: H264,640x640,30fps,180 frames,6seconds. Earlier hard-cut
  crest clips were superseded. Raw references, exports and screenshots remain
  outside the repository in the chat artifacts/download folders.

## Limits

This is layered raster animation, not a fluid simulation. Browser capture is not
physical-iPhone FPS, memory-pressure or safe-area certification. Live cross-account
appearance remains outside the six local-only IDs' current scope. No real profile
media/account selections were saved by this follow-up.

[[systems/Appearance-Bundles]] | [[13-Project-Story]] | [[14-Feature-Coverage]]
