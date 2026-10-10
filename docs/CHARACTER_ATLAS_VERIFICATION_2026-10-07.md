# Character Surfaces Verification

## Scope

- Work character-rating list: larger 84 x 124 portraits, consistent individual rows, native quarter-step sliders and precise numeric outputs.
- Profile rated-character gallery: two-column mobile portrait grid, three columns on wider screens, exact numeric badges, search and rating/work grouping.
- Removed the rounded-score grouping and the duplicated, unclipped feather display in the overlay.
- Localized character roles, averages, filters, search, source labels and gallery controls.
- Retained existing favorite works, favorite characters and saved scores.

## Verification

- `npm test`: 796 passed, zero failures (59.495 seconds).
- Six focused character-atlas regressions cover all twenty quarter ratings, search, grouping, navigation, portal feather clipping and English labels.
- Browser checks: 320 x 740, 390 x 844, 390 x 1040 and 900 x 900.
- Neither character surface had horizontal overflow at the checked widths.
- Arabic/pink, English/light and English/dark checked visually.
- Search, no-results state, main/supporting/rated filters, gallery grouping and gallery-to-work navigation checked through the UI.
- Gallery grouping tabs support arrow, Home and End keys.
- Preserved values verified in both surfaces: 5.00, 4.50 and 3.75.
- Dark gallery and work surface computed background: `rgb(11, 11, 12)`.
- Native assets prepared and copied. SHA-256 equality confirmed for the changed module, stylesheet and service worker across source, ios-web and the Xcode public bundle.

## Evidence

- `qa/character-atlas-20261007/gallery-pink-ar.png`
- `qa/character-atlas-20261007/rating-pink-ar.png`
- `qa/character-atlas-20261007/gallery-dark-en.png`
- `qa/character-atlas-20261007/rating-dark-en.png`
- `qa/character-atlas-20261007/rating-light-en.png`
- `qa/character-atlas-tests-20261007.log`

## Limits

Browser viewport emulation is not a physical iPhone test. No TestFlight build was uploaded in this task. The local demo's original Arabic/pink appearance was restored; saved ratings and favorites were not changed.
