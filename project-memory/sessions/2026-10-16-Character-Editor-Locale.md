---
kind: session
status: source-and-browser-verified
date: 2026-10-16
---
# Character editor localization and clipping

Source base `ac2285f` plus this patch. The prior browser recovery check exposed
untranslated controls. [[bugs/LF-012-Character-Editor-Locale]] records scope and
the follow-up 48px/34px layout mismatch seen in a real screenshot.

Five regressions added; existing extracted UI expectations now explicitly check
the Arabic/English helper instead of requiring hard-coded Arabic source text.
Full `npm test`: 1,236 passed, no failures, skips or cancellations. A focused
editor/UI-placement run passed 47 tests. No native build or deployment occurred.

Local-only fixture uses real source/styles and synthetic, in-memory characters:
- English 390px: title, Back, slots, actions, search and Save all English.
- English 320px after layout correction: candidate actions entirely within their
  rows; action width/scrollWidth both 48px. Body client/scrollWidth both 303px.
- Arabic control preservation and untranslated Arabic user content covered by
  runtime regression tests. This is not a complete app-wide language audit.

External artifact: `editor-localized-en-320.png` in the thread artifacts folder.
The source, stylesheet and cache entry changes are copied into both existing
generated web directories. Release configuration and frozen artifacts preserved.

[[05-Verification]] | [[15-Work-Control]] | [[systems/Profiles-Lists]]
