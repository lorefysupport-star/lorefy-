---
kind: session
status: source-browser-verified-visual-review-pending
date: 2026-10-27
---
# Home Against the Approved Explore Reference

The owner explicitly approved only the Explore screenshot and rejected the
remaining Home, Library and profile presentation. Preserve Explore as the
reference. Following the existing section-by-section rule, this pass changes
Home only; Library and profile redesigns remain pending and are not claimed done.

## Implementation

- `styles/lorefy-home-immersive.css` is a separate earliest named layer with
  Home-only selectors. At the top, sharp current-reading artwork extends behind
  the white title and glass feed tabs, replacing the grey blurred header cap.
  A dark graduated scrim supports the title, and the lower image blends into the
  selected page color. The Continue command becomes a compact glass capsule.
- `modules/lorefy-home-cinema.js`: the reading section binds a passive scroll
  listener to its own page. Chrome is immersive at the top, dense glass after
  48px, and plain readable chrome for empty reading. Equivalent events do not
  repeat DOM writes; layout-effect cleanup removes the listener and attribute.
  Reading data, navigation callbacks, current-work artwork binding and reviews
  are unchanged. Reduced-transparency header fallback is retained.
- Cachev604; Home module/material CSS version20261027-home-reference-v4. Four
  runtime files selectively match both existing web mirrors (8 SHA256 checks).

## Verification

Three new tests observed red before implementation.20 focused tests passed,
including scroll/reset/cleanup, empty state, callback/progress preservation and
strict Home-only style scope.

24 fresh local-demo cases: two reading works (Berserk/Pride and Prejudice), three
themes (Pink/Dark/custom green), two languages and320/430px. Sharp initial art,
white readable heading, bounded Continue command, no tested horizontal overflow,
scrolled glass state and return-to-top all passed. Scrolling did not change the
saved reading/progress values. Fixtures were changed only in the isolated demo
browser; existing user IAB storage was not altered.

An existing IAB local-demo reading state was opened in a separate Home preview.
The original cover and saved progress remain visible;
the grey cap is gone and the compact Continue action is present. Existing Explore
tab was left intact. Raw images/scripts/logs stay in task artifacts outside Git
and the vault. Final `npm test`:2598 passed,0 failed,exit0,52.4 seconds.

Local source only: no commit/push, native build, Apple upload, service change or
production account mutation. Installed-device performance/accessibility and
owner visual acceptance remain open. Library must retain the owner's earlier
no-cover-background decision; do not clone Explore's background blindly there.
Profile changes must be checked at scrollTop0 in each original layout before
treating an off-screen toolbar as a missing-control bug.

[[systems/Appearance-Bundles]] | [[systems/Profiles-Lists]] |
[[13-Project-Story]] | [[14-Feature-Coverage]]
