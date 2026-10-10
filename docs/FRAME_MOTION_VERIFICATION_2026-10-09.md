# Frame Motion Verification - 2026-10-09

- Added a separate continuous Canvas motion layer to avatar and page frames.
- Imported 24 static transparent PFP Vibes overlays for localhost demo study.
  These are not the site's original GIF animation. Moving motifs and the page
  edge renderer are independent Lorefy code.
- Fixed general image placeholder styling giving a transparent overlay an
  opaque square background. Regression test was observed failing, then passing.
- Local study saving uses a separate owner-scoped key; normal decoration storage
  remains untouched. Reload visibly restored the selected moving frame.
- 12 representative viewport checks passed. Every imported collection was also
  applied through the actual UI at 320x740, 375x812, and 440x956: 72 cases with no
  horizontal overflow, avatar clipping, name overlap, edge gap, or intercepted
  pointer input. Results: `qa/frame-motion-geometry.json`.
- Two screenshots of the unchanged profile showed 6,953 changed pixels within
  the 21,750-pixel avatar region, confirming actual moving artwork. Canvas render
  counters also advanced from 741 to 1175 without another opening effect.
- `npm run ios:prepare` and `npx cap copy ios` completed successfully. Runtime
  motion JS/CSS and shop JS hashes match the native copies. Neither `ios-web`
  nor `ios/App/App/public` contains `qa/frame-lab`.
- Full `npm test`: 939 passed, 0 failed, 0 skipped (69.7 seconds).
- Final result: `qa/profile-animated-frame-final.png`; phone preview remains
  440x956 (iPhone 16 Pro Max). Browser viewport overrides were reset.

Changed source files for this motion work: `modules/lorefy-frame-motion.js`,
`modules/lorefy-profile-shop.js`, `styles/lorefy-frame-motion.css`,
`styles/lorefy-profile-shop.css`, `index.html`, `sw.js`, the two new motion/study
test files, and the static-render mock in `tests/profile-shop.test.js`.
QA assets, this report, and `docs/ANIMATED_PROFILE_FRAME_AUTHORING.md` are local
supporting artifacts. Earlier unrelated working-tree changes were preserved.

Limits: imported assets remain local-demo-only pending redistribution rights or
replacement with original assets. This is browser-size simulation, not physical
iPhone/Safari or App Store validation. No payment or live database migration was
performed.
