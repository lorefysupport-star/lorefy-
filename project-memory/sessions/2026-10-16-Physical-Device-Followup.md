---
kind: session
status: verified-device-limited
date: 2026-10-16
---
# Physical Device Follow-up

User scope: continue the audit using the connected physical iPhone. No new
native build, installation, Apple upload or production change was authorized.

## Method

- USB-connected iPhone, iOS 27.0.1, inspectable `com.lorefy.app` WebView,
  428 x 926, Arabic/dark. Read title and visible document state directly.
- Reconnected the local loopback mirror. Its helper and all raw account
  snapshots/screenshots remain outside the repository and vault.
- Navigated existing controls and entered a catalog search. Did not save or
  remove favorites, change progress, follow state, lists or settings. Opening
  the inbox may invoke the installed app's normal read behavior.
- No replacement runtime/CSS injected. No native crash trace, frame-rate
  profile or complete console/network capture; do not infer those results.

## Version Boundary

Observed installed asset queries include runtime `20261001-build33`, growth
features/public profile `20261009-public-appearance-v4`, and reading metrics
`20261011-explore-v2`. These differ from the current source at `ae46c33`.
They are asset identities, not a verified installed native build number.
This run cannot certify recent source repairs on the device.

## Observations

| Path | Limited result |
| --- | --- |
| Home, owner profile, library, work detail | Navigation rendered without an observed visible crash. |
| Lists and first list detail | Existing images, ranking and cast rendered; no edit/save tested. |
| Reading diary | Existing history rendered; no session/note created. |
| Explore and work search | Query returned the intended work; no library mutation. |
| Following and public reader | Modal/profile rendered; returned to owner without follow changes. |
| Favorites editor | Saved slots/candidates rendered; closed without saving. |
| Reading totals | Unchanged in baseline, three revisits and final sample. No reproduction of chapter/hour drift in this navigation-only pass. |

Re-observed known installed-version symptoms, not newly introduced source bugs:

- LF-003: selected ornament visibly overlaps toolbar/content. One selected
  ornament is not an all-bundle geometry audit.
- LF-009: rated-character count grows as cast details load, while the saved
  activity count differs. Distinct from chapter/hour totals; source repair
  documented in [[2026-10-15-Gallery-Hydration-Repair]].
- LF-002: completed-work summary and chapter-progress section disagree.
- LF-001: notification inbox empty on initial and settled reads. No fresh
  backend row check was performed; do not infer a live server row count.
- LF-005: installed inbox back icon has no accessible name.

## Boundaries and Next Evidence

No new current-source defect was established. This audit does not close device
verification for source fixes. Relaunch/sync/offline drift, account switching,
write paths, media permissions, English, VoiceOver and all decorations remain
outside this pass. Existing push receipt/tap confirmation in
[[2026-10-16-Authorized-Push-Check]] remains separate; no new push was sent.

Existing source test receipts remain in [[2026-10-16-Character-Editor-Locale]];
the full application suite was not rerun merely for this read-only phone audit.
Restored the owner profile and closed the editor; kept the local mirror running.

[[12-Device-Repairs]] | [[05-Verification]] | [[00-Home]]
