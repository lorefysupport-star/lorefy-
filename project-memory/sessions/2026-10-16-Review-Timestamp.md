---
kind: session
status: source-and-browser-verified
date: 2026-10-16
---
# Review Timestamp Localization

Continued from `3451cc2` without native building, installation or service changes
to Lorefy. Scope: the unresolved review timestamp noted in LF-016.

## Cause and Fix

The React review renderer hard-coded Arabic independently for date and time.
It now formats the raw value through the bilingual helper in
[i18n](../../modules/lorefy-i18n.js) using the current render language `W`.
No post-render parsing of translated date text or changes to user content.
The giant legacy source line received a single exact expression replacement;
no unrelated application formatting or rewrite was performed.

## Evidence

- [Six regression tests](../../tests/review-timestamp.test.js) failed before the
  repair, then 22 focused tests passed. Explicit epoch zero, ISO dates, absent
  values, invalid/non-finite values and repeated language changes are covered.
- Complete suite: 1,256 passed, zero failures.
- Isolated Chromium 390x844: Arabic review date remained Arabic; English showed
  `October 9, 2026` and `12:00 PM`. Author and Arabic review prose stayed intact.
  No comments, reactions or other writes were submitted.
- Canonical app/i18n/index/service-worker changes were copied only to the existing
  two web-asset trees. Cache keys advanced; this is not a native build.
- Evidence screenshots remain outside Git/vault under the local UI-audit artifacts.

## Device Connection Boundary

The earlier Apple usbmux connection was unavailable. The owner explicitly asked
for control without the iTunes UI and authorized repair of the background Apple
connection component only. This is separate Windows tooling, not a Lorefy source
fix or permission to sync/restore the phone, install an app build or alter its data.
No device result is inferred from the source test results above.

[[bugs/LF-017-Review-Timestamp]] | [[17-Extended-Review-Plan]] | [[05-Verification]]
