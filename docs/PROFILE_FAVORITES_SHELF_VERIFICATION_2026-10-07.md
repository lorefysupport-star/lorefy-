# Profile Favorites Shelf

Date: 2026-10-07

- Favorite works follow the existing local Bookshelf preference; Covers and List retain the ordinary favorites grid.
- Favorite character tiles are deliberately excluded.
- Current selected works and their order remain untouched. No account writes are introduced.
- The shelf reuses the existing cover images and gets titles directly from the work records.
- Four book slots are capped at 74px each, with 8px gaps. The shelf is centered and capped at 336px: a balanced size between the previous 62px spines and the oversized 99px version. It shrinks on narrower screens while preserving 44px minimum touch targets.
- Books now use stable title-derived heights of 176, 208, 188 or 220px, with one aligned baseline and a 224px grid row. Empty add slots alternate between 180 and 196px. Library-book heights are unchanged.
- Current favorite books measure 176, 208, 188 and 208px high; their measured bottoms match exactly at the normal viewport. Spine-title width allows two text columns without clipping the shorter book's title.
- The 12px shelf has a top lip and front edge; cover-derived spines have binding ridges, a page-edge detail and subtle upper/lower rules. No extra images or 3D engine are introduced.
- Long titles wrap in the spine rather than being prematurely ellipsized.
- Empty favorites retain the existing single add action.
- Keyboard and pointer actions open the matching favorites-editor slot. Hydration could previously reuse the initial empty DOM slot and retain its old index; handlers now resolve the current position at interaction time.
- Book hover/focus feedback respects reduced-motion preferences.

## Verification

- Test-driven checks cover repeated rendering, title changes, layout reversal, empty favorites, character exclusion and geometry.
- Geometry and persistence checks passed before the final full-suite run; one regression test reproduces the reused-slot issue before the fix.
- Latest final suite: 790 passed, zero failed, zero skipped; 55.840 seconds. Log: `qa/profile-balanced-shelf-20261007-tests.log`.
- Browser checks: existing two favorites and three favorite characters preserved; keyboard slots 1 and 2 and pointer empty slot 3; switching back to covers; Light, Dark and Pink palettes.
- Latest width check: no document horizontal overflow at 320x850 or normal 464x976. Slots measured 63px at 320px and 99px at 464px; the shelf measured 424px at 464px, with aligned book bottoms and unchanged favorite selections.
- `npm run ios:prepare` and `npx cap copy ios` completed after the final runtime changes.
- Final browser error-log query returned no errors.
- SHA256 matches confirmed for the changed runtime files in the source, prepared `ios-web` and native `ios/App/App/public` directories.
- Evidence: `qa/profile-book-relief-20261007/profile-pink.png`, `pink-320.png`, `desktop.png`, `dark.png`, `light.png`.
- Wider-shelf evidence: `qa/profile-wide-shelf-20261007/profile-pink.png`.
- Varied-height evidence: `qa/profile-shelf-heights-20261007/profile-pink.png`. Browser checks at 464x976 and 320x900 confirmed unchanged widths (99px and 63px), aligned bottoms, complete current titles and no horizontal overflow.
- Latest slender-spine evidence: `qa/profile-slim-spines-20261007/profile-pink.png`. Browser checks at the user's normal 432x1192 viewport and 320x900 confirmed 62px spines, a 276px shelf, complete titles and no horizontal overflow. The user's current four favorites are untouched.
- Latest balanced-shelf evidence: `qa/profile-balanced-shelf-20261007/phone-preview.png`. At 390x844, books measure 74px and the shelf 336px. At 320x900, books shrink to 60px and the shelf to 280px. Current titles remain complete, no horizontal overflow occurs, and favorite selections and varied heights are unchanged.
- Desktop width check: 1280x900 has no horizontal overflow; shelf is capped at 480px with four 113px slots. Temporary viewport overrides were reset.

No new TestFlight build was uploaded. Physical-device validation remains outstanding. These are cover-derived spine visuals, not publisher-provided physical spine artwork.
