---
kind: session
status: local-verified-device-pending
date: 2026-10-24
---
# Atelier Perimeter Waves

The owner approved [[2026-10-24-Atelier-Header-Waves]] and requested the same
illustrated wave treatment on both sides and the bottom for all six new packs.
Local source only. No push, build, release upload or production enablement.

## Implementation

- [Renderer](../../modules/lorefy-motion-atelier.js) reuses each approved full
  header ribbon for the side/footer material. The old stretched static page body
  and its size-dependent page cache are removed from Atelier rendering.
- A bounded329-point perimeter follows the left rail, rounded bottom-left corner,
  footer, rounded bottom-right corner and right rail. The material is sampled by
  path distance, not stretched vertically to the viewport height.
- Mirrored texture tiles meet at identical source edge pixels. Water/ink flow
  continuously; the other materials sway/flutter with their existing poses. All
  return seamlessly to their twelve-second loop start. The shared scheduler and
  offscreen/background cleanup remain unchanged; no per-frame private timer.
- Actual raster drawing is clipped to24px side bands,36px lower corners and a
  12px footer band. The normal content and home-indicator gutter remain clear.
  This is source/browser geometry evidence, not physical safe-area certification.
- The existing header animation and avatar artwork remain unchanged. Three runtime
  files are versioned and selectively synchronized to both native web mirrors.
  No new asset generation, backend IDs, catalog gates or saved profile changes.

## Verification

- [Eight Atelier tests](../../tests/motion-atelier.test.js), including the new
  regression observed failing before implementation. Six materials x three sizes
  x25 timestamps check bounds, finite coordinates, connected corners, changing
  left/right/footer poses, loop continuity and bounded mesh work.
- Full source suite:2457 passed,0 failed/skipped/canceled.
- Browser matrix:36 cases, six packs x three layouts x320/440 widths. Arabic/light
  and English/dark, reduced-motion enabled. Actual widths matched; no ring/name
  overlap or biography overlap. Six complete gallery captures verified active IDs.
- Stable1280x720 screenshot pairs for every material had unchanged control rows.
  Changed pixels above20 RGB delta, in left/right/footer bands respectively:
  Inkstorm7991/7871/3989; Star Atlas5816/5437/2980; Sakura5131/5016/3191;
  Tidal10233/10010/4777; Signal6173/6480/3524; Paper6082/6134/3242.
  These are raster-motion evidence, not a device-FPS measurement.
- Screenshots and matrix/pixel JSON files remain in chat artifacts outside the
  repository. Gallery-only choices are restored to the owner's observed Sakura,
  Normal, Dark selection; application profile media/settings were not edited.

## Limits

No physical iPhone or low-memory/FPS certification. The six local-only pack IDs
remain deliberately absent from the production service whitelist.

[[systems/Appearance-Bundles]] | [[13-Project-Story]] | [[14-Feature-Coverage]]
