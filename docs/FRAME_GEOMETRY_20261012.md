# Responsive Decoration Geometry

Updated: 2026-10-13. Source fix verified locally; GitHub source sync only,
with no release upload or database changes.

## Cause

The twelve original page renderers added independent percentage insets to PNGs
that already contained transparent margins. Their width-stretched middle strips
put the visible side rails over profile text. Fixed avatar insets also failed for
the widest portrait apertures on small immersive profiles.

The first full-bleed revision also derived banner position from each artwork's
alpha join, so different packs moved the same header. Repeating a short raster
fragment across the footer and drawing effects beneath navigation produced the
broken strips reported in the screenshots.

## Shared Contract

- `LorefyFrameMotion.measurePageArt` measures the alpha bounds once at image load,
  retains a 12-source-pixel sway margin, and measures each central side ornament.
- All three original renderers use `paintPageArt` and expose the same `pageLayout`.
  Top crests and corner details scale uniformly, capped at 64px and 24px.
  Central crest width is also bounded by the gap between the two control pairs.
  Only their ribbon connectors stretch horizontally; the middle stays clear.
  The bunny's protected crest spans 90% of the source, keeping wide ears intact.
- The user selected the connected mint-raccoon reference in
  `C:/Users/PCD/Pictures/exec-2df2b15e-6e12-454b-8517-9edfca4eca76.png`.
  This supersedes the detached toolbar and elevated navigation experiment.
- Every decorated owner and visitor profile shares a 66px banner-image start and a
  16px control position, relative to the computed native safe-area padding.
  Original packs join the banner at a common 64px ribbon line. The same header
  contract also covers the five other current offers and saved legacy packs.
  Settings/theme form the left pair; decorations/notifications form the right
  pair with an 8px gap. The central crest has a protected, responsive channel.
  The header is 62px shorter than the header-v3 revision without reducing the
  banner image's height, including a further 22px lift from compact-v4. The
  common ribbon sits 4px below the 44px controls; centered crests can rise into
  the gap between the pairs without moving any control or clipping the top.
  Maple Scout's animated page animal is centered at the controls' 38px midpoint,
  with bounded sway and size; avatar and footer animal placement are unchanged.
  Artwork joins move the
  ornament only, never the banner or controls. Controls retain
  44px targets and native safe-area clearance, and scroll away with the banner.
- The header has theme-coloured backing, with controls above that backing's
  stacking layer. Controls, crest and banner shift together for native insets;
  unresolved CSS `max()` expressions are never parsed as numeric zero.
- `data-lorefy-native-shell` distinguishes Capacitor from the browser preview.
  Native headers use the existing iOS fallback inset; browser previews use the
  actual CSS environment inset, avoiding a fake hidden status-bar spacer.
- Navigation stays in its normal position. Uniformly scaled real bottom corners
  and a 10px bottom rail replace the flat accent line. The rail reuses rotated
  side artwork at uniform scale, rather than flattening a cropped horizontal
  fragment. It sits below the home indicator. Animated effects
  are clipped out of the central bottom 40px, leaving the home indicator clean;
  side effects and avatar animation remain active. No navigation lift is applied.
  All page decorations use the same opaque home-indicator backing, including
  legacy frames, so scrolled profile text cannot leak beneath navigation.
- Owner immersive external links share the follower row to preserve shelf space.
  Real banner, portrait, biography, social links, favorites and shelf are retained;
  the generated concept's replacement books/wood shelf are deliberately not used.
- Side rails occupy at most 18px, including their separately anchored particles.
  Source artwork, animation and the user's banner remain intact.
- Immersive portrait size is bounded by the selected aperture, rather than
  allowing a narrow aperture to produce an oversized frame. Avatar overhang sets
  a responsive edge inset for both owner and public profiles.
- Biography clearance uses the actual ring bounds, including after resize.
  Only the top biography margin reserves the portrait overhang; the bottom margin
  stays compact. Intact page and avatar artwork avoid animation slicing through
  faces; surrounding particles and side-rail motion continue to animate.
  Bottom backing hides scroll-through text in the home-indicator gutter.
  Removing decorations removes the associated inline geometry variables.
  Renderer cleanup retains the profile reference after its border detaches,
  ensuring switches and removal cannot leave an obsolete native/header offset.
- Header controls sit above artwork layers. Decoration canvases never
  intercept pointer events. Particle silhouette/glow bounds include a safety gap.
- Future original collections must use the shared page renderer and calibrated
  portrait geometry, not add their own percentage page padding.

## Verification

- `npm test`: 1,076 passed, no failures.
- `node qa/original-frame-fit-browser.cjs`: 340 cases, no page errors. All 17
  current collections; owner normal/immersive across 320x568, 375x812, 390x844,
  393x852, 414x896, 430x932 and 440x956; visitor normal/immersive at 320, 375 and
  440px. Pixel checks verify clear middle regions, rendered edge rails, progressing
  animations, unclipped avatar canvases, and biography clearance.
- `node qa/public-profile-layout-browser.cjs`: 10 readers, Arabic/English,
  80 phone layouts, no page errors. Favorites retain four bounded covers/spines,
  list/post navigation works and public action controls fit.
- `node qa/frame-chrome-browser.cjs`: 144 layouts, no page errors. Twelve originals
  at 320, 375, 390 and 440px, Arabic/dark/normal, English/light/immersive and
  English/dark/immersive with a simulated 59px native top inset. Checks
  preserve ornament proportions, compare banner/control geometry between packs,
  pixel-check a clear home-indicator region, keep controls
  above artwork with 44px hit targets, visible icons and unobscured paint layers,
  verify the 8px decorations/bell gap in every language and viewport,
  verify an artwork-backed bottom rail, scroll controls away with
  the banner, and keep navigation in exactly its normal position on every route.
- The user's live preview retains their saved banner, portrait and selected bundle.
  The relocated decorations button opens/closes the shop correctly without
  changing the selected pack; the full favorites shelf remains reachable on
  scroll. The full existing shelf also fits at initial scroll on the user's tall
  phone preview. Short viewports and longer biographies naturally scroll.
- `node qa/all-profile-banner-browser.cjs`: 39 supported collections, including
  the 17 current offers and saved legacy selections. 468 owner/visitor layouts
  and 234 searches through the real reader-search UI at 320, 375 and 440px,
  Arabic/dark/normal and English/light/immersive. Compares banner dimensions,
  checks 44px hit targets, bounded avatars and visible profile bounds, preserves
  owner media, and verifies decoration-removal cleanup. Fixtures/backend stubs
  are isolated in the headless browser; no production account is modified.
- Live preview: searched `test_fahad`, opened its result, verified favorite type,
  four favorite works and profile navigation, then returned to the owner profile.
- Updated runtime files match `ios-web` and `ios/App/App/public`; cache version is
  `lorefy-v445-all-profile-frames`. Frozen Build 34 and archives are unchanged.
- Evidence: `output/playwright/original-frame-fit/` and
  `output/playwright/all-profile-banners/`, including `selected-owner.png`, and
  `output/all-profile-frames-tests.txt` (local QA outputs).

Browser viewport checks are not physical-device certification. A newly compiled
native iOS build still needs device verification; none was built or submitted.
