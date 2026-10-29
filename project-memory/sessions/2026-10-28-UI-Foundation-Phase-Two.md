---
kind: session
status: source-browser-verified-device-pending
date: 2026-10-28
---
# UI consistency plan: character image-picker behavior

Second local execution batch after [[sessions/2026-10-28-UI-Foundation-Phase-One]].
No GitHub operations, native build, production writes or new plugins. Existing
Apple/UIUX, accessibility, debugging and test-first guidance was used. Layouts,
palettes, character identity and saved artwork contracts are retained.

## Reproduced causes and repairs

- The picker left focus on its background edit control, did not isolate the
  parent and ignored Escape. Reuse `bindDialogKeys` for entry focus, both Tab
  directions, Escape, exact inert restoration and return to the invoker.
- Late provider/file-read/save completions could modify detached UI, save for
  another owner or close a replacement picker. Capture owner/lifetime, subscribe
  to storage/auth changes and release on close. Close the nested picker before
  the parent character page leaves. Serialize save/reset/upload actions.
- Browser testing exposed focus falling to Body when a focused save button was
  disabled. Move focus to the still-enabled Close before disabling that action.
- Provider failures masqueraded as empty/seed success. Add opt-in
  `{reportErrors:true}` to `loadImageOptions` and Fandom gallery/image-info;
  automatic callers keep verified seed fallback and identity-scoped lookup.
- Explicit Retry, polite loading/error/empty announcements, deduplicated choices
  and20-second UI deadline. Ignore old results after timeout/retry/close. The
  transport may still finish; an already-started valid save is not rolled back.
- Retry uses existing secondary glass tokens,44px target,14px text,8px corners.

Source: `modules/lorefy-growth-features.js`, `modules/lorefy-character-system.js`
and `styles/lorefy-glass-materials.css`. Cache `v612-image-picker-lifecycle`;
fresh module/material keys in index/SW. Only these five web assets synchronized
to the two existing derived trees, without native preparation or building.

## Evidence

-18 new regressions; failures observed before their repairs. First-render
  AR/EN tests retained through the executable modal harness.
- Full suite after final implementation:2684 passed,0 failed.
-15 Chromium cases: AR390px / EN320px across six palettes, real keyboard and
  focus return, failed-then-successful provider Retry, deduplication, late
  provider after reopen, real20-second deadline and pending-save close/reopen
  with persistence stubbed. Sampled saved content keys are unchanged. No
  uncaught page errors. Three screenshots inspected for wrapping and material.
- Two additional served-provider checks use intercepted local Fandom fixtures:
  strict gallery failure rejects; automatic caller retains verified seed.
- Evidence stays outside the repo: task `artifacts/ui-execution-phase2-20261028/`.

## Open gates

The unrelated public AniList catalog gateway emits a CORS preflight failure
from localhost, also seen before the repair. It is recorded, not fixed here.
Mocked recovery proves UI behavior, not current production-provider availability.

Native Photos permissions/upload, real account persistence and iPhone/VoiceOver
remain unverified. Other legacy windows and the rest of the27-unit UI plan stay
open. Continue one component at a time using external EXECUTION.md; do not close
device/service gates from source/browser tests.

[[systems/Language-Media]] | [[systems/Profiles-Lists]] |
[[13-Project-Story]] | [[14-Feature-Coverage]]
