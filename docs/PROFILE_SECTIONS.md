# Profile Sections

Implementation based on GitHub commit 4763862. The user authorized GitHub publication after the final audit. Public list database activation is still deferred; only the temporary free-decoration policy was authorized for deployment.

## Behavior

- Overview preserves the existing favorite works, favorite characters, activity, diary and reading sections.
- Lists shows named ranked folders, either works or characters. The owner can create, rename, describe, reorder, remove entries, delete a folder, and choose public or private visibility.
- Posts reads the profile owner's root posts with owner-scoped pagination, using the existing community cards, composer, threads and reactions.
- Visitors have read-only access to public folders. A visitor never reads the viewer's own list storage.
- Arabic and English labels follow the selected app language. User-written names and descriptions are not translated.
- The header keeps reading metrics only. The redundant review/post shortcuts are hidden without removing review content or changing stored counts; posts remain accessible through their tab. The metric columns follow the visible count, and tabs use a single active underline.
- Favorite type is one of the four reading metrics on both owner and visitor profiles. The visitor value comes only from that profile, not the viewer's preferences.
- Compact header spacing raises the tabs without resizing books. Shorter phone viewports use a smaller owner banner in bookshelf mode; longer names/bios remain scrollable instead of being clipped.
- Visitor favorites do not inherit the paginated library grid. Spines use the owner's shared profile height function, four bounded columns and a visible shelf baseline; ordinary covers retain 2:3 geometry. Header actions share a row and profile content respects page-frame side clearance.
- Normal visitor identity remains centered on tall phones and adapts beside the avatar on shorter phones. All ten fixture profiles show the four favorites fully above navigation at 440x956 and 430x932; shorter viewports preserve readable book sizes and allow a short scroll rather than crushing the banner and content.
- Preview-only fictional profiles include a public ranked work list. These fixtures are not production users.
- List previews use two columns of folder-shaped tiles: fanned artwork sits behind a themed front pocket with the first entry's cover. The title, count and public/private visibility sit below the folder. Zero through four preview images fit without clipping; empty lists retain a recognizable empty folder. Accessible button labels include the list kind, count and visibility. The open-list header remains unchanged.
- Open lists use an unframed artwork/title/description header and larger ranked portraits, with subtle emphasis for the first three places. Opening moves directly to the list header; returning restores focus to the originating card. Editor and visitor permissions are unchanged.
- Work detail artwork uses a responsive 240-300px mobile banner (340px on desktop), a larger cover and stronger title. Existing author, rating, chapter/review controls and their callbacks are retained.

## Persistence and Activation

Storage key: `lorefy.user.profileLists.v1`. The existing account isolation, pending-state journal and Supabase state sync include this key. Source data is bounded to 40 folders and 50 entries per folder. Images must use HTTP(S).

Public list reads use `get_public_profile_lists(profile_ref)`. The locally prepared migration
`supabase/migrations/20261011134708_profile_public_lists.sql` must be reviewed and applied to the intended environment before real accounts can view each other's lists.

The migration has NOT been deployed. Until activation, other profile features remain usable and the list tab reports the unavailable projection rather than borrowing local data or silently claiming the owner has no lists.

The projection preserves authenticated visibility, private-account and both-direction block checks. Only explicitly public folders and allowlisted presentation fields are projected. Direct access to `user_state` is not granted.

## Integration

`modules/lorefy-profile-sections.js` follows the existing DOM enhancement architecture. It leaves React-owned overview children in place and classifies them for tab visibility. Public profiles publish their remote snapshot to their own DOM node; the enhancement does not use a global viewer snapshot.

`modules/lorefy-community.js` exports a reader-scoped post page reader. Root post cards are reused, not independently reimplemented.

## Verification

- Unit tests: `node --test tests/profile-sections.test.js tests/preview-readers.test.js tests/public-profile-view.test.js`.
- Browser workflow: `node qa/profile-sections-browser.cjs` against the local API server. Override `LOREFY_QA_URL` and `LOREFY_PLAYWRIGHT_MODULE` for another machine.
- Header layout checks: `node qa/profile-header-browser.cjs` verifies owner/visitor metrics, retained reviews, both languages, normal/panoramic layouts, light/dark/custom palettes and five viewport widths. Four phone sizes (375x812 through 440x956) check that the complete owner shelf clears bottom navigation on initial entry with the standard one-line profile bio.
- Header screenshots and results: `output/playwright/profile-header/`.
- Visitor layout regression: `node qa/public-profile-layout-browser.cjs` checks ten distinct profiles in Arabic/English across four phone sizes (80 layouts), geometry, full favorites, tab interactions, safe action targets and no horizontal overflow. Evidence: `output/playwright/public-profile-layout/`.
- Screenshots and results: `output/playwright/profile-sections/`.
- Work/list presentation: `node qa/work-list-presentation-browser.cjs` checks Arabic/English, five viewport widths (320-768px), custom/light themes, large work banners, list previews, rank geometry, empty lists, long content, edit/remove/save, focus restoration and visitor read-only access. Evidence: `output/playwright/work-list-presentation/`. Unit contract: `tests/work-list-presentation.test.js`.
- JavaScript/browser checks are not a native iOS crash certification. Live cross-account list projection remains unverified until database activation.
