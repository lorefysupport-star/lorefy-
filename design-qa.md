# Selected Profile Frame Design QA

## Reference and Scope

- Reference: `C:/Users/PCD/Pictures/exec-2df2b15e-6e12-454b-8517-9edfca4eca76.png`.
- Implementation: decorated Lorefy owner and public profile layouts, with intact
  original ornament rendering and a common header for saved legacy frames.
- Reference aspect ratio: 853x1844; rendered phone: 440x956, equivalent portrait
  framing. Compared the visible reference with the live phone screenshot at this
  normalized scale, plus isolated light/dark screenshots at smaller phone sizes.
- Evidence: `output/playwright/all-profile-banners/selected-owner.png` and the
  `light-original-mint-raccoon.png` / `light-original-ribbon-bunny.png` snapshots.

## Acceptance

- Connected top ribbon, natural crest proportions and complete avatar ornament.
- Controls in the upper highlighted region, in two pairs beside the crest;
  the banner begins at the common top ribbon.
- Identical banner-image and control geometry between the twelve original packs.
- No tall footer, oversized bottom tail or lifted navigation. The requested
  upper control region uses the active theme background.
- Continuous side rails outside profile text; small real corner details and a
  proportionally scaled matching ornament rail beneath normal nav, without
  flattened raster strips or central
  animated fragments in the home-indicator region.
- Four actual favorites and the existing shelf base visible on the user's tall
  phone preview at initial scroll, rather than hidden behind navigation.
- Settings opens and closes; controls do not cover profile content during scroll.
- All 17 packs covered by geometry QA; no page errors in responsive browser runs.

## Intentional Differences

- Preserved actual biography, external links, shelf, book covers and reading
  totals; the concept's decorative replacement books/wood shelf were not applied.
- Kept Lorefy's existing typography, icons and three functional profile sections.
- Kept the native home-indicator gutter and minimum 44px control targets.
- Smaller screens and longer biographies scroll instead of compressing books.

## Final Review

The prior full-bleed review missed pack-dependent header positions and footer
raster artifacts. On 2026-10-13, added cross-pack header comparisons and actual
footer-alpha checks, then corrected the common geometry and effect clipping.
The user's follow-up clarified that controls belong above the artwork and that
the flat bottom line was not an acceptable frame continuation. This revision
reserves separate control/artwork rows and uses intact, uniformly scaled side
ornaments for the footer. Added stacking-layer and simulated native-inset checks.
The next user refinement reduces the header by 40px while retaining the banner
image height. Decorations now sits beside notifications with an 8px gap,
leaving a responsive central crest channel. The follow-up raises the ribbon,
banner and crest a further 22px to remove space beneath the controls and raise
the central ornament. The 64px ribbon leaves 4px below the 44px controls;
the banner starts at 66px. Footer/navigation are unchanged.
The animated Maple Scout page animal is centered between the button pairs,
instead of clipping against the upper-right control region after the lift.
The shared header now applies to every page decoration, not only original packs.
Legacy frames also use the opaque home-indicator backing. Renderer disposal
clears stale inline offsets even after the border is detached.
Fresh verification: 1,076 unit tests; 340 decoration layouts; 144 header/footer
layouts; 80 public-profile layouts. All passed with no reported page errors.
The live saved dark/bunny preview was inspected without changing appearance;
the relocated decorations button opened/closed the shop, the complete shelf was
visible and the footer was clean.
Expanded search-path QA covers all 39 supported collections in 468 owner/visitor
layouts and 234 reader-search entries. It preserves owner media and verifies
decoration-removal cleanup. The live search for `test_fahad` also opened the full
profile correctly, with favorite type and all four favorite works.

Physical native-device status-bar and safe-area certification remains outside
this browser implementation check. No build or release was produced.

final result: passed
