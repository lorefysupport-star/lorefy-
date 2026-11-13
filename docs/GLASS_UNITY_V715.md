# Shared Glass Consistency, v715

Date: 2026-11-13. Source/browser verification, not a new native release.

## Direction

UI/UX Pro Max's Glassmorphism and text-contrast guidance was checked against
[Apple's materials guidance](https://developer.apple.com/design/human-interface-guidelines/materials).
Keep glass in navigation and transient controls; retain readable content surfaces,
sharp artwork, the chosen colors, three profile layouts and existing interactions.
This is a CSS interpretation in React/Capacitor, not the native Liquid Glass API.

## Reproduced and Repaired

- Notification header inherited a legacy 24px/180% blur because its material
  declaration could not override the unlayered important rule. It now consumes
  the shared backdrop and edge, including transparency/contrast fallbacks.
- Image-sharing composer was opaque with no backdrop filter while adjacent work
  sheets used shared glass. Its own existing cascade layer now consumes the
  shared sheet, reflection, shadow, font and legible glass labels. Nested export
  overlays initialize material variables too. Generated image designs/colors and
  all export handlers are unchanged; the footer no longer adds an opaque stripe.
- Community post menus, edit dialog and Undo surface used independent solid
  materials. They now share the transient sheet material. Timeline content is
  not wrapped in glass; destructive and primary action colors remain paired.
- Store tabs and character-search/filter chrome had translucent fills but no
  matching blur. They now use the same backdrop/elevation without changing
  products, purchases, character data or portraits.
- One fixed white rim was used in both brightness modes. Highlight/edge/shadow
  tokens now follow each palette; the dark highlight is 16% instead of 50% white.
- At 1280px the four cinematic routes had a nearly full-width dock while Profile
  used a compact dock. All routes now share a centered 560px maximum at 700px+.
  The phone dock and safe-area geometry are unchanged.

## Verification

- Six new regressions were observed failing before their implementations.
- 39 focused material/palette/export/image-picker tests pass.
- Final complete suite:3566 passed,0 failed. Earlier runs caught stale cache-key
  assertions and unsynchronized generated assets; those were corrected and the
  entire suite rerun after the final source changes.
- 80 post-change browser captures: Home, Explore, Library, Work and Profile;
  all three profile layouts; Settings, Review, Status, Composer, Notifications,
  Characters, Share and Shop entry flows. Dark, Light, Pink, custom dark teal and
  custom light orange. Captured material nodes share the intended backdrop;
  no horizontal page overflow or JavaScript page errors in this matrix.
- 102 additional browser assertions pass: 320px Arabic/Pink, 768px English/Light,
  1280px English/custom-dark; five routes, three profile layouts, four legal/help
  documents and actual emulated increased-contrast/reduced-transparency modes.
- Desktop dock buttons measure 136.5px each on every route after the repair.
- Existing semantic contrast tests sample the color grid and composite glass
  backgrounds, requiring 4.5:1 for normal text. This is not a pixel-by-pixel
  certification against every possible photograph or user-uploaded background.
- Owner's existing local preview was opened without changing saved preferences;
  decorated/populated Profile, inbox entry and Back were inspected.
- Root assets are selectively mirrored into both existing iOS web directories.
  Cache key v715 and updated asset versions prevent mixed old/new material files.

Local evidence is outside Git: `output/playwright/glass-unity-20261113/`
contains before/after screenshots and JSON, `responsive.json` and the live preview
capture. Full-suite verification is recorded in the linked project session.

## Limits

No server change, test notification, native build or Apple upload in this pass.
Chromium desktop/mobile emulation does not certify iPhone WebKit performance,
native accessibility settings, keyboard presentation, or every account-specific
screen. The matrix exercises entry/display states, not every service mutation.
Some screenshots catch provider media before it resolves; this pass does not
certify external image availability or export completion. Further populated,
real-device workflow acceptance remains required.

Implementation: `modules/lorefy-design-system.js`,
`styles/lorefy-glass-materials.css`, `styles/lorefy-notification-center.css`,
`styles/lorefy-share-composer.css`; no new dependency or rendering loop.
