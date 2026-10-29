---
kind: session
status: source-browser-verified-device-pending
date: 2026-10-27
---
# Original Layouts and Custom Glass

Follow-up: [[2026-10-27-Ready-Themes-Hero-Bounds]] corrects the missed ready-made
Pink/Light modes and featured-title overlap. Evidence below is the earlier v1
matrix, which did not establish Pink/Light consistency across cinematic pages.

Supersedes the Normal-only scope in [[2026-10-26-Normal-Apple-Details]]. All
three original profile layouts now share Apple type, icon and glass details.
Existing geometry, media, section order, shelves and saved choices remain.

Fixed Work/Explore and review-sheet palettes bypassed custom colors. Literal
aliases in `modules/lorefy-design-system.js` and the earlier named layer in
`styles/lorefy-custom-glass.css` now connect pages, work sheets, character
ratings, composer and navigation. Defaults stay unchanged; no frame motion
changes or new preference key. Review-local slider colors were checked too.

Fresh evidence:2587 full-suite tests,54 bilingual profile cases,16 custom main
route cases, desktop Explore, actual picker invalid/apply/reload and opened
work/composer windows without submitting changes. CDP reduced transparency:
opaque review panel and blur none. Five runtime files match both mirrors
(10 hashes),cachev601. Local only, no commit/push/native build/backend change.

[Implementation and evidence](../../docs/PROFILE_CUSTOM_GLASS_QA.md).
Raw screenshots remain outside the vault. Physical-device rendering, owner
visual acceptance and live account synchronization are not certified.

[[systems/Profiles-Lists]] | [[systems/Appearance-Bundles]] |
[[13-Project-Story]] | [[14-Feature-Coverage]]
