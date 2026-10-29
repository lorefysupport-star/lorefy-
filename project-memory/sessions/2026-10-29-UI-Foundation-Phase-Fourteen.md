---
kind: session
status: source-browser-verified-device-pending
date: 2026-10-29
---
# Managed covers in Library and owner/visitor profiles

Continuation of [[sessions/2026-10-29-UI-Foundation-Phase-Thirteen]]. Existing
Plugin Management, UI/UX Pro Max, Apple, debugging/test-first and Playwright
guidance used; no dependency installed. Local source only, not a new build.

## Implementation

- `modules/lorefy-library-media.js` adapts existing React work cards before
  mounting. It preserves their source, progress, completion badge, copy, edit
  callback and styles. Open work, Change cover and Retry are separate native
  controls inside a noninteractive wrapper. Empty add slots and character grids
  are not adopted. Explicit cover anchors identify books even without an image.
- Adopted in the main Library map, all three owner layouts, Reader Currently
  reading, visitor favorites/library preview and the visitor View all dialog.
  Visitor artwork still comes from that profile, not the viewer's saved covers.
- `modules/lorefy-library-view.js` sizes the outer cover anchor rather than the
  inner managed surface. Missing covers remain real ranked books on the shelf
  and Showcase; real empty slots retain their existing behavior. Preserve
  Showcase3, shelf7, favorites7 and uncapped Library totals.
- `modules/lorefy-growth-features.js` lets managed Open/Edit/Retry controls bypass
  the legacy favorite-slot capture listener. Filled wrappers are not additional
  role-button/tab stops; header and empty-slot favorites editing remain intact.
- `styles/lorefy-cover-media.css` retains contain/cover fit per consumer. Grid
  art preserves2:3 even when its legacy parent is display:contents. Explicit
  image opacity prevents old important shelf rules showing a broken image.
  Open/Edit cannot inherit legacy display:none;44px Edit/Retry do not overlap.
- Adapter-only `lf-managed-cover-card` avoids the old `lf-cover-card` fixed110px
  rule. Child traversal uses React.Children.forEach to preserve element identity;
  toArray clones keyed elements and prevented the first image replacement.
- Cache `lorefy-v625-library-media`, changed asset version
  `20261029-library-media-v1`. Ten web assets selectively mirrored to ios-web and
  ios/App/App/public. No native prepare/sync, provider policy or artwork save.

## Verification

-13 added source regressions,2887 full source tests passed,0 failed. Coverage
  includes source/callback preservation, missing wrapper content, literal titles,
  managed missing books on shelves/Showcase, legacy capture exclusions and CSS
  visibility/opacity. Existing fake DOM/cache-version expectations were updated.
  The initial mock child traversal was corrected to reflect React key cloning;
  browser verification, not that mock, exposed the first integration defect.
-26 Library/owner browser cases: AR pink390px, EN dark320px; Library4 views,
  owner3 layouts x3 views. Controlled404 followed by one explicit successful
  retry; keyboard retry does not navigate,44px hit target, stable geometry,
  failed image opacity0/ready1 and sampled saved state unchanged.
-24 visitor cases: AR/EN,3 layouts x4 views. Missing cover remains visible with
  its original caption; owner custom source wins; seven library items remain
  available; Retry/Open are not nested; View all closes after selecting a work.
-3 interaction cases: fixed52x78 Reader art, progress12/100 retained across
  retry, owner Change cover opens its picker, owner Open reaches the work page
  without opening the favorites editor. No picker selection or save performed.
-26 before/after owner/Library geometry comparisons retained card/cover sizes
  within1px. This preserves the existing Reader spine treatment, not a new shelf
  visual design. Screenshots inspected for error/ready and visitor Showcase.
- All browser contexts isolated and closed;0 uncaught page errors. Image routes
  intercepted with fixtures, including allowed-provider-shaped visitor URLs.
  This is not real provider, physical iPhone or cross-account-service acceptance.
- External evidence: `artifacts/ui-execution-phase14-20261029/` contains browser
  scripts/JSON, screenshots, geometry snapshots, full test log and verification.

## Remaining

F07 is not fully closed. Home cards, feature/background art, format tiles,
avatars/character images and cover-picker internals retain separate owners.
Real provider/CORS behavior, native performance/Photos permissions, physical
accessibility and F08 edition grouping remain separate gates. No GitHub, Apple,
Supabase write, catalog mutation or saved-cover replacement occurred.

[[13-Project-Story]] | [[14-Feature-Coverage]] | [[systems/Reading-Library]] |
[[systems/Profiles-Lists]] | [[systems/Language-Media]]
