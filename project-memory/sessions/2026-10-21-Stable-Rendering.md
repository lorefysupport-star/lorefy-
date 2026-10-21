---
kind: session
status: source-and-browser-verified
date: 2026-10-21
---
# Preserve unchanged cards during UI updates

Owner requested an app-wide search for unnecessary rebuilding after the favorite-character slot flash. Local work remains uncommitted; no GitHub push, native compilation or production data change.

Reviewed imperative content replacement sites in modules, related maintenance/signature guards, and React Explore card keys. A full redraw is still appropriate when screen content actually changes; this audit does not claim all rendering or device performance is measured.

## Repairs

- `modules/lorefy-growth-features.js`: favorite works slot targeting updates existing controls. Searches, catalog refresh and Load more retain unchanged slots/result cards. Favorite characters now retain unchanged slot cells and candidate portraits on selection, removal, search and data refresh, with live selection closures. Re-clicking the current picker/atlas mode is a no-op.
- Legacy character ranking updates cast selection badges in place; podium positions whose character is unchanged keep their portrait nodes. Review top-four selection updates candidate indicators and replaces only changed positions.
- `modules/lorefy-profile-sections.js`: custom-list add/remove updates result disabled state/icons without rebuilding covers. Reordering moves existing selected rows, preserves their images, recomputes current indices for handlers and retains keyboard focus. Removed rows leave the editor-local cache.
- `modules/lorefy-community.js`: loading/pagination/review-feed updates retain unchanged live post cards. Changed posts, language or viewer are invalidated. Removed cards are pruned; replacement post objects get current handlers. Relative time updates change only the time label. Cache scope is the mounted feed host and current visible posts.
- `styles/lorefy-review-social.css`: browser verification exposed the sticky favorite-works Save button intercepting Load more. Save now occupies a separate footer outside the scrolling body; Load more remains accessible.
- `index.html` and `sw.js`: affected runtime assets have fresh cache versions.

## Evidence and limits

548 focused regressions passed across character, profile, community, UI, Explore, library and home suites. New runtime regressions assert actual node identity, removal, ranking focus, live selection state, pagination, data/viewer invalidation and timestamp text updates. Existing stale UI expectations for the previously removed instruction panel were aligned with the owner's accepted controls.

Browser demo: open character picker, switch slots, open work picker, Load more (12 to 24), target slot 2, choose a work, switch target again. Selection and results remain correct; the footer no longer intercepts pagination. Browser changes used the isolated demo profile. No real account favorite was added/removed during checks.

Selective prepared web assets synchronized to Device Hub's existing simulator installation; account data preserved. No physical-device certification, production-service exercise, frame-time benchmark or universal speedup percentage is claimed.

[[systems/Profiles-Lists]] | [[systems/Community-Notifications]] | [[13-Project-Story]] | [[14-Feature-Coverage]]
