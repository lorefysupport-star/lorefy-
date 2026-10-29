---
kind: session
status: selected-picks-source-browser-verified-native-share-pending
date: 2026-10-28
---
# Editable Image Sharing

## Selected Personal Picks Implementation

Owner selected the quieter image by screenshot `Screenshot 2026-10-28 025646.png`.
The selected reference is the natural first-pick row plus nine equal portraits,
not either elaborate generation or a bare ordinal. Implemented as the existing
`spotlight` ID, now labelled Personal picks / اختياراتي. No new dependency.

- Applies to top/ranking/list exports only. The two unselected designs and
  single-work/review compositions remain unchanged pending specific selection.
- Compact heading, subtle leading row, plain ranks, equal grid, footer identity
  and count. Actual selected art remains authoritative, not generated portraits.
- Ten picks fit all formats including square; longer lists retain every item
  and original rank gap across pages. No invented fill for sparse lists.
- One-time local preference-version migration selects the approved design while
  preserving manual palette/format; subsequent template choices stay saved.
- `picksPlan`/`drawPicks` retain shared theme/manual/gradient/font controls and
  preview-to-file delivery. No source review/list content is rewritten.
- Two red-to-green layout tests, one migration test; full suite2657/2657 exit0.
  36 Pink/Dark AR/EN kind/format cases confirm app background reaches actual PNG;
  controls bounded at320/430/1280, paging2/3 for27 items, no pageerrors in this run.
- Selected PNG from actual Save equals preview SHA256:
  `21d4bac160483750870315109662a080a456410b7ab83c0dbcd5b326d9379fb6`.
  External paired reference/implementation capture found undersized thumbnails,
  corrected before the final comparison. Root `design-qa.md` records the scope,
  accepted artwork/font differences, post-fix evidence and passing result.
- Cachev610 / share-composer-v3; selective web mirrors only. No native build,
  Git push, real external send, service write or live-account mutation.

Native recipient behavior and owner acceptance of the applied image remain open.
The earlier pending-selection statement below is historical and now superseded
for this one selected design, not approval of all other export templates.

## Nested List Export Repair and Design Feedback

2026-10-28 follow-up: owner reported that the character-list export button did
not open. Reproduced through `LorefyLegacyLists.open` and a real button click,
not a direct composer call: export existed inside the inert `.lf-app` sibling,
behind the active `.lf-ml-page` (z9999 versus export4000). The previous96
direct-composer browser cases did not exercise this nested entry path.

- `exportMount` now mounts inside the opener's connected, non-inert dialog;
  ordinary sharing retains its existing app/screen/body fallback. Only the
  current dialog's children are isolated and restored on close.
- Export handles Tab/Escape inside its own dialog, stopping propagation to the
  parent list dialog. Closing restores the list button's focus/interactivity.
- Regression observed red in both the source test and actual browser flow,
  then green after the repair. Six actual nested cases (320/430/1280px, Close
  and Escape) and ordinary-share regression pass. Full suite2654/2654, exit0.
- Runtime/cache updated to share-composer-v2 / v609; selective web copies only.
  No native build, real external send, backend change, Git commit or push.
- Existing export designs were rejected. Three generated visual alternatives
  were then rejected as too exaggerated. A new three-image set uses a quieter,
  natural Apple-like approach. These are proposals only, outside the repository;
  no new visual design is implemented until the owner selects one. Source
  portraits in actual exports will remain authoritative, not AI-generated art.

UI/UX Pro Max Liquid Glass guidance, Apple-design, systematic debugging and TDD
were used. No new plugin/dependency installation was necessary or claimed.

Owner requested editable image outputs for work scores/reviews, character
rankings, top boards and lists, with three selectable designs for each and app
colors plus manual control. Local only: no service/schema writes, publication,
Git commit/push, native prepare/build or Apple upload. Old code remains a fallback
when the new composer module is absent, not the primary entry path.

## Design and Source

- `modules/lorefy-share-composer.js` normalizes selected content and renders
  three actual Canvas families: Spotlight's dominant first pick/podium,
  Gallery's even image exhibition, and Journal's numbered editorial rows.
  Work/review compositions adapt each family instead of using a ranking grid.
- Preview/thumbnails share the renderer. Save/Share reuse the exact PNG Blob
  shown in the preview, rather than rebuilding a differently styled default.
- Colors resolve the actual app semantic palette, including Pink/custom modes.
  Independent background, gradient endpoint, accent and text inputs; gradient
  toggle; app/editorial font; editable image title/review excerpt; identity,
  rating and text visibility. Draft edits never overwrite stored review/list.
- Story1080x1920,portrait1080x1350,square1080x1080. Long lists paginate without
  dropping items or inventing filler. Original rank gaps persist. Save/Share
  exports the selected page, not a batch. Long captions have visible ellipses.
- `styles/lorefy-share-composer.css`: scoped semantic glass sheet, thumbnail
  choices, real color controls, fixed footer, scrolling controls and44px commands.
  Existing vendored React/imperative modules inside Capacitor remain; no new
  framework, package install, external design service or illustration generation.
- Canonical `uploads/files/lorefy-app.js`: work share uses actual owned review
  score, not provider rating; preference boards use the same composer. Growth
  routes full work lists, character top lists, category rankings and review
  snapshots; community routes list/top attachments. Character art hydration and
  existing public media gateway remain authoritative.
- Share Studio exposes its existing `loadImage` helper and retains native file
  transports. Missing selected pictures block output with Retry. Data-image
  URIs are preserved up to16MiB after testing caught accidental URL truncation.
- Settings are local/owner scoped without source bodies/photos. Generation
  epochs reject obsolete jobs; close revokes output URLs/cache. Session changes
  close the editor. Focus is trapped/restored, Escape closes, and native delivery
  locks editing. Backend `onAuth` now returns cleanup without skipping other
  listeners during emission or leaking one callback per export opening.
- `tools/patch-share-composer.mjs` guards unique hooks, versions entries, sets
  cachev608 and selectively mirrors nine web files;18 byte comparisons match.

UI-design, Apple-design and plugin-management guidance were used. Existing
public book/character art provides the actual visuals; no plugin installation
or external design-provider account was required or claimed.

## Fresh Evidence

- Six groups in `tests/share-composer.test.js`, including180 model combinations
  (five types/three designs/three formats/four item counts), checking every page
  and image/caption bounds. Also order/zero/null, palettes,27-item list entry,
  picture failures, data-image preservation and auth listener cleanup.
  Regressions were observed failing before corresponding implementation/repair.
- Final `npm test`:2653 passed,0 failed,exit0;58.9 seconds. The initial run caught
  old expected cache versions, updated before the final run.
-96 isolated-browser cases: all five types/designs/formats;Pink/Dark,AR/EN,
  320/430/1280px. Footer/controls bounded, no page JavaScript errors. Three actual
  ranking PNG downloads matched the preview Blob SHA256 exactly. Custom #203040
  background pixel readback was32/48/64. Real public Berserk art was used in QA,
  not private account data. Failed picture blocked Save and offered Retry;
  account transition closed the composer; repeated close/open did not leak auth
  listeners. Focus containment and Escape were exercised.
- `git diff --check` exit0. Raw logs/images/browser scripts remain in external
  task artifacts, not Git/vault. User in-app-browser storage was not seeded.

## Limits

Actual iPhone share sheet, Files/Photos behavior, native keyboard/VoiceOver and
acceptance by Instagram/X/WhatsApp/other recipients require hardware testing.
Existing native transport saves to its configured Files location; no new Photos
integration or automatic external publication. Export uses selected visible
content, not hidden/private records. Media rights and provider uptime remain
separate gates; Canvas success does not certify rights or live services.

[[systems/Language-Media]] | [[systems/Profiles-Lists]] |
[[systems/Community-Notifications]] | [[13-Project-Story]] | [[14-Feature-Coverage]]
