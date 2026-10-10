# Profile Frame Layout Rules

All current and future profile-page frames use the shared decoration renderer and stylesheet.

- Anchor page artwork at the viewport edge: no outside bezel or 6px inset. Frame height follows the actual profile viewport.
- The phone preview is a 440 x 956 CSS viewport without a second black hardware border. Its scale affects presentation only, not layout dimensions.
- `--profile-frame-side` defines the maximum horizontal artwork band. `--profile-frame-safe-inline` reserves that band plus 6px for identity text and controls. Keep these linked rather than selecting unrelated content padding.
- Apply safe space only when a page frame is equipped. Removing the page frame restores the normal profile layout, even if an avatar frame remains.
- Public-profile identity, shelves and reviews use the same horizontal safe area. Do not move avatars or replace uploaded media to accommodate page artwork.
- Frame artwork and effects cannot intercept touches. Future assets must keep ornamentation within their nine-slice bands; transparent PNG padding must not introduce a visible second border.
- Before adding a new bundle, check owner and visitor renderers in normal/immersive layouts at 320-440px widths. Check actual DOM dimensions, avatar/name overlap, follow-control clearance, horizontal overflow and scrolling.

2026-10-09 update: edge anchoring and removal of the preview bezel supersede the inset geometry described in the earlier audit. The final edge matrix is `qa/profile-frame-edge-20261009.json`; it contains 72 owner and 72 synthetic public-renderer cases. Physical Safari/iOS verification remains separate from browser viewport simulation.

Final verification: all 929 project tests passed with no failures or skipped tests. Native preparation and asset copy completed before the full suite. Final screenshot: `qa/profile-frame-edge-final.png`.
