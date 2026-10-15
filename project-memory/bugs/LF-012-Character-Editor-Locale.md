---
{
  "kind": "bug", "id": "LF-012", "status": "closed", "priority": "P2",
  "area": "characters", "date": "2026-10-16", "reviewed_on": "2026-10-16",
  "source_commit": "ac2285f", "source_verified": true,
  "device_verified": false, "service_verified": false,
  "requires_device": false, "requires_service": false,
  "verified_on": "2026-10-16",
  "resolution_evidence": "[[sessions/2026-10-16-Character-Editor-Locale]]",
  "next_action": "Source and isolated browser verified; installed app unchanged"
}
---
# LF-012: Favorites editor language and action fit

English mode still displayed Arabic editor title, slot actions, empty states,
save confirmation and accessibility labels. These now use the existing uiText
helper. Character names, work titles and saved refs remain original content;
there is no DOM translation or change to persisted keys. Shared overlay Back
labels use the same language helper.

Browser inspection also found a 48px candidate action in a 34px grid track,
clipping its label at the edge. The track now reserves 48px in all states and
copy alignment is logical (start) for both directions. No global layout rewrite.

Five regressions cover initial English controls, filled controls with Arabic
user content, retained Arabic, shared Back and track/action fit. Four cases
failed before their corresponding repair. Full suite: 1,236 passing tests.

[[sessions/2026-10-16-Character-Editor-Locale]] |
[Tests](../../tests/character-editor-ownership.test.js) |
[[systems/Profiles-Lists]] | [[15-Work-Control]] |
[[12-Device-Repairs|Historical device evidence, not a new native installation]]
