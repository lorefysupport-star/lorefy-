---
{
  "kind": "bug", "id": "LF-010", "status": "closed", "priority": "P1",
  "area": "characters", "date": "2026-10-15", "reviewed_on": "2026-10-15",
  "source_commit": "fee2dc6", "source_verified": true,
  "device_verified": false, "service_verified": false,
  "requires_device": false, "requires_service": false,
  "verified_on": "2026-10-15",
  "resolution_evidence": "[[sessions/2026-10-15-Character-Editor-Owner]]",
  "next_action": "Source repair only; installed iPhone version is unchanged"
}
---
# LF-010: Character editor account ownership

The favorites editor captured a four-slot draft but did not capture its account.
Candidate, remove and save handlers wrote through the current storage namespace.
An editor left open during an account change could therefore write the previous
draft into the next account. Search activity checked DOM attachment only.

The editor now invalidates permanently on owner change or close, clears pending
timers, rejects stale write handlers and guards async search/cast callbacks.
Storage events and existing maintenance check ownership without a new timer.
Returning to the first account does not reactivate the old draft.

Eight isolated regression tests cover the stale writes, sign-out/re-entry,
debounce cancellation, late success/failure and normal owner editing. Five
original scenarios failed before the repair; the valid-owner path already passed.
No real account was modified. This is not a new native installation or a claim
about the previously installed build.

[Source](../../modules/lorefy-growth-features.js) |
[Tests](../../tests/character-editor-ownership.test.js) |
[[systems/Profiles-Lists]] | [[15-Work-Control]] |
[[12-Device-Repairs|Earlier device queue, not evidence for this source-only issue]]
