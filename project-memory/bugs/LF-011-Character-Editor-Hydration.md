---
{
  "kind": "bug", "id": "LF-011", "status": "closed", "priority": "P2",
  "area": "characters", "date": "2026-10-15", "reviewed_on": "2026-10-15",
  "source_commit": "c2da5fd", "source_verified": true,
  "device_verified": false, "service_verified": false,
  "requires_device": false, "requires_service": false,
  "verified_on": "2026-10-15",
  "resolution_evidence": "[[sessions/2026-10-15-Character-Editor-Hydration]]",
  "next_action": "Source and isolated browser verified; native version unchanged"
}
---
# LF-011: Character editor hydration and retry

Cast hydration refreshed profile/gallery surfaces, but not the already open
favorites editor. Missing cast could stay invisible until another interaction.
Failure had no retry action and could be presented as no verified characters.

Hydration now refreshes an active owner-bound editor only when the request
settles, not on every maintenance tick. Search and active slot survive. Missing
cast has a loading state, network failure offers Retry, and an actual empty cast
settles without a retry storm. Work-search choices without a rating use the same
retry path. Reuses existing button styling and preserves saved ratings.

Six additional isolated regressions; three original cases failed before fixing.
Late owner responses and the eight LF-010 ownership cases remain green.
Details and browser evidence: [[sessions/2026-10-15-Character-Editor-Hydration]].

[Source](../../modules/lorefy-growth-features.js) |
[Tests](../../tests/character-editor-ownership.test.js) |
[[systems/Profiles-Lists]] | [[15-Work-Control]] |
[[12-Device-Repairs|Historical device queue, not installed-version certification]]
