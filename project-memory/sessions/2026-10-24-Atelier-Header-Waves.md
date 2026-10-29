---
kind: session
status: local-verified-device-pending
date: 2026-10-24
---
# Atelier Header Waves

Follow-up to [[2026-10-24-Motion-Atelier]]. The owner reported that the upper
border was a thin straight line and requested a real wave across all six packs.
Local source/artwork only; no push, native build or service changes.

## Cause And Repair

- The previous shared connector rotated rail artwork into a four-pixel band.
  Horizontal-only body displacement could not turn that band into a visible wave.
  The central cropped top artwork also left hard rectangular cut edges.
- Six newly generated transparent illustrated ribbons now replace the entire
  static top band, including its cut-off crest/corners. Each uses the approved
  original collection's materials, not Discord artwork or a solid colored line.
- [Atelier renderer](../../modules/lorefy-motion-atelier.js) deforms the complete
  bitmap in64 vertical strips, with per-material wave amplitude, phase, thickness
  and arch. The twelve-second loop is periodic and continues under reduced motion.
- [Shared geometry](../../modules/lorefy-frame-motion.js) still measures/reserves
  header, rails and footer. Only materialConnectors packs skip the old static top;
  older original collections are unchanged. No separate animation scheduler.
- [Extraction tool](../../tools/extract-atelier-headers.ps1) uses verified alpha
  gutters, tight crop bounds and removal of near-transparent noise. Originals
  remain intact outside the repository. New header.png files stay in local QA.
- [Frame CSS](../../styles/lorefy-frame-motion.css) suppresses the legacy duplicate
  public Reader banner back button for Atelier only; the toolbar action remains.
  This prevents an empty duplicate control from interrupting the new ribbon.
- Versioned runtime source and cache updated and selectively synchronized to both
  existing web mirrors, without generating a native binary.

## Verification

- [Regression tests](../../tests/motion-atelier.test.js) were observed failing
  before implementation: no header geometry, missing full ribbon artwork, static
  crest still drawn and duplicate Reader back button. They now pass, alongside
  existing frame geometry and preference/scheduler contracts.
- Browser:36 combinations (six packs x three layouts x320/440 widths), with
  reduced-motion enabled and light/dark variants. Measured widths matched; no
  ring/name intersections, biography overlaps or duplicate Reader back controls.
- Six actual gallery captures were checked against the active decoration ID,
  avoiding capturing the previously selected iframe during asynchronous navigation.
  Water, ink, brass, blossoms, circuits and folded paper are visible in the headers.
- Screenshots and matrix remain in the chat artifacts folder, outside this vault.
- Final full source suite:2456 passed,0 failed/skipped/canceled. All five modified
  runtime files matched both existing native web mirrors byte-for-byte.
- Stable1280x720 screenshot pair:12013 header-band pixels changed above20 RGB
  delta while the control row had0 changed pixels. Earlier transient clipped
  captures were discarded; no movement claim relies on a changed viewport.

## Limits

No physical-device performance test or production enablement. Existing avatar,
banner and saved decoration selections were not modified by this follow-up.

[[systems/Appearance-Bundles]] | [[13-Project-Story]] | [[14-Feature-Coverage]]
