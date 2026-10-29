---
kind: session
status: local-verified-service-pending
date: 2026-10-24
---
# Three featured works and a seven-book wall shelf

## Follow-up: consistent library geometry

Owner supplied `Screenshot 2026-10-24 041722.png` with eleven books. Measuring
the actual app found 200-224px cover heights overflowing 240px cards after 32px
padding plus an inherited 7px cover margin. Culling clipped non-anchor book tops
and completion badges. Library's forced LTR direction also left the Arabic final
row on the wrong side. This supersedes the library-only height variation above;
profile favorite geometry remains unchanged.

Library spines now use fixed 196px height, zero margin and a shared 208px baseline
relative to each 240px row. Seven tracks remain; 20px insets clear wooden end cheeks.
Shelf anchors use logical positioning and inherited reading direction. The last
Arabic row starts at the right; English starts at the left. Completion badges stay
centered 8px below the top; labels reserve 36px above and 12px below.
Cache lorefy-v569-wood-shelf-geometry, CSS wood-shelf-v3.

Two new failing regression tests became green. Full suite: 2438 pass, zero fail,
skip or cancellation, exit 0 (`wood-shelf-geometry-tests.txt`). Actual eleven-card
app: all covers 196px, all baselines 208px, zero margins, all covers/badges contained;
440px grid/scroll width. Existing Covers, Showcase and List still show all 11 works.
320px AR dark fixture with 11 books and EN fixture with 8 books: 305px grid/scroll,
matching direction and no clipped book or badge bounds. Fixtures include production
margin/culling constraints and badges. Screenshot artifacts:
`wood-shelf-geometry-11.jpg`, `wood-shelf-geometry-320-dark.jpg`,
`wood-shelf-geometry-320-en.jpg`, `wood-shelf-geometry-phone.png`.
Local source/browser evidence only; no push, release, database or device claim.

## Follow-up: actual library shelf clipping

Owner's `Screenshot 2026-10-24 041055.png` exposed a production-style regression
missed by the initial simplified fixture: the shelf appeared under only the first
book. Actual library cards use `content-visibility:auto`, which implies paint
containment even when computed `contain` is `none` and overflow is visible.
The first card's 440px pseudo-element was consequently clipped to its 56px box.

The shelf row anchor (`nth-child(7n+1)`) alone now uses `content-visibility:visible`.
Other cards retain automatic culling; covers/list/showcase are unaffected.
The QA fixture now reproduces production culling and accepts incomplete row counts.
Cache: lorefy-v568-wood-shelf-clipping; showcase CSS version wood-shelf-v2.

Fresh verification: 2436 tests pass, zero fail/skip/cancel, exit 0
(`wood-shelf-clipping-tests.txt`). Regression test failed before the fix.
Actual library: 3 books, full 440px shelf, culling states visible/auto/auto,
no horizontal overflow. At a 320px viewport, fixtures with 14 books and 8 books
retain full-width shelves on both complete and incomplete rows; 305px grid/scroll.
Dark incomplete second-row shelf is 304.922px. Screenshot artifacts:
`wood-shelf-library-fixed.png`, `wood-shelf-culling-14-320.jpg`,
`wood-shelf-culling-8-dark.jpg`. Both native web asset copies synchronized;
no native build, push or service change. Earlier fixture-only confidence is superseded.

Owner requested three works in Showcase, seven on the bookshelf, realistic wood,
and finished ends/supports so it looks wall-mounted. Local-only work; no push,
native build, Apple upload or service migration.

This supersedes the previous favorites display limits in
[[sessions/2026-10-24-Book-Showcase]], not its library pagination behavior.

- [View module](../../modules/lorefy-library-view.js): favorites presentation
  windows are Showcase 3, Bookshelf 7, existing Covers/List 4. Seven canonical
  React slots remain mounted; hidden overflow is display:none and not focusable.
  Switching a presentation does not rewrite saved favorites.
- [Editor](../../modules/lorefy-growth-features.js): seven selection, persistence
  and catalog-hydration slots; character favorites still have their existing limit.
  The legacy React picker also retains up to seven, so its alternate entry path
  cannot silently truncate positions five through seven.
- [Public profile](../../modules/lorefy-public-profile.js): same owner-mode limits,
  existing work actions, independent character slots and standalone module fallback.
  Existing SQL projection returns the complete favorites array; no migration needed
  for the count. The previously pending new-mode appearance whitelist is separate.
- [Styles](../../styles/lorefy-book-showcase.css): wider seven-track shelf with
  a transparent walnut plank, raised end cheeks and two lower mounting supports.
  Library has seven books per row but no total-item cap; each row has a shelf.
  Settings preview uses the same asset. Original artwork and saved choices remain.
- [Asset](../../assets/shelves/wall-walnut-v1.png): built-in ImageGen, 514147 bytes,
  transparent background. Project-local asset, also selectively copied to both
  existing native web directories. Cache lorefy-v567-wood-shelf.
- [Mechanical patch](../../tools/patch-seven-favorites.mjs): bounded minified
  profile renderer/editor changes and exact cache URL updates; no unrelated transforms.

## Evidence

Failing tests first: missing presentation limit and old public counts 4 instead
of 7/3. Passing focused behavior includes seven-slot edit/save without truncation,
public seven actions, showcase three actions, existing library and account behavior.
Full suite: 2434 pass, zero fail/skip/cancel, exit 0; chat artifact
`wood-shelf-tests-final.txt`. Source web/Xcode asset parity test passes.

Browser: real Reader profile shows seven slots and a walnut shelf; favorites editor
has seven slots in a four-column grid. Switching to Showcase shows 3 while retaining
7 DOM slots and all 4 original saved covers; switching back restores 7 slots.
No original favorites were replaced to manufacture a demo. Library fixture
[wood-shelf](../../qa/wood-shelf.html) has fourteen sample cards on two seven-book
rows. All images loaded; narrow dark viewport has document width/scrollWidth 305/305.
Artifacts: `wood-shelf-390.jpg`, `wood-shelf-dark-320.jpg`, `wood-shelf-profile.jpg`.

Physical device, VoiceOver and live cross-account service validation are not claimed.
The previous phone-preview host MutationObserver issue is not declared repaired.

## Final ImageGen Edit Prompt

Edit this isolated wooden bookshelf production asset. Preserve the same warm walnut fine grain, front-on slight elevated camera, and extremely wide horizontal plank. Add two short raised wooden end cheeks at far left and far right, plus a small visible triangular walnut mounting bracket underneath each end, so this reads as a real suspended wall-mounted bookshelf with finished sides. Keep the middle top surface unobstructed for seven books. No wall, no background, no books, no text, no metal. Both support brackets should be modest, only about the plank's thickness below the shelf, not tall triangles. Keep everything isolated on genuine transparent alpha, level and symmetrical. Frame the shelf with very little transparent padding, panoramic composition. Natural restrained wood color and soft ambient shadows.

[[systems/Profiles-Lists]] | [[systems/Reading-Library]] | [[13-Project-Story]] | [[14-Feature-Coverage]]
