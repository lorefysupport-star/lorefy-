---
kind: session
status: source-browser-verified-device-pending
date: 2026-10-27
---
# Glass Depth and Typography

Follow-up to [[2026-10-27-Ready-Themes-Hero-Bounds]]. The owner rejected the
flat material and remaining text presentation. Inspection reproduced90% opaque
controls with only a faint12.5% white sheen and solid page backgrounds. A computed
blur property was not evidence of a visibly translucent material.

## Source

- `modules/lorefy-design-system.js`: per-palette material tokens,62% light/68%
  dark control fill,86% sheet fill, stronger reflection, three-stop chromatic page
  wash and backdrop blur/saturation/brightness. Ink, secondary and action colors
  are bounded for contrasting backdrops and the reflection peak. Custom hue,
  semantic page palette and saved account choices are not changed.
- `styles/lorefy-glass-materials.css`: earliest named important layer reuses
  those materials across chrome and all original profile layouts. Variables are
  also declared at profile roots so public owner tokens remain authoritative.
  Controls use the clearer material; reading/review sheets use the denser one.
  Reduced transparency and unsupported blur retain opaque surfaces.
- Uses the already-configured Readex Pro for Arabic and a system stack for
  English. Navigation labels become12px; book captions13px with coherent weight,
  wrapping and line-height. Existing cover geometry and original section order
  remain. No new font dependency or artwork, frame-motion or account-data change.
- Cachev603, material CSS/design-system asset20261027-glass-depth-v3. Selective
  web-mirror synchronization is source-only, not a native build.

## Evidence

Four new source checks failed before implementation. Focused30-case source
run passed. The existing112-case browser matrix was rerun after waiting for
`document.fonts.ready`:36 bilingual profile cases,40 main-route/theme cases,
36 direct long-title/poster geometry cases. No tested overflow or title overlap.

An isolated DOM-only QA backdrop was placed behind real navigation, changed to
black/white/red/blue/green, then removed. Actual screenshot pixels changed by
35-62 channel levels between red and blue in five themes, demonstrating visible
transmission. Sampled inactive/active navigation ink contrast stayed at least
5.12:1. This is evidence for the sampled chrome positions, not a complete WCAG
or physical-device certification. No diagnostic backdrop ships in runtime code.

Computed Pink page wash has three distinct stops; controls use rgba alpha.62,
stronger reflection and26px blur. CDP reduced-transparency test yielded an opaque
surface and blur none. Before/after images and executable pixel/matrix scripts
are in the parent task artifacts directory, outside Git/vault.

Final `npm test`:2595 passed,0 failed,exit0,53.9 seconds. Four runtime assets
selectively match both web mirrors (8 SHA256 comparisons); no native preparation.
Local only: no commit/push, native build, Apple upload or backend mutation.
Owner visual approval, actual iPhone FPS/typography/VoiceOver and live account
synchronization remain separate gates.

[[systems/Appearance-Bundles]] | [[systems/Profiles-Lists]] |
[[13-Project-Story]] | [[14-Feature-Coverage]]
