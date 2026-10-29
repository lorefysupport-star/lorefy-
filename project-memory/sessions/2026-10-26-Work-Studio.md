---
kind: session
status: source-verified-device-pending
date: 2026-10-26
---
# Structural Work Editor Redesign

The owner rejected the connected editors' old composition under glass colors.
This revision supersedes that part of [[2026-10-26-Work-Cinema]], retaining its
work-page, chapter-eligibility, Escape and canonical-data repairs. Local only.

## Source

- `modules/lorefy-work-panels.js`: shared focus-contained sheets, reading status
  cards/checkpoints and preview/apply cover studio. Original callbacks own data.
- `uploads/files/lorefy-app.js`: guarded status/cover hooks, with old fallbacks.
  `tools/patch-work-studio.mjs` keeps those minified-source insertions repeatable.
- `modules/lorefy-review-editor.js`: three preserved views and quarter steppers.
- `modules/lorefy-growth-features.js`: character studio marker; source search,
  rating, portrait editing and pagination still own their behavior.
- `modules/lorefy-chapter-detail.js`: glass action palette, bounded placement,
  keyboard contract and listener cleanup.
- `styles/lorefy-work-studio.css`: scoped named layer before Work Cinema, so new
  important rules beat old sheet styling without changing unrelated sections.
- `tests/work-studio.test.js`:15 new regression tests, including async ownership,
  failed-save recovery and the generic image-fallback boundary.

## Evidence and Limits

[QA](../../docs/WORK_STUDIO_QA.md): full suite2573/2573, exit0,81.2s. Local
AR/EN320/390/430/1024 checks, three review views, short500px viewport, genuine
cast search, checkpoint save/reopen, image failure, menu fit/keyboard, and
phone-preview mount passed. No post/review published or actual upload performed.
Eight runtime files selectively match both web mirrors (16 hashes). Cachev598.

Production traffic was blocked during isolated browser checks. External images
and providers may fail. Physical iPhone keyboard/VoiceOver/performance, real
account persistence/upload and Supabase recovery remain independent gates.
No GitHub commit/push, native build, Apple upload or production service change.

Related: [[systems/Explore-Works]], [[systems/Reading-Library]],
[[systems/Language-Media]], [[13-Project-Story]], [[14-Feature-Coverage]].
