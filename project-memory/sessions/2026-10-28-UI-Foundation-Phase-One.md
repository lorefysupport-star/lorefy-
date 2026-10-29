---
kind: session
status: source-browser-verified-device-pending
date: 2026-10-28
---
# UI consistency plan: first execution batch

The owner authorized beginning the local execution plan after the74-state UI
audit. This batch deliberately fixes the image-picker presentation and profile
tab leakage, not all27 planned units. No GitHub push, native build, service
write, new plugin installation or release operation.

## Reproduced causes

- Audit F01: the image picker mounts under `#screen`, outside `.lf-app`.
  Legacy CSS paired white text with a light accent fill; adding only an
  `.lf-app` selector cannot fix that mount. Direct computed contrast was about
  1.14:1 for Upload and1.02:1 for Automatic in the original dark sample.
- Audit F02: `.lf-profile-reading-statuses` was correctly classified as
  overview content. An important `display:flex` in the named profile-refined
  layer overrode the unlayered important hiding rule. It was a cascade issue,
  not missing tab state or a need to move React-owned DOM.
- English picker chrome was partially Arabic and its legacy direction stayed
  RTL. This was verified on first render independently of translation hooks.

## Changes

- `styles/lorefy-glass-materials.css`: include the standalone picker root in
  existing material/fallback/Arabic-font scopes. Pair primary action/background
  tokens, share glass secondary controls, theme the fallback portrait, use44px
  close/edit targets, and allow long headings to wrap in document direction.
- `styles/lorefy-profile-refined.css`: remove the unnecessary forced display;
  existing overview visibility owns the row again. No new specificity contest.
- `modules/lorefy-growth-features.js`: localize the picker title, accessible
  labels, choices, loading/empty/failure messages and completion text through
  existing `uiText`. Original character names and persistence are unchanged.
- Cache `v611-ui-foundation`; exact changed CSS/module entries are versioned
  in index/service worker, including the growth retry loader. Only these five
  changed web assets are copied to both existing derived trees, not rebuilt.

## Evidence

- Red:3 failures in the first four style contracts;2 English label failures;
  and a separate direction/wrapping regression before its repair.
- Source regressions: `tests/ui-consistency-phase-one.test.js` and
  `tests/character-image-picker-labels.test.js` (9 added cases total).
- Full suite after the final source changes:2666 passed,0 failed, exit0.
  Output is saved outside the repository with the browser evidence.
- Local browser:30/30 cases.18 cover the3 owner layouts ×2 languages ×3 tabs;
  12 cover picker colors ×languages at390px Arabic and320px English. Checks
  include action contrast,44px targets, material presence, bounds, translated
  first-render labels, direction and complete heading width. Minimum measured
  primary-action contrast across the tested colors is6.02:1.
- The five sampled library/progress/favorites/list/custom-image storage values
  remain byte-for-byte unchanged in the isolated preview browser. Theme/language/
  layout changes belong only to the test browser, and their originals are restored.
- Raw pictures and JSON stay outside the repository in the task's
  `artifacts/ui-execution-phase1-20261028/` folder; no personal account evidence.

## Remaining gates

Follow-up: [[sessions/2026-10-28-UI-Foundation-Phase-Two]] adds source/browser
verification for provider retry and modal keyboard/focus isolation. The older
results below remain historical; actual device upload is still unverified.

This closes the source/browser symptoms of F01 and F02, not the complete
image-picker workflow. Alternative-provider retry, modal keyboard/focus
isolation, actual photo permission/upload, account persistence after upload and
physical iPhone behavior still need their own work and evidence. Other sheets,
custom-color depth, typography, catalog fallbacks and the rest of the audit
remain planned. No notification, import or database behavior was changed.

[[systems/Profiles-Lists]] | [[systems/Language-Media]] |
[[13-Project-Story]] | [[14-Feature-Coverage]]
