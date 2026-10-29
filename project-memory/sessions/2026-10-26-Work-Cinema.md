---
kind: session
status: source-verified-device-pending
date: 2026-10-26
---
# Glass Composer and Work Cinema

The owner requested the post composer first, then the entire work workflow in
the selected cinematic Apple/glass identity. Local only; no push or native build.
Composer work was checked before moving to work details.

## Source and Contracts

- `modules/lorefy-community.js`: author/writing separation, retained owner draft,
  attachment callbacks and length meter; frontmost picker keyboard/focus behavior.
- `styles/lorefy-home-cinema.css`, `styles/lorefy-community.css`: glass writing
  surface, compact icon tools and matching picker; structural fallback retained
  outside the Home presentation scope.
- `styles/lorefy-work-cinema.css`: isolated work layer for artwork, identity,
  commands, navigation, chapters, reviews and connected sheets/character page.
- `modules/lorefy-growth-features.js`: work-sheet Escape uses React close, never
  bypasses a disabled close; character Back uses the existing Lucide pipeline.
- `modules/lorefy-chapter-detail.js`: tooltips; quick actions do not require a
  chapter catalog; type eligibility no longer searches arbitrary header text.
- `tests/cinema-workflow.test.js`: new source regressions including Escape,
  disabled-close protection and books that mention Comics in source/title text.

The original reading/review/cover/character callbacks, source IDs and account
ownership remain authoritative. No totals, reviews, images or catalog metadata
were fabricated. Nonserialized books keep their controls without a chapter UI.

## Verification

See [QA](../../docs/WORK_CINEMA_QA.md). New regressions were red before changes;
focused tests passed. Final complete suite: **2558 passed, 0 failed**, exit 0,
66.3 seconds. Two outdated class/cache assertions failed in the first full run;
they were updated (with broader asset coverage), then the whole suite passed.

44 local AR/EN viewport checks cover composer (including short viewport), work,
status/review/cover sheets, review tabs and character search/filters. No overflow
or pageerrors in tested flows. Actual Berserk cast loaded; Guts search matched.
The nonserialized book fixture had genuine actions and no chapter section after
the canonical-type fix. Valid review input enabled Publish, but nothing was
published. Picker focus/Tab/Escape/return and draft close/reopen passed.

Eight runtime files match both existing web mirrors (16 hashes). Syntax checks
passed for the three changed modules. No build, upload, push, service write or
billing change. Phone-preview opened; installed iPhone/performance, real-account
publishing/upload and Supabase availability remain separate gates.

Related: [[systems/Explore-Works]], [[systems/Community-Notifications]],
[[2026-10-26-Home-Cinema]], [[2026-10-19-Work-Experience]].
