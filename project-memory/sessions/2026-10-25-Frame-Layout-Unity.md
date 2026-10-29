---
kind: session
status: source-reviewed
date: 2026-10-25
---
# Frame Layout Unity

Owner supplied actual-profile screenshots rejecting the different header and
portrait geometry between old and new packs. Store-preview success alone did
not prove actual-profile consistency. This session repairs the shared contract;
all work remains local, with no push, build or production catalog change.

## Causes and Changes

- New Elven/Atelier renderers painted their top material below the banner seam;
  restored packs used a compact crest above it. `lorefy-frame-motion.js` now owns
  `profileHeader` and `headerConnectors`; all three families use them. Narrow
  phones reserve a second ornament row rather than overlap fixed-size controls.
- Curves begin on the actual moving side endpoint/tangent. Transparent padding
  inside a crest caused visible gaps despite correct rectangle math. Cached
  alpha-derived anchors in `lorefy-bitmap-rig.js` now place the other end on the
  visible crest, including its current deformation, for new and restored art.
- New material strips included transparent gutters that collapsed the artwork
  into a hairline. Cached `ribbonTexture` sampling makes the actual material fill
  its thickness; no per-frame pixel read or extra animation scheduler was added.
- `lorefy-profile-shop.js` gives every decorated portrait one responsive artwork
  budget:136px below380px page width,160px otherwise, with portrait at most96px.
  `lorefy-frame-motion.css` applies it across layouts and reserves matching cover
  height and content gutters. Reader's ID-specific20px padding no longer wins.
- `phone-preview.html` uses a zero-minimum grid column so its scaled440px phone
  remains centered in a narrow browser panel; the app viewport itself is intact.
- Existing IDs, actual avatar/banner sources, motion identities, catalog gates,
  entitlement checks and prices are unchanged. Cache is `lorefy-v588-frame-unity`.

## Verification

- Final `npm test`:2494 passed,0 failed,0 skipped. This includes the final
  phone-preview centering regression, not only the earlier2493-test run.
- `tests/frame-unity.test.js`: failing-then-passing regressions for shared header
  geometry, artwork anchors, strip opacity, all51 portrait budgets, gutters and
  the preview-wrapper min-content issue. Previous Atelier assertions were updated
  deliberately: the top ribbon now rises between controls, not below all of them.
- Final browser matrix:51 packs x3 public-profile layouts x2 widths(320/440) =306
  successful cases. All had page/PFP canvases, expected banner seam, bounded
  portrait and no horizontal overflow, name overlap or biography overlap.
- Nine additional320px English/light/long-name cases passed across all layouts
  using representative old, Elven and Atelier designs.
- The actual owner demo applied all29 offered packs through the real shop in
  each layout:87 cases, no measured geometry failures. Original selection/layout
  were restored; original photo/banner URI comparisons remained equal.
- Screenshot pixel comparison confirmed changes in avatar, top, both sides and
  footer of Tidal Glass; both page/PFP frame counters advanced. This is browser
  movement evidence, not a native performance certification.
-18 selective runtime mirror comparisons passed for9 changed web files in both
  shipped trees. The QA phone wrapper is not part of those native web trees.
- Screenshots, JSON matrices and test logs are under the chat's external
  `artifacts/` folder. Do not copy raw user media or account data into this vault.

## Remaining Gates

Owner aesthetic approval, physical iPhone performance and native safe-area
behavior remain separate gates. No claim of production-service or purchasing
certification. The pre-existing startup MutationObserver diagnostic recorded in
[[2026-10-25-Decoration-Store]] is not closed by these layout tests.
