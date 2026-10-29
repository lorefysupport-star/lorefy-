---
kind: session
status: source-browser-verified-device-pending
date: 2026-10-28
---
# UI consistency plan: import presentation and recovery

Third local batch, after [[sessions/2026-10-28-UI-Foundation-Phase-Two]]. The
owner requested continuation of the consistency plan. No GitHub push, new native
build, production writes or actual account import. Existing Apple design,
UI/UX Pro Max form-label/error-recovery guidance and test-first debugging used;
no plugin/dependency installation was necessary.

## Reproduced causes

The import overlay mounts beside `.lf-app`; its six source sections still used
legacy purple surfaces,18px card radii and10.5px subtitles. Fields relied on
placeholders despite accessible names. Several first-render labels, provider
and file errors remained Arabic in English mode. Loading had no result status;
errors/preview were appended below all sources. Reading-state selection exposed
only a CSS class. Native select labels wrapped into their fixed height.

## Implementation

- `styles/lorefy-import-studio.css` owns only `.lf-im-page` layout in the existing
  material layer. Semantic background gradient, glass header/secondary actions,
  unframed source bands,16px fields,14px actions,44px targets and8px controls.
  Form measure is capped at760px; narrow input/action rows stack. Long selected
  edition text remains a single native select line with ellipsis, not clipped.
- `styles/lorefy-glass-materials.css` includes the standalone import root in its
  font, supported-glass and reduced-transparency fallback scopes. Other pages
  and the prior image-picker rules remain unchanged.
- `modules/lorefy-growth-features.js`: visible wrapping labels, local field
  validation, announced errors and loading, and a result region preceding the
  source forms. Focus follows loading, review, failure and completion, while the
  existing modal helper owns Escape/Tab/return and background isolation.
- Direct AR/EN UI labels and an explicit translation boundary for known legacy
  provider/file errors. Unknown errors stay literal text, including object-key
  names. User titles and source names are not translated.
- Reading-state buttons expose one `aria-pressed` selection. Draft inputs survive
  failure and preview. A failed save retains the preview and focuses its alert.
- No changes to import parsers, status values, provider requests, matching logic,
  `imApply`, rollback or account/session guards. Actual import still requires
  confirmation. Existing ownership/stale-result/save-failure tests remain green.
- Cache `v613-import-studio`. New stylesheet and changed material/growth assets
  are versioned in index/SW. Exactly those assets plus index/SW are copied into
  both existing derived web trees; no native prepare/build operation.

## Evidence

-21 new source regressions, with failures observed before repairs;2705 full
  source tests pass. Existing import harness adapted to labels without weakening
  its request-session and save/rollback assertions.
-16 Chromium cases cover six themes ×AR390/EN320, visual tokens/contrast,
  first-render labels, field validation, actual Tab/Shift+Tab/Escape/return,
  failed AniList response then loading/retry/empty, invalid XML, and pasted
  unmatched titles. Provider responses are intercepted fixtures, not a live
  service availability claim.
- Four additional cases cover1280px form measure,160px reflow stress, matched
  AR/EN long-title edition preview using a temporary in-memory catalog, and a
  prior character image-picker keyboard regression. No browser confirmation
  button was pressed. Sampled content storage keys stayed byte-identical.
- Screenshots inspected at top/bottom of the form and matched preview.
  Evidence is outside the repository under task
  `artifacts/ui-execution-phase3-20261028/`.

## Limits and next

Follow-up: [[sessions/2026-10-28-UI-Foundation-Phase-Four]] now adds the scoped
Settings/Customize batch. The next-component statement below is historical;
device/service gates remain open.

Synthetic `documentElement.style.zoom=2` enlarged the legacy fixed100vw shell;
that initial failed probe is retained separately, not counted as successful
browser/native zoom validation. Explicit160px viewport reflow passes. Actual
browser zoom, native Dynamic Type, VoiceOver/Photos, live import/save durability
and physical keyboard/device behavior still need separate evidence.

The prior public AniList gateway CORS failure is not changed by this UI batch;
do not infer production fetch health from intercepted responses. Other legacy
windows and the rest of the27-unit plan remain open. Next UI component is
Settings/customization, without changing service/account settings during QA.

[[systems/Reading-Library]] | [[systems/Language-Media]] |
[[bugs/LF-015-Import-UI]] | [[13-Project-Story]] | [[14-Feature-Coverage]]
