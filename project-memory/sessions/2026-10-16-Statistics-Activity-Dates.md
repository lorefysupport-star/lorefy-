---
kind: session
status: source-browser-verified
date: 2026-10-16
---
# Statistics Activity Calendar Dates

Base `47a3861`; [[bugs/LF-020-Statistics-Activity-Dates]]. Continues the extended
review's requirement for statistics with a truthful period and missing-data state.
No native build, installation, service deployment or account-data mutation.

## Evidence and Repair

The main renderer creates seven rolling local date keys from the saved daily
chapter-increase map. The statistics normalizer ignored those keys, assigning
Saturday-to-Friday labels regardless of the actual rolling week. An isolated
Thursday-window regression showed Friday's value mislabeled Saturday. The date
sequence happened to align on the current Friday; this coincidence was not
treated as proof of correctness on other days.

The statistics renderer now validates padded/non-padded YYYY-M-D keys against
their calendar components. UTC is used only as a timezone-neutral carrier for
that calendar date, not to reinterpret the saved local date as an instant.
Localized Gregorian weekday/date labels follow that key. Each bar exposes its
complete date and value through role=img/aria-label and a tooltip. Invalid dates
keep an explicit caller label or a neutral dash, never a guessed weekday.

Normalization still caps rendering at seven supplied entries and preserves input
order and objects. It no longer invents seven rows for missing history. Empty
data has localized copy, while actual zero-valued rows remain visible. Explicit
zero wins over legacy fallback fields. Non-finite or negative counts display as
zero without rewriting history. Cumulative reading metrics are unchanged.

## Verification

- Eleven new regression cases failed before the corresponding changes, then
  passed. The focused activity/locale/estimate group passed 27 tests.
- Cases cover rolling Thursday, padded/non-padded dates, month/year boundaries,
  invalid dates, three host timezones, preserved zero, missing history, Arabic
  weekdays, immutable/bounded records, invalid counts and accessible bar names.
- Browser: EN/dark at 440x956 and AR/dark at 320x844. The source preview's seven
  bars expose October 10 through October 16, 2026, with matching localized
  weekdays and preserved zero values. Non-Friday/timezone variants are unit
  evidence, not claims of changing the browser or phone clock.
- Four affected existing web assets match both native web copies. Cache
  `lorefy-v470-statistics-activity`. Raw screenshots and TAP remain outside Git.

Full suite: **1,283 passed, 0 failed** after the runtime/cache changes.
The subsequent memory/activity focused group passed 15 tests. The local memory
audit reported 95 notes, 510 source files, fresh fingerprints and no issues,
orphan notes or duplicate groups.
Native VoiceOver, future installed-source matching, persistence and service sync
are not certified by this source/browser receipt.

[[05-Verification]] | [[17-Extended-Review-Plan]] | [[systems/Reading-Library]] |
[[sessions/2026-10-16-Statistics-Locale]] | [[12-Device-Repairs]]
