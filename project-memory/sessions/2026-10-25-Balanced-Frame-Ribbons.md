---
kind: session
status: source-browser-verified-device-pending
date: 2026-10-25
---
# Balanced Upper Frame Ribbons

Follow-up to [[2026-10-25-Compact-Frame-Headers]]. The owner rejected the thin
upper connector and undersized ornament. The earlier geometry checks did not
measure how much of the connector texture was actually opaque.

## Cause and Repair

- The real-page material sampler rotated a wide source rectangle containing
  mostly transparent pixels into an 8px strip. The visible material became a
  hairline even though the connector's geometric box was nonzero.
- `materialPixels` now selects the dominant opaque strand from each source row,
  excluding disconnected particles and transparent padding. It normalizes the
  strand cross-section and mirrors the long texture for a continuous loop.
- Upper connectors use a 13px drawing band, visually matching the side ribbons.
  They remain near the banner edge until clear of the toolbar buttons, then
  rise to the two ornament attachment points. Nothing crosses the face.
- The ornament has a modest middle size: maximum 184px width / 64px height on
  larger screens, with the existing separate row retained below 380px. These
  limits supersede the previous 166px / 56px values, not the above-banner rule.
- Original side/PFP animation, saved media, selected parts, IDs, prices and
  eligibility are unchanged. No new package, service or external plugin.

## Fresh Evidence

- Three regressions were observed failing before implementation: opaque texture
  coverage, substantial control-safe connector paths, and readable ornament size.
- Full suite: **2482 passed, zero failed**. Synthetic narrow-strand texture
  coverage must occupy at least 75% of its strip, rather than pass on box size.
- **234 fresh browser cases**: all 39 restored frames, all three layouts, widths
  320/440 with Arabic/light and English/dark variants. No text/PFP overlap,
  horizontal overflow, missing motion canvases or out-of-viewport avatar frames.
- Reviewed the exact Ribbon Bunny panoramic gallery state from the report, plus
  the actual demo-owner reader profile. The upper material is visibly a ribbon,
  not a hairline. Screenshots and JSON are outside the repository in this chat's
  artifacts (`balanced-*`, `balanced-ribbon-tests.txt`).
- Three changed runtime sources are byte-mirrored to both native web source
  trees. Cache: `lorefy-v585-balanced-frame-ribbon`.

No GitHub push, native build, Apple upload or real-account write. Device frame
pacing and the owner's aesthetic approval remain open; source tests do not
certify either. Historical compact-header results are superseded for this top
composition only.

## Corner Follow-Up

The owner subsequently rejected the two square joins to the side rails. A
horizontal connector and independently warped vertical art had unrelated
endpoints/tangents; increasing thickness did not fix that discontinuity.

- `pageJoins` now measures each real side's own opaque strand and maps the
  attachment point, thickness and upward tangent through the same animated skin.
- Cubic corner connectors start exactly at those moving points and become
  horizontal with a matching tangent. The obsolete vertical stub above each
  attachment is clipped out; it no longer protrudes through the rounded corner.
- Left/right source textures are sampled separately. Texture phase is fixed at
  the real-page seam, with flow introduced gradually away from it. Ring-only
  page frames use their actual perimeter points/tangents instead.
- Crest size/location, body/PFP behavior, stored selections and catalog gates
  remain unchanged. Temporarily collapsed previews safely defer side rendering.
- Fresh final verification: **2484 source tests pass** and **234 browser cases**
  pass across 39 frames, three layouts and widths 320/440. New regressions cover
  exact moving endpoints, tangent continuity, independent right material and
  collapsed preview safety. Prior 2482 counts above are historical.
- Reviewed both rounded Ribbon Bunny corners in the panoramic gallery and actual
  demo-owner profile, plus representative original/basic frames. New evidence is
  outside the repo under `frame-joints-*` and `joint-*` artifacts. Native/device
  performance and the owner's aesthetic approval remain unverified.
- Current cache: `lorefy-v586-continuous-frame-joints`. Three runtime files are
  mirrored to both native web source trees. No push, binary build or cloud write.

[[systems/Appearance-Bundles]] | [[13-Project-Story]] | [[14-Feature-Coverage]]
