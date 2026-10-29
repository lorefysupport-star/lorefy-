---
kind: system
status: source-browser-verified-device-pending
date: 2026-10-28
aliases: ["خصوصية القوائم", "البيانات", "تصحيحات", "سلامة", "privacy", "data export", "corrections", "safety"]
---
# Privacy and data tools

Legal/support presentation:
[[sessions/2026-10-28-UI-Foundation-Phase-Eight]]. Four Arabic articles remain
exact; only shell/style/navigation changed. Standalone theme module touches no
account state.19 new regressions,2792 full tests,65 browser cases; no public
Edge Function deployment, contact, legal approval or hardware verification.

[[sessions/2026-10-28-UI-Foundation-Phase-Seven]] covers the review-options
report/mute/block form. Direct AR/EN shared chrome, single-flight pending state,
draft-preserving safe failure and account/window lifetime guards. Core stores a
remote receipt only for its opening owner/client/generation and merges with the
current list.2773 full tests and20 browser checks; operations were replaced by
fixtures before activation. No live delivery or moderation certification.

[[sessions/2026-10-28-UI-Foundation-Phase-Six]] adds correction center/editor,
Safety and Missing work draft presentation sequentially. Shared Product Tools
chrome is now `.lf-product-studio`; Data-specific row layout stays separate.
`styles/lorefy-trust-studio.css` owns the additional content.22 new tests,
2752 full tests and56 browser checks include12 Data regressions.

Corrections are a device queue, not a submitted service. Missing works retain
the account-scoped catalog-request API and validated public-reference contract.
Safety status labels represent saved records, not a live service inspection.
Pending/failure UI was exercised with a replaced fixture service only; no real
unblock, moderation submission, draft deletion/export or account action ran.

[[sessions/2026-10-28-UI-Foundation-Phase-Five]] scopes the Data center to the
current glass/material/font contract, direct AR/EN and read-only QA. The shared
Product Tools modal lifecycle now isolates its parent and releases its own state
on replacement or removal. The later phase-six note defines the additional
opt-in forms and their limits; this earlier one-screen evidence is historical.

## Ownership

- [Product Tools](../../modules/lorefy-product-tools.js): `openDataCenter`,
  `renderVisibilityRows`, `openSheet`/`closeSheet`, `runExport`, JSON/CSV/native
  handoff. Data screen opens without writing settings or exporting anything.
- [Product Core](../../modules/lorefy-product-core.js): portable export allowlist,
  legacy list visibility and safety/correction storage. Default legacy visibility
  is private; export excludes sessions and Premium status.
- [Profile Sections](../../modules/lorefy-profile-sections.js): owner-scoped
  profile lists and `setFolderVisibility`. Profile lists support public/private,
  whereas legacy lists also expose unlisted. Do not unify those stored contracts
  through labels or assume all creation defaults are private.
- [Data studio](../../styles/lorefy-data-studio.css) owns only data-sheet chrome,
  layout and controls. [Shared materials](../../styles/lorefy-glass-materials.css)
  owns palette-derived glass and fallbacks at its actual mount.

## Regression start

`node --test tests/data-studio.test.js tests/privacy-safety-repairs.test.js tests/product-core.test.js tests/glass-materials.test.js`

The13 new tests execute real localized builders/modal lifecycle and a deferred
export preparer without external I/O. Full source evidence is2730 tests and20
local browser cases for this batch, not proof of device export or cloud writes.

Normal Close/Escape/backdrop restores Settings/opener. Synthetic disappearance
of the complete outer Settings dialog releases the child/background but does
not guarantee focus on the root Settings trigger; its observed Body focus is
an open legacy behavior, not a child-modal completion claim.

[[09-Data-Contracts]] | [[systems/Accounts-Sync]] | [[systems/Profiles-Lists]] |
[[08-Feature-Router]] | [[14-Feature-Coverage]]
