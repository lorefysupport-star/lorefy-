# Public Profile And Community Audit

Date: 2026-10-09

## Changes

- Visitor profiles use the owner's validated theme, banner position and library view. Navigation inherits the owner's colors temporarily and restores the viewer's colors on exit.
- Theme and library preferences synchronize through account state. Favorite format is derived from distinct library/favorite works and retained during partial catalog loading.
- Public search includes each reader's favorite format with Arabic and English labels.
- Normal library/favorite covers have bounded dimensions and `object-fit: contain`; spine shelves share the library renderer and show four balanced favorites.
- Post and review bodies open their conversations. Author, work and action controls retain their separate navigation, and card keyboard activation is supported.
- Only community filters stay sticky. The scrolling header no longer blocks their pointer events.
- Review heading, reply placeholder and split reply counters are localized.

## Verification

- Full `npm test`: 980 passed, 0 failed. iOS preparation and Capacitor asset copy completed successfully.
- Browser: green spine owner, blue grid owner, pink list owner; ten search results include favorite types in both languages.
- Responsive: 320, 375, 390 and 440 CSS-pixel widths; profile scroll width equals its visible width and all four favorite spines have equal widths.
- Library modal: ten loaded images, bounded at approximately 124 x 186 pixels in the 440-pixel preview, complete-image fit, no inherited fallback background.
- Browser: post body opens its conversation; review body opens the matching review; author name opens the owner's account.
- Scrolled community: filter top remains at zero; pointer hit-testing reaches the tab button and clicking switches to Following. Clean final reload recorded no new console errors.
- Database: public appearance projection tested across 132 public profiles; five private profiles remain hidden. Anonymous execution is revoked. Existing bidirectional block checks are reused.
- Evidence: `qa/public-library-covers.png`, `qa/public-owner-shelf.png`, `qa/community-sticky-tabs.png`, `qa/public-appearance-tests.txt`.

## Boundaries

- Fake readers remain local preview fixtures, not fabricated production accounts.
- Public projection exposes only theme, library view, favorite format and banner position; it does not expose arbitrary account state.
- Existing accounts need to use the updated client so their local appearance preferences synchronize. Previously unsynchronized preferences cannot be reconstructed server-side.
- No physical-iPhone or two-live-account upload/restart test was performed. iOS web assets are synchronized, not a newly signed native release.
- An unlocated MutationObserver error was logged during an earlier navigation, without an app source location. It did not recur on the clean final reload; do not interpret that reload as an exhaustive error-free guarantee.
