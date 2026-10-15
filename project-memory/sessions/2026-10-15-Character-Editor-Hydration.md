---
kind: session
status: source-and-browser-verified
date: 2026-10-15
---
# Character editor loading and recovery

Base `c2da5fd` plus this patch. [[bugs/LF-011-Character-Editor-Hydration]] records
the reproduced missing refresh and unavailable recovery action. Six regression
cases added to the existing owner-isolation harness; three initially failed.

Full `npm test`: 1,231 passed, no failures, skips or cancellations. Selective
growth/index/service-worker web copies match; no build commands were run.

Actual source and styles in the local-only
[fixture](../../qa/character-gallery-hydration.html):
- Arabic, 320px: delayed loading, synthetic offline failure, visible Retry,
  successful recovery to two candidates; body client/scroll widths both 318px.
- English, 390px: new error/Retry strings render in English, recovery works,
  selection and Save record two in-memory fixture writes. No account storage or
  production request is used. Portrait initials are intentional fixture data.

Screenshots are outside Git/vault in the thread artifacts folder:
`editor-retry-ar-320.png` and `editor-loaded-ar-320.png`.
QA shell directions/overflow are isolated from application body rules; no runtime
layout or real avatar changes were made to obtain these screenshots.

Browser inspection also exposed older untranslated Arabic editor controls under
English. That is a separate localization issue, not claimed fixed here.
Real-device/native verification still needs a separately authorized installed
source update. No service, binary, Apple upload or release configuration changed.

[[05-Verification]] | [[15-Work-Control]] | [[systems/Profiles-Lists]]
