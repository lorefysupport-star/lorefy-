# Lorefy Beta Audit - 2026-09-09

## Decision

Local preview is available. Release readiness is NOT established. No new EAS build or TestFlight upload was performed during this audit. Existing Build 21 does not contain these working-tree fixes.

## Fixed In This Pass

- Persist Top 4 work and character selections immediately, including character removal and duplicate swaps.
- Refresh React stored state after edits from the standalone editor, without forcing a page reload.
- Keep library and reading progress for work IDs missing from a partially loaded catalog.
- Route direct favorite-slot clicks and keyboard actions to the bounded editor before the legacy React handler.
- Refresh an already-open work editor when the deferred catalog completes; do not label unresolved saved work as empty.
- Discard closing editor instances before reopening to avoid reusing stale selections during the exit animation.
- Rank matching work titles ahead of author matches in character-work search.
- Limit background manga enrichment to applicable work types, use the data gateway, and pause after throttling.
- Share native image files without adding an internal capacitor:// URL.
- Restore visible character labels and dark overlay theme tokens; wrap favorite work labels and fit exported headings.
- Update changed asset versions and synchronize the iOS web bundle.

## Verified

| Check | Result | Scope |
| --- | --- | --- |
| npm test | 300 passed, 0 failed | Includes pagination, nested categories, cache-completion, source-merge, image-merge, branded-community, and broad-root regressions |
| npm run ios:sync | Passed | Generated iOS assets and 7 Capacitor plugins synchronized; not an Xcode compilation |
| git diff --check | Passed | Existing line-ending warnings only |
| Repeated Top 4 navigation | 10 cycles, no pageerror, no leftover overlays | Isolated Chromium local demo, not a physical iPhone |
| Favorites persistence | Work and character selections survived reload | Local demo storage; live-account cloud restoration not tested |
| Direct work slot | Correct editor and saved second slot verified after reload | 390 x 844 viewport |
| Covers | Original Pride and Prejudice / Nineteen Eighty-Four image URLs loaded | Sample only, not every catalog URL |
| Characters | Hunter x Hunter fallback returned 200 characters; sampled portraits rendered | Not a guarantee of exhaustive source coverage |
| Character image export | Downloaded and inspected a 1080 x 1920 PNG with actual portrait | Browser download fallback; physical iOS share sheet not exercised |
| Light / dark appearance | Favorite labels, covers, overlay colors inspected | Screenshots in output/playwright |

## Remaining Gaps

1. Current loaded catalog: 22,645 records. 1,770 have no HTTP(S) original cover URL; generated/local fallback artwork is not counted as an original cover. 5,727 records contain the boilerplate phrase `This Lorefy entry includes source rating` instead of a fully reviewed description. Records were not deleted to hide these gaps.
2. Integration probes from September 8: AniList returned 403 with an upstream service-disabled message; Open Library catalog search returned 502; a Jikan character request returned 504 while Kitsu fallback worked. These are point-in-time results, not proof of permanent outages. MangaDex and sampled image proxy requests returned 200.
3. lorefy.app work-link and Apple association-file fetches failed from this machine. Public deep links must be tested from a real device and the public domain before release.
4. Supabase auth settings enable Google and Apple and disable email. Google OAuth preflight redirected to Google. Apple WEB OAuth returned `missing OAuth secret`. Native Apple ID-token sign-in uses a separate path and has not been verified end to end here.
5. Strict App Store preflight is blocked by privacy-nutrition-label verification and content-rights verification. Neither was marked complete without evidence.
6. Physical iOS cold launch, memory pressure, camera/photo permissions, native save/share, Google/Apple account round trips, and live cloud persistence still require device/account testing. Browser success cannot certify absence of iOS crashes.
7. Recommendation submission, all cover-picker providers, every list type, notifications, and account deletion have not all been exercised against a real authenticated account in this pass. Automated contract tests are not substitutes for those live checks.

## Evidence

- `tests/beta-persistence.test.js`
- `output/playwright/beta-works-light.png`
- `output/playwright/beta-works-dark.png`
- `output/playwright/beta-slot2-persisted.png`
- `output/playwright/beta-character-dark-fixed.png`
- `output/playwright/beta-top-characters-export.png`

## Preview

http://127.0.0.1:8794/index.html?fresh=beta-audit-20260909&preview=demo&demo=ready&route=profile

This URL explicitly uses a local demo identity, not the user's production account. Local demo changes do not prove production synchronization.

## Follow-up: Titles, Casts, And Alternate Covers

- English titles take precedence in work context and saved character lists. Existing Japanese list metadata is resolved for display without deleting or reordering saved selections.
- Character-poster headings separate the list heading and work name onto two lines. The exported Demon Slayer PNG was inspected: full English title and ten actual portraits.
- An inactive rights filter no longer bypasses the image gateway. Local image URLs now use the implemented `/api/media` route, not the nonexistent `/api/catalog/media` route. MangaDex volume artwork was visually verified instead of counting a successful placeholder response as valid art. The production Supabase image route also returned the same 218,870-byte sample JPEG.
- Kitsu fallback now supports AniList-only records and supplements short manga rosters with an exact-title anime adaptation when available. Unrelated search results are rejected. Pagination is covered by regression tests, and the cast cache version is advanced.
- Dynamic character results merge every available provider and are cached as complete only when an authoritative provider reaches its final page. No 25-character threshold remains. A provider-verified work with fewer than 25 characters remains valid.
- MangaDex selection prefers the exact canonical work before linked variants, then walks every cover page. No ten-cover application limit remains.
- An incomplete character request stops displaying a permanent loading message after its bounded retries.

### Follow-up Evidence And Limits

- Live fallback samples: Dragon Ball 141 characters with 141 image URLs; Berserk 71 with 71 image URLs. These counts do not certify an exhaustive franchise roster or every image download.
- Demon Slayer live verification now resolves 157 deduplicated remote characters with 157 image URLs. The app UI merged its bundled seed and displayed 158 characters; all 158 rendered images loaded after expanding the complete list.
- Demon Slayer live cover verification returned 52 alternatives, including 51 MangaDex image URLs. The picker exposed all 52 numbered covers after expansion; its 53 image elements (current cover plus alternatives) reported zero failures.
- These results prove that Lorefy no longer truncates provider results at 25 characters or 10 covers. They do not prove that an external provider catalogs every fictional character or edition for every one of Lorefy's 22,645 works.
- An isolated demo list seeded with a legacy Japanese title retained all ten selections after reload and displayed the English title. Production account storage was not modified.
- Browser image-download fallback was exercised with Web Share disabled in the isolated test browser. A normal browser Web Share call was initiated, but OS share-sheet completion was not verified. Physical iOS sharing remains untested.
- `output/playwright/ds-covers-fixed.png`: actual alternate volumes, no MangaDex hotlink placeholders in the inspected grid.
- `output/playwright/ds-character-top10-fixed.png`: 1080 x 1920 exported poster with complete English title.
- `output/beta-catalog-tests.log`: follow-up test output. iOS assets were synchronized again after the poster changes; this is not a new native build or upload.

Updated preview: http://127.0.0.1:8794/index.html?fresh=full-catalog-20260909-v1&preview=demo&demo=ready&route=detail&type=Manga&novel=mal-manga-96792-kimetsu-no-yaiba

## Follow-up: Complete Visual-work Cast Discovery

- Manga, Manhwa, Chinese Manhua, and Comics now use exact-title Fandom community discovery when the catalog does not include a hard-coded source mapping.
- Character loading follows every MediaWiki page and descendant character subcategory. The former 25-character completion heuristic and 1,000-row visual-cast cap are removed.
- Comics prefer comic-only character categories when available, preventing television, game, and general franchise rosters from being mixed into the comic cast.
- Failed or safety-limited source traversals are not cached as final, so a later request can retry instead of preserving a partial roster.
- A successful short MAL, AniList, Kitsu, or Wikipedia response is no longer enough to mark a visual-work roster complete. Only the completed work-scoped community traversal can suppress later refreshes, and the cache is advanced to v20 to discard old 25-row final entries.
- Exact title discovery supports both multi-word and single-word visual titles, with the community name verified before its character category is accepted.
- Live source samples: Dr. Stone displayed 90 merged characters with no failed rendered images; Jujutsu Kaisen returned 156/156 characters with image URLs; Solo Leveling returned 146/146; Martial Peak returned 1,083 characters with 991 source images; The Walking Dead comics returned 815 characters with 789 source images.
- The 92 Martial Peak and 26 Walking Dead entries without source thumbnails remain available by name. Lorefy does not fabricate missing character artwork, and these point-in-time samples do not prove that every external wiki contains every minor character.
- Regression coverage now verifies all four visual-work types, nested subcategories, more than 1,000 characters, comic-only scoping, cache completeness, and dynamic community discovery.

Updated preview: http://127.0.0.1:8794/index.html?fresh=all-visual-casts-20260909-v3&preview=demo&demo=ready&route=detail&type=Manga&novel=mal-manga-103897-dr-stone
