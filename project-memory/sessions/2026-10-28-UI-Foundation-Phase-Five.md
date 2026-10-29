---
kind: session
status: source-browser-verified-device-pending
date: 2026-10-28
---
# UI consistency: privacy and data

Fifth local batch after [[sessions/2026-10-28-UI-Foundation-Phase-Four]].
Scope: Data/list-privacy presentation and the existing Product Tools child
dialog lifecycle. No GitHub, native build, production writes or new plugin.
UI/UX Pro Max visible-label/feedback guidance and existing Apple/material rules
were applied to the actual React/DOM app, without changing frameworks.

## Reproduced and repaired

- Data center retained opaque legacy material,11px body text and36px close
  control. Its English entry opened Arabic title/body/actions. Direct AR/EN
  text and direction now cover the data dialog and list-visibility fields.
- Shared material variables explicitly include the standalone `.lf-data-studio`
  mount. Its own stylesheet uses semantic glass/ink,14px body,16px selects,
 44px actions, unframed sections, wrapping names and a centered720px desktop cap.
- Browser screenshots exposed unlayered legacy flex/grid rules overriding
  layered normal declarations. Owned row/stack/link layouts now explicitly
  override those rules;320px QA asserts computed stacking, not just no overflow.
- Existing copy incorrectly promised every new list was private. Profile-list
  creation actually uses `isPublic:true`; legacy visibility defaults to private.
  Copy now explains available visibility choices without changing either default
  or saved values. Profile lists retain2 choices; legacy lists retain3.
- A Product Tools child left the Settings parent focusable. Opening now isolates
  only siblings this layer changes. Close/Escape/backdrop restore that layer and
  its original opener. Replacement releases the prior sheet first; an observer
  cleans up when the child or its originating parent disappears.
- A pending export could disable the focused initiator and lose keyboard access.
  Source test uses a deferred fake preparation only: focus moves to the enabled
  close control before disabling the initiator. No browser/native data export ran.

## Verification

-13 added source regressions; **2730/2730** full tests,0 failures, exit0.
- **12/12** browser matrix:6 themes x AR/EN,390/320px, mixed profile/legacy
  visibility values, long names, visible native labels, real computed stacking,
  Tab/Shift+Tab, Escape, Settings return and preserved fixture/content values.
- **8/8** supplemental checks:2 empty states, desktop, close/backdrop, external
  child removal, replacement and parent React close. No uncaught page errors.
- Normal child closure restores its opener. Synthetic removal of the entire
  legacy Settings parent restores background usability but leaves focus on Body;
  this is recorded, not certified as root-trigger focus restoration.
- Five runtime files selectively synchronized to both native web-copy directories;
  no native preparation/build. Fresh cache: `lorefy-v615-data-studio`.
- Initial full run found unsynchronized derived assets; selective copy repaired
  that verification failure. Initial browser evidence is kept separately.

Evidence outside the repository:
`artifacts/ui-execution-phase5-20261028/{full-tests.log,browser-regression.json,lifecycle-browser.json,verification.json}`.
Screenshots `data-ar-pink.png`, `data-en-light.png`, `empty-ar.png` and
`desktop.png` were visually inspected. Browser fixture preferences/lists were
restored; sampled content/privacy/safety keys were unchanged.

## Boundaries and next

No privacy selector, notification toggle, unblock, Profile Save, sign-out,
deletion, Photos or actual data export was invoked in browser QA. Existing
visibility values, export formats and account/service guards remain authoritative.
Physical iPhone/VoiceOver/Dynamic Type/native export/cloud persistence and live
language changes in an already-open dialog are not certified.

Next UI unit: correction and safety centers, with their own localization,
empty/pending/error states and sensitive-action checks. Legal documents and the
remaining27-unit plan are not complete. See [[systems/Privacy-Data]],
[[systems/Profiles-Lists]], [[13-Project-Story]] and [[14-Feature-Coverage]].
