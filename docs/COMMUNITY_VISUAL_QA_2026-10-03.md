# Community visual verification - 2026-10-03

## Implemented

- A shared 48px avatar column, content spine, padding and action rail for text, review, list and character-ranking posts. Post height remains content-driven.
- Removed the legacy review max-width that narrowed reviews by 40px.
- Enlarged work covers to 64x92px and rating glyphs to 16px.
- Compact themed composer with attachment tools, character progress, account-scoped in-memory drafts, focus restoration, Escape/Tab handling and visual-viewport cleanup.
- Production publishing no longer falls back to a falsely successful local post when the backend is unavailable.
- Pink surfaces, supplementary accents, type badges and default profile artwork follow the appearance palette. Uploaded images and catalog covers retain their original colors.
- English composer placeholders and remaining inspected profile labels translated.

## Verification

- Full Node test suite: see `qa/community-polish-tests.log`. Includes current appearance, account isolation, public artwork, chapter discussion, social feed, reply safety, discovery, authentication guards and service-worker contracts.
- Browser: Arabic Pink profile/feed/composer, Light English typing, Dark composer, draft close/reopen, disabled empty submit, attachment empty state.
- Responsive composer: 390x844, 375x480 and 1280x900. Small-height footer remained inside the viewport; desktop sheet width 620px; no document horizontal overflow.
- Separate local mock-backend fixture rendered text, list and top posts using the actual community module and shared styles. All eight attachment thumbnails loaded, avatars were 48px and body columns matched.
- Real demo feed measurement after legacy width removal: both text and review cards 390px wide, avatars 48px.
- Syntax checks passed for the application bundle and community module. iOS web and native public assets synchronized with `ios:prepare` and `cap copy ios`.
- No production posts, accounts, settings on Apple/Supabase, or public invitations were changed for this QA.

## Evidence

- `qa/community-polish-feed.png`
- `qa/community-polish-composer.png`
- `qa/community-polish-profile-pink.png`
- `qa/community-polish-attachments.png` (isolated layout fixture, not real user data)

## Remaining Device Gates

This is not a claim that the beta has no defects. Native iPhone keyboard behavior, Apple/Google sign-in, APNs delivery and cross-account uploaded-image delivery require real-device/account verification. Automated contracts cover their code paths but cannot establish actual device delivery. No new IPA or TestFlight build was produced or uploaded by this task.
