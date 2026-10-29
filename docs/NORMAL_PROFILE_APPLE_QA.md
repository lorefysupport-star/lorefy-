# Original Normal Profile: Apple Detail Pass

Historical v1 scope. See [all-layout/custom-color follow-up](PROFILE_CUSTOM_GLASS_QA.md)
dated2026-10-27 for the superseding scope and fresh verification.

Date: 2026-10-26. Local only. No commit, GitHub push, native build, Apple upload,
production account write or service change.

## Owner Decision

The owner rejected the generated profile alternatives and asked to retain the
original layouts, applying Apple-style details instead. Start with Normal only.
No generated image is implemented, and no new profile layout is introduced.
Panoramic and Reader retain their original presentation for their later passes.

## Scope

- `styles/lorefy-profile-apple.css` is a named layer scoped to exact Normal
  profile roots. It uses the existing React markup, Lucide symbols, callbacks,
  owner theme variables, account data and original media.
- System typography, zero tracking, lighter semantic weights, tabular reading
  values, readable captions, consistent icon strokes and glass controls replace
  mismatched detail styling. Original tabs keep their roles and keyboard model.
- Glass is restricted to controls/navigation, not artwork or content panels.
  Press/focus/hover/disabled states, opaque material fallback, reduced transparency
  and brief reduced-motion-safe control feedback are included. Frame animations
  are not disabled or changed by this pass.
- Banner/avatar geometry, frame anchors, saved image focal positions, section
  order, favorites display modes, reading metrics and list designs stay owned by
  their original components. No application JavaScript or native shell changed.
- The Normal visitor's four-book library preview inherited the seven-column
  wooden board calculation: at320px its372px board caused402px scroll width.
  This was reproduced with the new stylesheet disabled too. The board now uses
  its preview container:260px, with320px scroll width. Covers/columns are unchanged.
  An older-browser bounded four-column fallback is provided.
- `index.html` and `sw.js` load/cache the new asset before cinema named layers.
  Cache: `lorefy-v599-normal-apple`; asset version `20261026-normal-apple-v1`.

## Evidence

- Seven new source tests were observed red before corresponding implementation.
- Final complete suite: **2580 passed, 0 failed**, exit0,69.8 seconds. An earlier
  full run passed2579 before the final compatibility-fallback regression was
  added; the whole suite was rerun after that change.
- Owner Normal: AR/EN x light/dark x320/390/430px (12 cases). System font applied,
  banner/avatar anchor rectangles and source URLs matched the disabled-sheet
  baseline, and no horizontal overflow appeared.
- Panoramic and Reader: same bilingual/theme/width matrix (24 cases). Sampled
  geometry, media and computed typography/tab styles remained unchanged.
- Actual local fictional visitor route through Following to Noura: AR/EN x
  320/390/430px (6 cases). Its custom green owner colors, banner/avatar sources,
  anchor geometry and original bunny decoration persisted. No horizontal overflow
  after the board fix. This is local fixture evidence, not production projection.
- Owner and visitor section tabs opened; owner Home/End switched their selected
  tabs correctly. Library, favorites, identity and saved layout values remained
  identical across the owner tab workflow. No follow, review, upload or save was
  performed on a production account. No pageerror in these tested flows.
- Native phone-preview iframe loaded the real new stylesheet and Normal root.
  In-app browser capture confirms existing local owner artwork/content remain.
- Three web runtime files selectively match both existing mirrors (six hashes).
  No native preparation, Capacitor sync or build was run.

Browser comparison waits for the stylesheet to apply and enhancement nodes to
settle; early immediate snapshots can capture intermediate fonts or added nodes.
Raw screenshots/logs stay in the parent task's artifacts folder, outside Git and
the vault. External provider/image failures are not service validation.

## Remaining Gates

Visual acceptance remains with the owner. Panoramic/Reader Apple detail passes,
installed-iPhone typography/keyboard/VoiceOver/performance and actual upload/save
remain separate work. Automated avatar-center activation was intercepted by the
banner in the empty synthetic owner demo, including before polish; the edit
handler is unchanged and this pass does not claim to repair/certify that input
path. The section/tab and visual checks above do not imply every control passed.
