# Halloween Frames: Local Application Integration

## Delivered

The six selected concepts H1, H2, H3, W2, W3 and G2 are available in the actual Decoration Store under Halloween Nights. They are free original generated artwork, with separate avatar/page choices; no new purchase product or billing entitlement was added.

IDs: `halloween-ember-harvest`, `halloween-ghost-parade`, `halloween-crimson-masquerade`, `halloween-poison-conservatory`, `halloween-velvet-familiar`, `halloween-silk-widow`.

## Source

- `launch/decorations/halloween/`: six unchanged transparent source atlases, measured sprite metadata and bilingual catalog.
- `modules/lorefy-halloween-art.js`: framework-free runtime subset of the approved authoring rig. Independent ears, tail, wings, cloth, pendants and potion effects; no Remotion/React dependency was added to the application.
- `modules/lorefy-halloween-motion.js`: cached atlas loading, strict local metadata checks, proportional header crown, shared exact corner joins, material perimeter and clipped moving accents.
- `modules/lorefy-profile-shop.js`: catalog validation, Halloween filter, normal application/persistence/removal and preview integration.
- `modules/lorefy-frame-motion.js`: shared scheduler integration and one-paint static store thumbnails. No per-frame family-specific timers.
- `index.html` and `sw.js`: runtime entries, v690 cache, lightweight manifest precaching; large atlas images load on demand.

Existing avatars, banners, prices, billing rules and other artwork are preserved. Source web files were selectively copied to both existing generated web trees. This is not native compilation or a new IPA.

## Verification

- Full suite: 3370 passed, zero failures. Log: `output/halloween-tests-final-20261102.txt`.
- Owner demo: 72 combinations covering six packs, three layouts, 320/440 widths and dark/pink palettes with Arabic/English. Movement, nonblank pixels, name separation, frame bounds, follower-button hit testing, source-media preservation, persistence and removal checked.
- Visitor fixture: 18 combinations covering six packs and all three profile layouts, using the real profile renderer and projected fixture data. This is not live cross-account service verification.
- Browser matrix: 546 checks passed; zero page errors and zero Halloween asset HTTP errors.
- Actual store flow: six filter results, loaded thumbnails, animated preview, and real Apply command passed.
- Focused follow-up: 160 tests passed, including web-tree synchronization and static-thumbnail scheduler regression.
- Screenshots and scripts: workspace `output/playwright/halloween-integrated-20261102/` and `output/playwright/halloween-app-*.js` (outside the application repository).

## Deployment Boundary

No GitHub push, native build or Apple upload was performed. In the authorized
2026-11-03 follow-up, the guarded SQL from
`supabase/migrations/20261102190000_halloween_profile_artwork.sql` was executed
against the live artwork projection in the dashboard SQL editor. The existing
`20261023193458_reader_profile_layout.sql` patch was also applied because the
installed projection returned Normal for Reader. No migration-history rows,
user selections, billing, RLS, or grants were changed.

Read-only verification found all six IDs and Reader in the installed function,
unchanged execute privileges, preserved auth/owner/privacy/block guards, and a
null result without an authenticated user. The website proof is saved under
workspace `output/playwright/visitor-profile-v691/supabase-activation.jpg`.

Physical-device performance, native safe-area behavior and real-account cloud visibility remain device/service checks. Browser evidence is not a zero-crash or device-FPS certification. Existing installed TestFlight binaries do not change from these source edits.
