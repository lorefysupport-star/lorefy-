---
kind: session
status: source-browser-verified-device-pending
date: 2026-10-28
---
# UI consistency plan: settings and personalization

Fourth local batch after [[sessions/2026-10-28-UI-Foundation-Phase-Three]].
No GitHub push, native build, production write, account-setting change or new
dependency/plugin. UI/UX Pro Max focus guidance, existing Apple/material rules,
test-first debugging and local Playwright were used.

## Reproduced issues

- Settings retained opaque surfaces and grouped cells unlike current shared
  glass. Customization had separate header, control and field presentation.
- The generic legacy sheet label selected the library-preview heading, naming
  customization "Your library" instead of its actual purpose.
- Customize tabs had no arrow/Home/End navigation, linked panels or active-only
  keyboard stop. The general enhancement scheduler left a brief stale stop
  after selection, so the click handler now updates it immediately.
- Color inputs lacked visible labels; a validation alert appeared below the
  entire form. A later browser Apply test reproduced focus dropping to Body
  when Apply became disabled/Applied, preventing Escape from reaching the sheet.

## Changes

- `styles/lorefy-settings-studio.css`: scope the existing material layer to
  Settings, Customize and the standalone Interface panel. Shared glass headers,
  readable hierarchy, unframed settings rows, semantic action pairs,16px text
  fields and44px controls. Existing destructive-action colors and switch
  geometry/semantics retained. Narrow layout controls use two columns; inner
  content stays bounded on large screens. Profile media geometry is untouched.
- `styles/lorefy-glass-materials.css`: initialize these three roots in existing
  material/font/fallback scopes, including reduced-transparency fallback.
- `modules/lorefy-growth-features.js`: semantic legacy sheet label helper;
  customize-only tab IDs/panel links, single active Tab stop and direction-aware
  arrow/Home/End behavior. Call existing React click handlers rather than owning
  selection/hidden state. Attribute updates and handler installation are guarded
  to avoid repeated mutations/listeners.
- `modules/lorefy-interface-settings.js`: visible wrapping Color/Hex labels,
  linked inline validation alert and explicit invalid border; focus the Hex
  field before Apply disables. Color/layout/motion persistence, defaults,
  native permissions and account save handlers remain unchanged.
- Cache `v614-settings-studio`; exact changed runtime assets have fresh keys.
  Six changed web files synchronized to both existing derived trees. No native
  preparation/regeneration and no changes to frozen artifacts.

## Verification

-12 new source regressions in `tests/settings-studio.test.js`, including failures
  before the tab-stop and Apply-focus repairs. Full suite:2717 passed,0 failed.
-12 Chromium cases: AR390px/EN320px ×six themes. Settings focus loop/inert,
  sheet names, readable Save contrast, correct panels/stops and keyboard tabs,
  inline invalid-color recovery, retained valid unapplied draft, and Escape
  without profile Save. All four library modes and three profile layouts exist.
- Six further local-demo checks: four preview layout changes, explicit custom
  color Apply plus reopen, and desktop bounds. Apply now leaves focus inside so
  Escape works. Temporary local view/theme preferences are restored by the test.
- Sampled library/progress/review/list/artwork/motion values are unchanged.
  Privacy/notification switches, sign-out/delete, header profile Save and Photos
  were never activated. No real user account content was changed.
- Screenshots inspected for ready/custom palettes and Color/Hex controls.
  Raw evidence lives outside the repo under task
  `artifacts/ui-execution-phase4-20261028/`. Derived hashes and cache keys verified.

## Remaining gates

Chromium is not iPhone/VoiceOver/Dynamic Type/native keyboard or Photos evidence.
Native notification/permissions and real-account/cloud save durability remain
unverified; no production health claim follows from this UI work. The prior
public AniList gateway CORS issue is untouched. Live language switching inside
every already-open legacy window and all privacy/data subpages remain separate
checks; do not infer them from first-render AR/EN cases.

Next planned component: Data/privacy UI, with export, visibility and destructive
actions kept read-only during browser QA. The rest of the27-unit plan remains
open. This batch does not certify all settings/service workflows.

[[systems/Appearance-Bundles]] | [[systems/Profiles-Lists]] |
[[systems/Language-Media]] | [[13-Project-Story]] | [[14-Feature-Coverage]]
