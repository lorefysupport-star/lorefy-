---
kind: session
status: local-review
date: 2026-10-21
---
# Stable favorites controls and local remove buttons

Owner requested eliminating the shifting remove-action row, removing the intro
copy, and placing search before Characters/By work. Favorites now starts with
four stable slot cells, then search, then mode tabs. Each filled cell has a
sibling × button over its lower corner, with a localized character/slot label
and 44px target. No nested buttons. Active outline/check remains independent.
Remove operates on the clicked cell rather than whichever slot is active and
retains opening-account guards. Name text reserves room for ×. Empty slots
have no remove button. All top explanatory copy and standalone action row are
removed; search-result status/help and save remain intact.

33 related ownership/localization/selection/UI tests passed, including stale
account callbacks, filled-card removal, one selected check and search/mode order.
No real favorites edited during verification. Preserve all earlier local UI
changes. No commit, push, native build or release upload; Device Hub web assets
updated for owner review. Supersedes the compact removal row in the prior
[[sessions/2026-10-21-Favorite-Slot-Checkmark]] decision.

[[systems/Profiles-Lists]] | [[13-Project-Story]] | [[14-Feature-Coverage]]

## Selection refinement

The owner requested a red × in place of the selected checkmark. Only the selected filled card now exposes removal at its top corner; empty selection uses the outline. Switching slots updates existing slot and candidate controls in place, preserving portrait nodes instead of rebuilding the editor. The search input explicitly inherits the transparent background of its single-color container. Focused editor/UI tests: 33 passed, including node identity preservation on slot selection. No commit or push.

## Removal badge polish

Owner rejected the bright red badge size and inset. The visible badge is now 18px with a dark translucent surface, muted red cross drawn from centered CSS strokes, and 4px corner inset. The 44px hit area remains. This supersedes the solid-red badge styling. No behavior or persistence changes.
