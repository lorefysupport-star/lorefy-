---
kind: plan
status: maintained
date: 2026-10-16
reviewed_on: 2026-10-16
---
# Extended Review: Evidence to Development

Owner request: fetch the latest GitHub source, develop from the supplied review,
and use the physical iPhone. No new native build or release is authorized.
Fast-forwarded `main` from `590bf33` to `80ba6b5`. Unrelated local native/build
configuration remains untouched; generated memory was preserved in a named stash.

## Reference and Limits

The local reference is `Lorefy-Lootd-Extended-Review-20261016.html`, SHA-256
`472175330ab3d3ee5cce85e46bc36628b37c5e903efede753886f5a05361a7fe`.
The HTML, its embedded personal screenshots and account details are NOT copied
into the vault or repository. This note retains development conclusions only.

Its Lorefy observations used `64e4e63` and a 390px isolated browser demo, not the
currently installed iPhone app. Its competitor findings are comparison evidence,
not Lorefy bugs or permission to modify another account. Reproduce every relevant
finding against current source before treating it as unresolved. Do not implement
new databases, duplicate existing reading systems or perform production writes
merely because they appear in this reference.

## Workstreams

| Priority | Outcome and existing owner | Current evidence / next acceptance gate |
| --- | --- | --- |
| P0 | Friend rating rows: `styles/lorefy-explore-studio.css`, `modules/lorefy-friend-activity.js` | Incoming [[bugs/LF-013-Friend-Rating-Rows]] already addresses layout. Recheck real device later; do not round 2.75 or replace scores. |
| P0 | Independent reading status, checkpoint and review: [[systems/Reading-Library]] | Existing stability/ownership repairs are relevant, not full acceptance. Verify wishlist without review, removing only a rating, explicit zero, reload and account switch in isolated data. |
| P0 | Book/novel/comics metadata: [[systems/Catalog-Search]] | Needs a reproducible per-shelf sample and source provenance. Missing description, fallback cover and edition identity are separate facts; do not fabricate descriptions or merge by title alone. |
| P0 | Durable saving and visibility: [[09-Data-Contracts]] | Keep drafts on recoverable failure, show failure, read back state, reject stale-account responses. Private-list visitor checks require a controlled second-account fixture, not owner UI alone. |
| P1 | Arabic aliases, typo search and editions: [[systems/Catalog-Search]] | Build a fixed AR/EN query set with correct names, typos, absent matches and provider failure. Keep edition selection explicit. |
| P1 | Continue reading and correct units: [[systems/Reading-Library]] | [[bugs/LF-014-Diary-Position-Defaults]] covers diary defaults. [[bugs/LF-023-Home-Continuation]] reconnects the compact section to current social Home, uses saved units and excludes non-reading/zero checkpoints. Source/browser evidence is not installed-device certification. |
| P1 | Explain reading metrics: [[decisions/Saved-Reading-Metrics]] | [[bugs/LF-018-Reading-Estimate-Labels]] identifies estimates; [[bugs/LF-019-Statistics-Locale]] completes statistics language; [[bugs/LF-020-Statistics-Activity-Dates]] aligns dates and distinguishes missing history from zero. Live-account/device evidence and broader recap-period checks remain separate gates. |
| P1 | Accessible lists: [[systems/Profiles-Lists]] | [[bugs/LF-021-List-Keyboard-Focus]] verifies focus continuity, named actions and draft failure/cancel; [[bugs/LF-022-List-Tool-Clipping]] fixes full-size tool containment in AR/EN 320/440. VoiceOver, large text and controlled live visitor privacy remain separate gates. |
| P1 | Device UI / accessibility / performance: [[bugs/LF-003-Frame-Device-QA]] | Prior device audit plus owner confirmation show an installed-frame geometry defect. Compare source separately. VoiceOver, large text, safe area and cold/warm timing remain explicit gates. |
| P2 | Taste narratives and sharing: [[14-Feature-Coverage]] | Defer until the data and saving gates are reliable. Preserve usefulness for new readers and private reading data. |

## First New Repair

[[bugs/LF-015-Import-UI]] addresses a current-source defect reproduced during the
UI audit: import action text was white on a pale dark-theme action background.
This implements the review's contrast/accessibility requirement in an existing
workflow; it does not claim a completed import or cloud synchronization test.

[[bugs/LF-016-Review-Reply-Direction]] then corrected the English review input's
forced RTL direction while retaining Arabic RTL. [[bugs/LF-017-Review-Timestamp]]
subsequently localized review date/time from the raw timestamp without translating
user-authored prose. Native verification remains separate for both changes.

## Evidence Rules

- Develop canonical source, synchronize only affected existing web assets, then
  verify before committing and pushing each independent repair.
- Historical Build 34, the installed build and current source are separate test targets. Do not inject
  source repairs into the live app or mark hardware checks passed from Chromium.
- Current device metadata later identified Build 35, with native streaming and
  element reading restored: [[sessions/2026-10-16-Native-Connection-Recovery]].
  Keep the report's older version boundary historical. The subsequent
  [[sessions/2026-10-16-Native-Touch-Audit]] verifies actual HID tapping and
  swiping on the local unmasked mirror, not installation of current repairs.
- The mirror is loopback-only. Device images and raw account data remain outside
  the repository. Connection failure is not an application failure.
- Keep unresolved work visible. This is a development backlog, not a certificate
  that the full app, competitor comparison or all device paths passed.

[[15-Work-Control]] | [[13-Project-Story]] | [[14-Feature-Coverage]] | [[05-Verification]]
