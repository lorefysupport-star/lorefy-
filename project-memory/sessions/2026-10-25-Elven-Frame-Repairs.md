---
kind: session
status: local-browser-verified-device-pending
date: 2026-10-25
---
# Elven Frame Repairs

Supersedes the page/PFP visual acceptance of [[2026-10-25-Elven-Local-Motion]].
The owner supplied screenshots showing smeared static page connectors and
misaligned/cut PFP artwork. Work remains local-only on the six approved elf
designs. No paid service, new dependency, GitHub push, native build, production
catalog enablement, real account write or original media replacement.

## Causes and Repairs

- The generic page five-slice painter stretched tiny raster bands into wide
  connectors. The elf renderer no longer calls that painter. It draws a cached
  mirrored material strip along continuous animated top/side/footer curves;
  the original central crest retains a uniform aspect ratio.
- All four page edges now move. Material-specific periodic fields give silk a
  traveling fabric wave, woodland a soft bending gust, ranger trim a faster
  feather-like response, and jewel/ivy materials smaller slower movement.
- Polygon cut-outs could remove supporting branches and overlap earlier masks.
  The PFP now uses a cached occupied-triangle skin with smooth per-part weights.
  No polygon holes are punched into the raster. Ears retain their small twitches;
  fabric, jewelry, leaves, feathers and wings retain separate authored poses.
- The nearest dangling jewel incorrectly defined the portrait radius. Extraction
  now distinguishes the protected central aperture from a 72-point inner-rim
  portrait contour with a small underlap. The picture fills the opening behind
  the original ornaments, without a circular gap or protruding photo corners.
- The portrait contour is used consistently by local catalog cards, the focused
  PFP/video exporter, and the shared owner/public-profile decorator. The overall
  PFP artwork footprint stays approximately 176px across all six designs.
- Elf page frames reserve crest clearance. Reader's stronger fixed-height CSS
  needed a scoped override; normal/immersive and reader have different cover
  reservations. Horizontal inset uses the larger asymmetric rim overhang.
  Legacy and previously approved Atelier frames are not rethemed or rewritten.

## Source and Verification

- [Renderer](../../modules/lorefy-elven-motion.js),
  [catalog/decorator](../../modules/lorefy-profile-shop.js),
  [scoped geometry](../../styles/lorefy-frame-motion.css),
  [deterministic extraction](../../tools/extract-elven-art.ps1),
  [regressions](../../tests/elven-motion.test.js).
- Two new regression tests failed before the fix, then passed. Full suite:
  **2468 passed, zero failed**. Cache version is `lorefy-v581-elven-repairs`.
- 36 current browser cases: six packs, normal/immersive/reader, widths320/440.
  Small cases are Arabic/light; large cases English/dark. Verified actual
  viewport width, both moving canvases, no horizontal overflow, no name/bio
  intersection, no PFP escape, polygon portrait mask and crest clearance.
- Screenshot-pair pixel comparisons on each pack show actual changed pixels on
  all four page edges and on the PFP, while the protected portrait core is static.
  Evidence and raw measurements live outside the repository under this chat's
  `artifacts/elven-repairs-*` and `artifacts/elf-repair-*` files.
- PFP video export recorded the actual Opal Silk renderer, not generated media.
- Five changed runtime files are selectively mirrored into both native web
  source directories. This is source synchronization, not compilation.

## Limits

No physical iPhone frame pacing, thermals, memory, native safe-area acceptance
or real owner/visitor persistence was certified. Browser measurements use the
fictional public-profile fixture. Page ribbons are animated raster-material
paths, not physical fabric simulation; the original crest and source identity
remain recognizable. Production rollout is deliberately disabled.

[[systems/Appearance-Bundles]] | [[13-Project-Story]] | [[14-Feature-Coverage]]
