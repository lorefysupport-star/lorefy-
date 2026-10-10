# Local Tester Lab and Language Audit

## In-App Users Follow-Up

The user's clarification changed the presentation: the ten fictional readers now
also appear as other users inside the ordinary localhost demo, without switching
accounts or visiting the lab dashboard. The lab remains an optional test harness.

`modules/lorefy-preview-readers.js` activates only on localhost with
`preview=demo&demo=ready` and an authenticated demo session. It loads fixture JSON
before mounting the app, supplies public profiles and local social relationships,
and adds ten review rows to in-memory UI state. Those review rows are excluded from
the persisted personal review collection. Preview follow state uses its own keys.
Live sessions retain the original backend endpoints; production does not fetch
fixture data. No real auth users or public database records were created.

Verified in the ordinary phone preview: ten searchable readers, ten community
reviews, public favorites, ten library entries, ranked top-ten works, matching
connection counts/rows, and follow persistence after reload. The follow test was
restored afterward. Inline reader search labels were localized in both languages.

Evidence: `qa/in-app-readers-home.png`, `qa/in-app-readers-search.png`.
Final follow-up verification: 969 tests passed, zero failures, with iOS web asset
preparation and copying completed. These checks do not replace physical-device or
real-cloud release testing.

## Scope

Ten fictional local personas and ten fixture reviews are available at
`http://localhost:8795/qa/tester-lab.html`.
These are test fixtures, not real accounts, autonomous users, or production reviews.
The production entry point, service worker, and native bundle do not include them.

Each persona has a distinct username, avatar URL, banner URL, ten-work library,
ratings, four favorites, and a ten-work preference list. The fixture set contains
100 distinct work IDs. Avatars and banners use catalog artwork, not human portraits.
Each persona's local and session storage is namespaced independently from real accounts.

## Confirmed Fixes

- Followers dialog renders complete Arabic or English labels, including counts,
  actions, empty states, and errors, without a post-render translation race.
- Follow actions and selected tabs use theme-aware foreground colors.
- Arabic community filters no longer contain English UI labels.
- Public-profile library headings, social labels, empty character slots, and
  negative recommendation badges translate correctly.
- Late-added accessible labels are observed and translated. Share and comment
  enhancements recognize both languages.
- Unchanged translations no longer trigger unnecessary text mutations.
- Panoramic identity reserves space beside the avatar; social links wrap below
  the identity; follower counters stay adjacent with a 24px gap.

## Browser Evidence

- Ten personas visited Profile, Library, Explore, and Home: 40 main-route smoke checks.
- Followers dialogs checked for all ten personas, split across Arabic and English.
- Additional final checks: Arabic/English dialogs, language switching in both
  directions, public visitor profile with four favorites and ten library entries,
  ten visible community reviews, and 20 loaded dashboard images.
- Edited a tester name, reloaded, verified persistence, then restored the name.
- Unfollowed a tester, reloaded, verified persistence, then restored the relationship.
- Original account identity, social links, theme, and favorites remained separate.
- Responsive panoramic checks covered widths 320, 375, 390, and 440 pixels.

Evidence: `qa/tester-audit-20261009.json`, `qa/panoramic-identity-matrix.json`,
`qa/followers-language-ar.png`, `qa/followers-language-en.png`, and
`qa/tester-dashboard.png`.

## Limits and Remaining Release Checks

This is not an exhaustive zero-defect certification. Real authentication, cloud
sync, physical iOS execution, production uploads, native sharing, and every import
format still need live or device verification. Fixture backend reactions and
comments are deliberately lightweight; they do not validate production backend behavior.
User-written names, biographies, reviews, and work titles retain their original
language rather than being translated as system UI.

Regenerate fixture assets after runtime changes with `node tools/build-tester-lab.mjs`.
Final automated test output is recorded in `qa/tester-language-test-results.txt`.
Final result: 962 tests passed, zero failures. `npm run ios:prepare` and
`npx cap copy ios` completed successfully; native asset synchronization passed.
