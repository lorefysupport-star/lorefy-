# Animated Profile Frames

## Layers

The portrait remains the user's own image. The decoration is a transparent
PNG above it; a separate transparent Canvas draws continuous moving motifs.
Neither layer changes the user's banner, avatar URL, or uploaded image.

`modules/lorefy-frame-motion.js` owns the motion renderer. The original Lorefy
collections use it too. `modules/lorefy-profile-shop.js` owns selection, geometry,
preview, and account-scoped saving. `styles/lorefy-frame-motion.css` prevents
general image placeholder styles from giving transparent overlays a background.

## Make An Original Collection

1. Export a square transparent PNG, ideally 1024 x 1024. Keep the portrait
   opening clear. Do not include a sample person's photo or a solid background.
2. Measure the portrait aperture's center and diameter as fractions of the PNG.
   The renderer supports per-design calibration through `frameGeometry`.
3. Add a trusted local asset and a fixed collection ID to the catalog. An actual
   release also needs that ID in the backend/public projection whitelist.
4. Supply a bounded motion descriptor, not JavaScript from a downloaded pack.

```js
motion: {
  motif: 'heart',
  color: '#f5a6cf',
  second: '#9de4d8',
  count: 8,
  speed: 0.7
}
```

Available motifs: `spark`, `leaf`, `heart`, `ghost`, `flower`, `bubble`, `rune`.
The renderer accepts six-digit hexadecimal colors, 4-12 motifs, and speed
0.2-2. All visible frames share one 30fps scheduler. Canvas resolution is capped
at 2x. Offscreen frames and hidden documents stop drawing; visible frames keep
animating rather than stopping after an opening effect. This continuous layer
does not consult reduced-motion settings; the older optional opening effect has
its existing preference behavior unchanged.

## Page Frame Rules

The page frame follows the visible viewport, not the entire scroll document.
Its moving artwork stays in a maximum 24px edge band. Preserve the existing
`--profile-frame-safe-inline` padding and pointer-events:none contract from
`docs/PROFILE_FRAME_LAYOUT_RULES.md`. Do not animate the banner or portrait as a
substitute for animating the decoration. Test owner and visitor layouts,
follow controls, bottom navigation, narrow phones, and long names.

## PFP Vibes Local Study

Source: https://www.pfpvibes.com/avatar-decorations (exported 2026-10-09).
24 overlay-only PNGs were downloaded through the site's export control into
`qa/frame-lab`. They are decoration layers only, not the site's sample portraits.
The exported PNGs are static. Their motion here is an independent Lorefy layer,
not a copy of the site's generator or its original GIF animation. Their page
frames are also Lorefy's own procedural edge frames, not exported profile cards.

Enable the study only on localhost in demo mode with `decorationLab=1`.
`qa/frame-lab/collections.json` records the IDs and `releaseAllowed:false`.
The study uses `lorefy.user.localDecorationLab.v1`, keeping the normal decoration
record unchanged. It is not added to cloud synchronization or public whitelists.
The QA assets are excluded from the native bundle. They are local study material,
not permission to redistribute a design pack; release requires appropriate
rights or replacement with original assets. The site's own description permits
personal profile use and says not to resell the assets as a design pack.

## Verification

Run `node --test tests/frame-motion.test.js tests/decoration-lab.test.js`.
Check moving pixels in two browser screenshots, not only a render counter.
Verify a reload keeps the local study selection and does not alter the normal
account decoration. Run `npm run ios:prepare`, `npx cap copy ios`, then `npm test`
after changing runtime assets. Browser size simulation is not physical iPhone
or Safari certification.
