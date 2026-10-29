---
kind: session
status: source-browser-verified-device-pending
date: 2026-10-29
---
# Top-ten character list portrait and action ownership

Continuation of [[sessions/2026-10-29-UI-Foundation-Phase-Eighteen]]. Existing
Plugin Management, Apple, UI/UX Pro Max accessible action guidance, test-first
debugging and Playwright used. No installation or new runtime dependency.
Local source only; no GitHub, native build, account/service mutation or publish.

## Reproduced and repaired

- Legacy top-ten podium slot was a button containing another Edit button.
  Actual before fixtures show3 nested button pairs in every AR/EN x320/390/768
  configuration. Failed clFace images were removed without explicit recovery.
- clFace adopts the shared DOM portrait owner, preserving original/custom source,
  circle dimensions, existing gradients, names, rank and storage precedence.
  Editor Retry is mounted outside clipped art. Tiny list-hub previews have no
  Retry button inside the existing Open list button; opening the editor exposes
  recovery. They still have bounded/missing/error states, not substitute images.
- Each podium slot is now a noninteractive wrapper with separate named native
  Remove and Edit actions. Retry is a sibling above the face, not inside Remove.
  Edit uses the existing picker and save callback.44px Edit gets a52px reserved
  strip below the name, intentionally increasing filled-slot height; circles
  retain86/64/54px. Cast52px faces keep their dimensions and independent native
  pressed-state selection, without a nested Retry. Outer focus rings are visible.
- Retry only retries an image. Selection/removal keep existing persistence and
  update cast badges without rebuilding unchanged cast/other podium portraits.
  Removing a fixture item returns focus to a remaining slot or search.
- Shared DOM owner now accepts an external retryHost, retry=false preview mode
  and a recovery focus target. Browser inspection found that hiding Retry blurs
  it before the previous focus check; capture focus before paint, then restore.
  A failing regression models this synchronous blur before the fix.
- Lists release media on view navigation, cast filtering, changed podium slots
  and overlay close. A late cast result checks connected/inert page plus chosen
  view identity; it cannot mount media into a closed/replaced editor. This is
  request-result invalidation, not native image/provider transport cancellation.

## Verification

-10 new regressions:7 list adoption/action/lifecycle/geometry tests,2 shared DOM
  preview/external-control tests,1 synchronous-focus test. Existing stable-picker
  tests now press the separate selector and retain image/node identity assertions.
  Focused suite23/23; complete source suite2925/2925,0 failures.
-66 actual UI cases: AR/EN x320/390/768, pink/dark. Separate44px Edit/Retry,
  podium recovery without ranking mutation, keyboard focus return, Edit without
  removal, candidate recovery without addition, native fixture addition/removal,
  untouched portrait identity, filter cleanup, button-free hub previews, editor
  re-entry and close. Local fixture list is restored to its original content;
  sampled custom image/score/library keys unchanged. No actual image saved.
- Three late-result boundaries: after close, after return to hub and after a
  different list opens. Obsolete cast cannot create new media or visible rows.
-48 fresh rating-page/current-preview regressions still pass. Total117 browser
  cases,0 uncaught errors. All isolated contexts closed. Source images use
  controlled provider-shaped fixture URLs and an existing local bitmap; no new
  artwork, provider certification or physical-device evidence is claimed.
- Six before/after configurations compare30 podium/candidate circle dimensions
  within1px. Nested native buttons change3 to0 per fixture. Filled slot controls
  intentionally reserve more height; overall card height is not claimed equal.
  Representative narrow AR ranking and prior portrait/picker screenshots reviewed.
- The first fixture snapshot was taken before demo-library initialization had
  settled. Waiting for the actual work UI before sampling removes that test race;
  this is fixture synchronization, not a change to application library storage.
- Five web/entry assets have matching hashes in root and both runtime copies,
  JS syntax checked. Cache lorefy-v630-list-portrait, changed asset key
  20261029-list-portrait-v1. Selective copies only; no Capacitor prepare/sync/build.
- Evidence: `artifacts/ui-execution-phase19-20261029/` has unit/full logs, browser
  JSON/scripts, before/after snapshots, screenshots and verification. Initial list
  failing tests are `artifacts/list-portrait-red.log`; owner/focus red logs inside
  the phase directory. No real list, score, photo, account or post was modified.

## Remaining

This adopts legacy per-work top-ten list/podium and selector faces, not every
character image. Category preference boards, profile/public/rated character tiles,
modern profile-list image renderers, picker candidate images, character work hero,
profile banners/avatars and published review/quote media remain separate owners.
F07 remains partial; F08 edition grouping, real-service/two-account acceptance and
iPhone accessibility/performance remain independent gates. Nothing was pushed.

[[13-Project-Story]] | [[14-Feature-Coverage]] | [[systems/Language-Media]] |
[[systems/Profiles-Lists]] | [[systems/Explore-Works]]
