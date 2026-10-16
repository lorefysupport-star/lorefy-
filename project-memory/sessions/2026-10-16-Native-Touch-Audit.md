---
kind: session
status: partial-device-verification
date: 2026-10-16
---
# Native Touch and Follow-Up UI Audit

## Target and Boundaries

The owner requested working touch input on the local iPhone mirror and continued
inspection. This receipt concerns the existing installed Lorefy 1.0 Build 35 on
the same iOS 27.0.1 device, at 440x956 logical points. No new build, install,
submission, production deployment or deliberate account-data mutation occurred.
The installed app has not been proven byte-identical to current source.

## Control Verification

The previous accessibility activation path returned without a screen transition.
It is superseded here by the installed pymobiledevice3 CoreDevice HID touch
session, sharing the mirror's existing userspace connection. Actual pointer
input on the browser image opened the owner's profile, library, work details,
profile lists, a character list and the import screen. Vertical drags visibly
scrolled both the profile and the list. These are real installed-app transitions,
not simulated source fixtures or a claim that the Web Inspector page is available.

An early tap held contact while waiting for a USB foreground query, opening an
image context menu. The local helper now releases short taps without waiting for
that query. Swipe monitoring runs concurrently with touch samples and fails
closed if the guard loses its connection. A subsequent cover tap opened work
details normally. The app was brought forward without kill-existing to recover
from the initial context-menu test; no share/save/copy menu action was selected.

The local server remains loopback-only. Gesture requests require an ephemeral
bearer and an allowed Host/Origin; invalid coordinates, excessive durations,
stale frames and missing native sessions are rejected. Touch checks the exact
Lorefy PID before dispatch; swipes monitor foreground state and release contact
on interruption. Full-device input beyond Lorefy is not enabled by this helper.
The previous local no-mask choice remains; the preview hides stale images while
disconnected. Raw images, tokens and all helper source/tests stay outside Git and
this vault, under the conversation's artifacts directory.

Local helper verification: **13 tests passed**, covering coordinate validation,
tap release timing, foreground rejection/interruption, failed guard connection,
capture guards, unauthorized/cross-origin/rebound-host requests and unavailable
sessions. This is not a full application test-suite run.

## Current Audit Steps

| Step | Observed result | Health / limit |
| --- | --- | --- |
| 1. Home to owner profile | Profile opened by clicking the mirrored bottom dock | Navigation passed; Home friend labels remain tightly packed in this installed version. Compare [[bugs/LF-013-Friend-Rating-Rows]] before another source edit. |
| 2. Owner profile and scroll | Current page frame spans the visible page; vertical scroll exposes favorite characters and activity | Partial pass for the current selected frame only, not all collections, themes or visitor profiles. |
| 3. Library | Three-column library opened; covers and titles visible | Basic entry passed. No status, sorting preference or progress value was changed. |
| 4. Work details | Cover tap opened details after timing correction | Existing installed inconsistency reproduced: completed status with chapter progress 0/420. Reconcile with [[12-Device-Repairs#LF-002: الحالة ليست تقدمًا محفوظًا]]; do not rewrite live checkpoints or claim current-source regression. |
| 5. Folder/list detail | Character folder opened, ranked rows displayed | Read-only navigation passed. Reordering, editing, cancellation and visitor privacy were not tested. |
| 6. Last list row | Vertical swipe reached row 10, fully above the bottom dock | End-of-list reachability passed for this list; delete control was not activated. |
| 7. Import entry and return | Import screen opened with visible light-mode controls and returned | Entry/exit passed. No username submitted, file selected or import confirmed; dark-mode and LF-015 device certification remain open. |

Raw screenshots for these steps are local-only `touch-*.png` in
`artifacts/lorefy-ui-audit-20261016` outside the repository. Transient loading
placeholders were not classified as lost favorites.

## Next Acceptance Gates

- Check visitor geometry and every decoration collection without equating this
  one-frame result to [[bugs/LF-003-Frame-Device-QA]] closure.
- Compare the installed completed/progress discrepancy against the repaired
  source using isolated fixture data; do not repair a live account by guessing.
- Estimated-hour labeling, VoiceOver, large text, software keyboard, save-failure
  recovery and cross-account privacy remain separate unverified gates.
- No source repair is marked installed from these observations. Source-only work
  and per-repair GitHub pushes remain authorized; no new native build is allowed.

[[sessions/2026-10-16-Native-Connection-Recovery]] | [[12-Device-Repairs]] |
[[17-Extended-Review-Plan]] | [[05-Verification]]
