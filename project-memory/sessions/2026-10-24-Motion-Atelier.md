---
kind: session
status: local-verified-device-service-pending
date: 2026-10-24
---
# Motion Atelier: six original material frames

## Direction

Local source only. No push, native build, release upload or service change.
The owner liked the illustrated originals and requested actual rippling body
motion with a different material behavior per design. Canceling reduced motion
applies to these six frames; existing preferences and older collections remain.
Hidden/offscreen rendering still pauses through the shared scheduler.

## Research

Discord distinguishes [avatar decorations](https://support.discord.com/hc/en-us/articles/13410113109911-Avatar-Decorations-FAQ),
[profile effects](https://support.discord.com/hc/en-us/articles/4403147417623-Custom-Profiles)
and [profile frames](https://discord.com/blog/introducing-profile-frames-decorative-borders-to-make-your-discord-profile-museum-worthy).
The [Shop FAQ](https://support.discord.com/hc/en-us/articles/17162747936663-Shop-FAQ)
describes separate cosmetics. These are behavioral references, not evidence of
Discord's private animation implementation. Lorefy uses newly generated original
art and its own Canvas renderer, not downloaded Discord assets.

## Source

- [Renderer](../../modules/lorefy-motion-atelier.js): periodic twelve-second poses,
  overlapping raster-strip deformation and independent bitmap ornaments. Ink
  flows; stars rotate; sakura sways; water ripples; circuits get a traveling
  displacement; paper flutters. Page composition is cached with bounded entries.
- [Extraction](../../tools/extract-motion-atelier.ps1): splits transparent atlases,
  extracts alpha-connected ornaments and measures safe portrait apertures. Sparse
  page parts reuse matching avatar ornaments instead of generic particles.
- [Catalog](../../qa/motion-atelier/collections.json): six known IDs only on local
  demo with decorationLab=1. [Shop](../../modules/lorefy-profile-shop.js) rejects
  duplicate IDs, remote paths, live backend and production hosts. Existing paid
  catalog validation, billing and server appearance whitelist are unchanged.
- [Engine](../../modules/lorefy-frame-motion.js): one scheduler, Atelier-only
  preference bypass, shared page geometry and material-preserving connectors.
  [CSS](../../styles/lorefy-frame-motion.css) reserves thick-rim identity space,
  stacks narrow panoramic identity and clears Reader biographies.
- [Gallery](../../qa/motion-atelier.html): six animated previews and a public
  fixture with three layouts and light/dark choices. [Header QA](../../qa/profile-header.html)
  accepts motion=reduced. QA artwork remains local, not release-enabled/bundled.

## Evidence

- [Tests](../../tests/motion-atelier.test.js): distinct bounded periodic poses,
  real mount timestamp behavior under reduced motion, catalog gates and assets.
- All six avatar canvases were nonblank and advanced. Two real screenshots
  changed3379/2062/2279/3958/1916/2778 sampled rim pixels above20 total RGB delta.
- Final browser matrix:36 cases (six packs x three layouts x320/440 widths).
  Arabic/light at320 and English/dark at440, reduced-motion attribute enabled.
  No measured ring/name intersections; every biography begins below its ring.
- Actual demo shop:23 offers, Tidal Glass apply, unchanged avatar/banner, then
  Ribbon Bunny restored through UI and original media checked again.
- Modified runtime files selectively byte-synchronized to both native web mirrors.
  Raw browser screenshots/matrix stay in chat artifacts outside this repository.
- Final full source suite:2454 passed,0 failed/skipped/canceled. All six modified
  runtime files matched both mirrors. Final gallery console had no error entries.

## Limits

No physical iPhone, device-FPS/low-memory test, live cross-account projection or
new release. These six IDs deliberately remain absent from the server whitelist.
Release needs separate native asset sizing and device review.

[[systems/Appearance-Bundles]] | [[13-Project-Story]] | [[14-Feature-Coverage]]
