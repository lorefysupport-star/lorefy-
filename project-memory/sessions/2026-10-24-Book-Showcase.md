---
kind: session
status: local-verified-service-pending
date: 2026-10-24
---
# Ranked book showcase

Owner selected the three-book reference: dominant first work in the center,
second left, third right, red order numbers and serif title captions.
Local only: no GitHub push, native build, service change or release.

## Implementation

- [Library view](../../modules/lorefy-library-view.js) accepts additive `showcase`
  in the existing `lorefy.library.view.v1` preference. Covers, Bookshelf and the
  pre-existing List choice retain their IDs. Labels: "عرض بارز" / "Showcase".
  Further books occupy subsequent rows, not hidden overflow. Numbers describe
  display order, not a new score. No React-owned cards or actions are moved.
- [Styles](../../styles/lorefy-book-showcase.css) preserve genuine cover images,
  using subtle skew/shadows for depth. Fixed caption space and two-line labels
  prevent long titles lifting a cover. Full native titles/work actions remain.
  Reader page composition no longer overrides an explicitly selected Bookshelf.
- [Settings](../../modules/lorefy-interface-settings.js) previews the new mode
  with balanced choices. Mode changes, storage failures, unknown values and
  empty-profile hydration preserve existing contracts and actions.
- [Public appearance](../../modules/lorefy-public-appearance.js),
  [discovery](../../modules/lorefy-user-discovery.js) and
  [public renderer](../../modules/lorefy-public-profile.js) retain a supplied
  owner showcase choice; viewer preferences never select the owner's grid.

## Verification and limits

Six behavioral tests cover additive persistence/failure, triplet positions,
exclusive modes, idempotent DOM/actions, normalization and empty hydration.
Five initial tests and the later empty test failed before their implementation.
Another public-render test preserves all four work actions. Final full suite:
2432 passed, zero failures/skips/cancellations, exit 0, Node heap 8GiB.

Browser: choose/save/reload in settings, actual owner favorites/library, all old
choices, open a work, 320px dark with four loaded books and no horizontal
overflow. Reference comparison uses the same titles with actual catalog
editions; saved account favorites were not overwritten. QA/fresh direct-app
logs were clear. The phone-preview host retained two unattributed observer
errors during navigation; their source is not established or declared repaired.
Only changed web assets copied to both generated bundles, not a native build.

Chat artifacts: `book-showcase-comparison.png`, `book-showcase-dark-320.png`,
`book-showcase-tests-final.txt`. [Local fixture](../../qa/book-showcase.html).
Physical iPhone, VoiceOver and live visitor projection remain uncertified.
The local baseline appearance SQL whitelists the previous modes only. Live
definitions were not queried: review/extend that whitelist before shipping.
No SQL migration was changed/applied; the earlier Reader migration stays pending.

[[systems/Reading-Library]] | [[systems/Profiles-Lists]] | [[13-Project-Story]] | [[14-Feature-Coverage]]
