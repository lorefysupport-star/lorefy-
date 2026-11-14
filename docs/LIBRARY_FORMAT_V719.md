# Library: format filters and focused controls

Date:2026-11-14. Baseline:1eea7b8. Source/web repair only.

## Reference and scope

Reviewed [Lootd Library](https://www.lootd.app/library) again in the existing
signed-in browser, read-only. Its title/Add action, status totals, search and
cover-first collection form a clear hierarchy. Clicking a status shows loading
and then matching covers; All restores the collection. No rating/library change
was saved, and no account content or screenshot is committed here.

This adopts observable interaction clarity, not Lootd's private backend or
unmeasured performance. Lorefy keeps local search rather than fetching on each
keystroke, its own glass tokens, reading units and all four presentation modes.
UI/UX Pro Max guidance informed result recovery, named controls and responsive
filter collections; Apple interaction guidance informed immediate response and
stable targets. No plugin installation or runtime design dependency was needed.

## Changes

- A named Work type selector offers formats actually present in the saved
  collection, with full counts. Existing bilingual format normalization merges
  aliases without treating light/web novels as ordinary novels.
- Selection scopes status totals and cards before query/sort/render batching.
  Query text does not turn status totals into counts of only the mounted cards.
- Format, query, revealed batch and scroll restore on return from a work;
  transient state remains owner-scoped and bounded. An old context cannot
  change the new selection or request another result batch.
- Cached membership metadata is reused for format switches. Search remains
  inside Collection; no catalog search or service write is added to this filter.
- Header includes a44px Add action. Format/sort controls sit together, status
  controls remain horizontally reachable, and four layout icons move alongside
  the result summary. Narrow phones stack the two selects rather than shrink
  their labels. Empty filters have local reset actions.
- New checkpoints show the saved reading status instead of repeating missing-
  progress prose below every cover. Positive saved progress and known totals
  retain their original unit-aware summary; no progress is credited or saved.
- The new rules join the existing Library refinement layer, so important
  legacy rules cannot override select padding, touch size or heading layout.
  Dark/light/custom glass colors derive from the app tokens, not a new palette.

## Source and evidence

Core: `modules/lorefy-library-cinema.js`; render bridge:
`uploads/files/lorefy-app.js`; existing layout controls:
`modules/lorefy-library-view.js`; styles: `styles/lorefy-library-cinema.css`.
Script/CSS/offline keys use v719 and only these changed web files are mirrored
to `ios-web` and `ios/App/App/public`. No native preparation or binary creation.

- Fifteen added cases:13 data/filter cases and2 control cases failed before
  implementation. The real app renderer also demonstrated the missing short-
  status behavior before its fix.88 focused source cases pass.
- Isolated browser fixture:24 existing catalog works, three per format.
  All/eight format counts, advanced saved status totals, query-clear, resetting
  filters and work-open/return exercised through UI controls.
-96 layout cases:AR/EN x dark/light/two custom colors x320/390/768px x four
  display modes. No page overflow, three selected cards retained, all measured
  new selects/Add/layout targets at least44px (fractional tolerance0.1px).
  No JavaScript page errors. Actual pictures are sourced, not generated fillers.
- Final full suite:3609 passed,0 failed/skipped/cancelled,119666ms, exit0.
  Twelve modified native-web mirror files match canonical sources byte-for-byte.
  Project-memory audit:383 notes,887 source files, no issues or orphan notes.

Local evidence is outside the repository in the parent workspace:
`output/playwright/library-v719-browser.cjs`, `library-v719-results.json`,
`library-v719-*.png`, and the full-suite logs in `output/`.

## Limits

No production account, library or reading state was changed. Browser fixtures
use local demo storage. Remote APIs were blocked; actual image requests were
allowed, so image-provider availability remains separate from filter behavior.
No iPhone/WKWebView performance or frame-rate certification; no new build,
Supabase change, payment or Apple upload. The existing42-item batch and all
saved works remain reachable; this is not an artificial library size limit.
