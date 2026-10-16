---
kind: session
status: source-browser-verified
date: 2026-10-16
---
# Statistics Locale on First Render

Base `9f972ae`; [[bugs/LF-019-Statistics-Locale]]. Implements the extended review's
language/readability requirement in the existing statistics screen. No new build,
phone installation, cloud operation or account-data mutation.

## Root Cause and Change

The renderer forced RTL and ar-SA numbers, while several Arabic copy strings were
absent from the dictionary. Partial DOM replacements produced mixed-language text.
The shared React context now passes `lang:W`. The screen uses that value before
document-language effects, explicitly translates system copy, formats numbers in
the matching locale and declares its own lang/direction. Its subtree opts out of
legacy post-render translation. Known format/day labels localize; unknown custom
labels and all input values remain unchanged. Back uses the appropriate Lucide
arrow and a 44px target. Distinct weekday abbreviations replace clipped prefixes.

## Evidence

- Seven new tests failed before implementation, then passed. Coverage includes
  first-render copy/accessibility, AR/EN direction/digits, stale document language,
  back icon/target, empty states, immutable custom data and zero/invalid values.
- Full suite: **1,272 passed, 0 failed**. Affected web assets match the two
  existing native copies. Cache `lorefy-v469-statistics-locale`.
- Browser: AR/light and EN/light at 320x844; English has lang=en, dir=ltr,
  no Arabic UI characters and 320px client/scroll width. Estimate disclosure
  opens with Enter. EN/dark at 440x956 shows the full page without clipped labels.
- Screenshots/TAP remain in the conversation artifacts outside Git/vault.

The source review also confirmed that the chart's weekday order ignores actual
calendar keys. That separate correctness change is
[[bugs/LF-020-Statistics-Activity-Dates]], not certified by this language receipt.
The installed Build 35 and live iPhone mirror are independent targets.

[[05-Verification]] | [[17-Extended-Review-Plan]] | [[systems/Language-Media]] |
[[systems/Reading-Library]]
