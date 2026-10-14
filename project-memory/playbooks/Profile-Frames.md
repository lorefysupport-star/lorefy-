---
kind: playbook
status: maintained
aliases: ["إصلاح الإطارات"]
---
# Profile Frame Regression Playbook

1. Read [[decisions/Profile-Frame-Geometry]] and inspect shared renderer/CSS.
2. Reproduce the exact pack, owner/visitor mode, language, layout, dimensions and native inset. Preserve the user's live selection; use isolated fixtures for changes.
3. Check transparent source bounds, protected crest width, header/image start, controls, portrait aperture/overhang, biography clearance and shelf baseline.
4. Inspect footer pixels and background backing; don't repeat a cropped raster across the home indicator or lift navigation to hide the problem.
5. Add a targeted failing assertion. Fix the shared ownership point rather than separate CSS values per pack.
6. Test resize, scroll, switching/removing decorations and search-to-profile entry.
7. Synchronize changed runtime source into both generated trees and run the relevant suite and browser matrices.
8. Save screenshots and actual counts with the source reference. Native safe-area checks in a browser are not physical-device certification.

Source: [frame QA](../../qa/frame-chrome-browser.cjs),
[all-profile search QA](../../qa/all-profile-banner-browser.cjs),
[public layout QA](../../qa/public-profile-layout-browser.cjs).

[[00-Home]] | [[05-Verification]] | [[templates/Bug]]
