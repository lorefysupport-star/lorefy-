---
kind: session
status: source-browser-verified-device-pending
date: 2026-11-01
source_commit: 21541c6
---
# Continuous theme material behind profile sections

The owner reported a flat dark rectangle behind the wooden favorites shelf.
Actual app CSS inspection reproduced it: the profile page paints the shared
theme gradient, while a design-system rule painted favorites/recent/top-character
containers with an opaque --ui-bg. The color was theme-derived, not a wrong saved
theme; a flat color still interrupts the gradient. Lower-priority legacy shelf
rules also paint backgrounds, so deleting the winning declaration is insufficient.

## Repair

Split that existing rule in styles/lorefy-design-system.css: keep the profile
page base, make its unframed favorites/recent/top-character sections transparent.
This removes the patch for every palette without duplicating the page gradient
or introducing per-color overrides. Preserve geometry, book shading, empty-slot
materials, native actions, cover images and the walnut shelf texture. No saved
preferences, artwork, owner data, API, permissions or framework changes.

## Evidence

- Added a regression first; the continuity assertion failed before the repair.
  The focused theme/bookshelf/showcase suite then passed33/33.
- Actual local demo app: normal/immersive/reader x320/390px, Arabic/English,
  dark/light/pink and four custom hues with both light/dark bases:66 cases.
  All474 checks passed, no page exceptions. Asserted actual layout and applied
  palette, not merely storage; section background alpha0/no image, retained page
  gradient, walnut image, seven slots and no document overflow. Grid/Showcase
  transitions retain transparent section paint too.
- Representative dark, pink and custom-green screenshots reviewed. Some remote
  cover requests may still be loading; this pass does not certify image-provider
  delivery. Browser snapshots are local demo evidence, not physical-device QA.
- Parent-workspace receipts: output/playwright/shelf-theme-results.txt and
  shelf-theme-{layout}-{theme}.png; artifacts/profile-material-20261101-full.log.
  No raw user screenshot or account data is committed.
- Cachev668 and refreshed design-system URL; selective index/SW/CSS mirrors only.
  First full run caught three old stylesheet-version assertions, updated to the
  new URL. Final full-suite rerun3236/3236, zero failures, exit0 (90112ms).
  All six selective mirrors match byte-for-byte; SW syntax/diff checks passed.

No native build, EAS/Apple upload, production mutation or new plugin dependency.
Continue device acceptance independently; a source push does not update an
already installed native app.

[[systems/Profiles-Lists]] | [[systems/Appearance-Bundles]]
[[13-Project-Story]] | [[14-Feature-Coverage]] | [[15-Work-Control]]
