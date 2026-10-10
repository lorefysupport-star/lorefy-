# Product Decisions and Feature Map

This is a durable handoff summary of the user's decisions and preserved implementation, not a complete transcript or a new verification of every historical UI claim. Source, tests and dated feature docs remain authoritative evidence.

## Profile, Appearance and Decorations

- Users choose ordinary or panoramic upper-profile layouts. The panoramic mode is inspired by the provided reference, not a whole-app TikTok clone.
- Username, display name, bio, social accounts and following/follower counts must have distinct, compact positions; the two counts should not drift far apart.
- Normal favorite covers retain proper proportions. Shelf mode uses curved/book-spine appearance, readable rotated titles, varied heights and a visible shared shelf. Four favorites are balanced; favorite section heading is right-aligned in Arabic and spacing avoids the bottom navigation.
- Library shelf and favorite shelf share the intended book treatment; switching back to cover mode must not shrink or distort covers.
- Decoration bundles include avatar frame, full-profile page frame and animated effect. Selecting one must preserve the owner's existing banner and avatar; a changed header image is not required.
- Bundles are free for now. Do not introduce premium gating, fake payment success or a purchase requirement. StoreKit is disabled in the current release config.
- There are three original Lorefy bundles plus all 24 imported PFP Vibes bundles in Build 34. Keep all 27, not only Noura's bunny preview. `releaseAllowed=false` on imported records is still an unresolved rights gate, not a missing asset.
- Avatar overlays use square transparent PNGs and geometry metadata defining the aperture. Art extending above the circle, including bunny ears, must not be cropped or scaled independently from the avatar.
- Page frames are anchored to the visible profile viewport, not stretched over the entire scroll document. Edge ornamentation must cover intended edges without covering username/counts/content or interactive controls. Use shared safe padding and pointer-events rules for future designs, not one-off negative margins per device.
- The requested phone preview is iPhone 16 Pro Max, 440x956 CSS pixels. Preserve responsive behavior for smaller phone widths as well; browser viewport tests are not hardware validation of all iPhone models.
- Imported illustration PNGs are unchanged reference art; motion is provided by Lorefy's local canvas/motif layer. Do not say the source PNG itself is an animated video.
- Current motifs include leaves, hearts, ghosts, flowers, bubbles, runes and sparks. The user explicitly prioritized continuous visible animation; current authoring documentation explains shared scheduling, count/speed and visibility handling. Do not reintroduce an arbitrary motion switch as a silent scope change.
- Custom theme means the entire app's surfaces, borders and navigation, not only buttons. Arbitrary validated six-digit color works with dark/light brightness. Preserve contrast and separate semantic success/error colors.
- Visiting another user shows that owner's banner placement, theme colors and normal/shelf preference, while restoring the viewer's theme when leaving. Favorite type is visible. Owner-scoped persistence and cloud projection are essential; do not make all users share one global artwork setting.

Key files: `modules/lorefy-profile-layout.js`, `modules/lorefy-profile-shop.js`, `modules/lorefy-frame-motion.js`, `modules/lorefy-public-appearance.js`, `modules/lorefy-public-profile.js`, matching profile styles, `backend/lorefy-custom-artwork.js`, and Supabase artwork/projection migrations.

Relevant documents include `PROFILE_FRAME_LAYOUT_RULES.md`, `ANIMATED_PROFILE_FRAME_AUTHORING.md`, `CUSTOM_APPEARANCE_FRAME_FIT_2026-10-09.md`, `FULL_COLOR_THEME_2026-10-09.md`, `public-appearance-audit.md`, `PROFILE_FAVORITES_SHELF_VERIFICATION_2026-10-07.md` and `BUILD34_READINESS.md`.

## Community and Localization

- The two community feed tabs should remain sticky while browsing.
- Clicking a post/review body opens its detail directly; clicking author name/avatar opens their profile. Work chips, reactions and other controls must not accidentally trigger parent navigation.
- Public profile library covers use bounded image containers and contain-style rendering, rather than oversized cropped images or stretched rows.
- Arabic and English system labels must not appear duplicated. Language selection applies to followers, community, library, work detail, dialogs and public profiles. User-written reviews/names and official work titles are content, not automatically translated UI labels.
- Ten fictional readers with distinct profiles, banners, works, ratings/reviews and favorites were requested inside the normal demo experience, not just a QA dashboard. `modules/lorefy-preview-readers.js` contains this local/demo feature. They are not ten actual production-auth users and must not be silently seeded into real users' feeds.
- Noura's bunny decoration is a useful regression scenario for public appearance. The app must support every collection, not a hardcoded exception for her.

## Library, Discovery, Reading and Characters

- Catalog supports manga, manhwa, manhua, comics, novel, book, light novel and web novel with source provenance and identifier handling.
- Arabic coverage is not limited to a single author. OpenITI/Wikidata and other sources expanded it; preservation of source metadata/licensing matters.
- Explore personalization and filters, catalog loading/caching, exact relation IDs and cover fallback/selection logic are preserved. Do not simplify the feature set by removing data imports or using title-only identifiers.
- Progress units, completed works, chapter counts and reading-time metrics must remain coherent; custom artwork persists across reopen and projects publicly for the owning user.
- Quarter ratings, reviews, preferred characters and character atlas changes are in source/tests/docs. Do not discard them while changing profile styling.

## Native Improvements Already Present

Earlier build32/33/34 changes include native Apple/Google authentication recovery, CryptoKit/PKCE support, secure Keychain sessions, account-scoped cloud hydration, native camera upload handling, completed-work/chapters calculations, notification preference/registration guards and beta decoration packaging. Preserve these when regenerating native assets.

## Video Work

The first profile-focused ad was accepted as a direction. The first whole-app ad was criticized for lag. The latest whole-app video uses actual UI browsing recordings with timestamp-aware interpolation and 60fps output. The confirmed profile was fahad / `@lorefy_demo`; the subsequent standalone message `fhd` was ambiguous and not resolved. Do not rename the account or claim the latest file uses a separate `@fhd` account without asking.

See `MEDIA.md` for sources and dependencies. Videos depict demo UI, not a current production account capture on the new device.
