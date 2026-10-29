---
kind: session
status: source-browser-verified-device-pending
date: 2026-10-28
---
# Work creators and secondary-title composition

Continuation of [[sessions/2026-10-28-UI-Foundation-Phase-Eleven]]. Existing
UI/UX Pro Max, Apple, debugging and test-first guidance applied. Plugin Management
selected available tools; no new integration or dependency. Local only.

## Reproduced

At320px a long unbroken creator button measured574.7px in a188px text column,
with a36px touch target. Anonymous flex text could not shrink reliably. Work
subtitle/creator lacked explicit source-language direction and translation
protection. Search bylines were11px, single-line clipped, with no full byline
tooltip; button names exposed the title only.

## Source changes

- `modules/lorefy-review-editor.js`: WorkIdentity gives linked creator text a
  shrinking span with automatic direction, leaving the language-specific arrow
  separate. Full creator tooltip, localized Works by action and existing
  openAuthor callback preserved. Plain creator, subtitle and Work heading retain
  literal source text with translation protection; full detail text is not
  clamped. The linked action itself is protected so a source name such as
  `توقف` is not translated as a UI command in its tooltip.
- `styles/lorefy-work-cinema.css`: author action minimum44px, bounded width and
  shrinking text track, anywhere wrapping and fixed14px arrow. Subtitle/plain
  creator wrap inside the column. Existing colors/artwork/layout are unchanged.
- `modules/lorefy-explore-studio.js`: one local byline variable preserves the
  existing author-versus-metadata-source distinction. Search/collection title
  and byline tooltips stay complete and literal. The open-work accessible name
  includes title plus byline; selection callback/ranking/filtering are unchanged.
- `styles/lorefy-explore-cinema.css`: visible bylines are12px/two lines with
  text-relative height, isolation and start alignment. The existing compact
  discovery rails still hide bylines; they were not redesigned.
- `index.html`/`sw.js`: changed assets use `20261028-byline-type-v1`; cache is
  `lorefy-v623-byline-type`. Six runtime web assets selectively mirrored to both
  existing copies. No prepare/sync/native build or frozen-artifact change.

## Verification

-14 new tests. Nine initial failures, then the asset-version failure, then two
  source-tooltip protection failures were observed before the relevant fixes.
  Existing callback/format/ranking tests remain intact. Full suite2859 passed,
  0 failed;14 includes preservation cases that already passed at baseline.
-48 browser cases,0 uncaught page errors: four AR/EN scenarios at320/390/1280,
  pink/dark/custom green/light. Mixed, unbroken, short, dictionary-like linked
  and unlinked creators; full secondary title; normal and exactly2x font sizes.
  Geometry, arrow size,44px target, literal tooltip/text and keyboard callbacks
  checked. Search bylines remain two lines and open the expected work ID.
- WorkIdentity fixture mounts the actual React component in the real detail
  stylesheet context. The author action calls a fixture callback; it is not a
  full author-bibliography or real provider audit. Search uses actual page input,
  local catalog fixtures and keyboard selection. Stored library/progress/
  favorites samples stay unchanged; all QA contexts closed.
- Initial search fixture sampled idle recommendations before query settlement.
  Corrected checks wait for the actual query result captions and verify work ID,
  not a temporary mutated display title after canonical selection. Initial JSON
  retained. A later fixture retained inline text enlargement between React
  renders; it now resets before each case and asserts exactly2x sizing. No CSS
  was changed to accommodate cumulative fixture enlargement.
- Screenshots inspected for enlarged Work identity and actual search result
  bylines. Missing/fallback artwork in fixture screenshots was not repaired or
  certified in this pass; image lifecycle remains the next source concern.
- Evidence: external `artifacts/ui-execution-phase12-20261028/` includes browser
  script/JSON, screenshots, full-tests.log and final parse/byte-parity check.

## Remaining

This closes the local work/search creator portion of the earlier F06 follow-up,
not every secondary text surface. Author bibliography, other result variants,
all dialog language-switch paths, physical Dynamic Type/VoiceOver and native
performance remain separate gates. Next: shared cover loading/failure/retry
presentation (F07), followed by search edition grouping (F08). No GitHub,
Supabase change, actual profile/library save, Apple upload or native build.

[[13-Project-Story]] | [[14-Feature-Coverage]] | [[systems/Language-Media]] |
[[systems/Catalog-Search]]
