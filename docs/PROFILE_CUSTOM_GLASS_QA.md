# Original Profiles and Custom Glass

Latest material/text revision: [Glass Depth and Typography](../project-memory/sessions/2026-10-27-Glass-Depth-Typography.md)
supersedes the flat control material while retaining ready-theme and hero-bound
repairs. Earlier v1/v2 counts below are historical, not current visual approval.

Follow-up: the owner screenshots exposed ready-made Pink/Light gaps in this
initial custom-only matrix. See [Ready Themes and Hero Bounds](../project-memory/sessions/2026-10-27-Ready-Themes-Hero-Bounds.md)
for the superseding ready-theme scopes, new cache and direct title/poster checks.
The counts and default-scope statements below describe the initial v1 pass.

Date: 2026-10-27. Local only: no commit, push, native build, Apple upload or
production account/backend change. Supersedes the Normal-only scope in
`NORMAL_PROFILE_APPLE_QA.md`, not its historical evidence.

## Implementation

- `styles/lorefy-profile-apple.css`: shared Normal/Panoramic/Reader system type,
  icon strokes, tabular reading values, segmented controls and glass navigation.
  Reader toolbar controls join the same material. Original artwork, frame
  anchors, saved focal positions, section order and shelf modes are preserved.
- `modules/lorefy-design-system.js`: literal custom palette aliases avoid cycles
  through the cinematic screens' locally overridden semantic tokens.
- `styles/lorefy-custom-glass.css`: earliest named important layer connects the
  chosen palette to Home, Library, Explore, Work, review/status/cover sheets,
  character ratings, composer/pickers and navigation. Noncustom cinema defaults
  stay unchanged. Media is not recolored/blurred; hero fades blend into the page.
  The on-art Explore heading retains white text and a dark shadow for contrast.
- Existing arbitrary hex/native-color picker and separate light/dark base remain
  authoritative. No new storage keys, data migration or frame-animation changes.
  Settings -> Appearance & personalization -> Custom color -> Apply color.
- Glass is for chrome/sheets, not content-card decoration. Opaque fallback and
  reduced-transparency material/blur behavior are included.
- Cachev601/profile-colors; changed assets version20261027-profile-colors-v1.
  Five runtime files match both existing web mirrors (10 SHA256 comparisons).

## Fresh Verification

- New requirements observed red before implementation, including sheet-local
  semantic palette overrides. Full `npm test`:2587 passed,0 failed,exit0,65.7s.
- Actual demo app:54 profile cases, AR/EN x three original layouts x320/390/430px
  x default dark/custom green dark/custom pink light. Shared type/glass applied;
  navigation stayed inside viewport and no horizontal page overflow appeared.
-16 main-route cases: four screens x320/430px x two custom palettes. Computed
  backgrounds matched palette; glass nav and bounded widths passed.1280px
  Explore also had no horizontal document overflow.
- Actual picker: invalid hex disables Apply; valid color/base survive reload;
  saved identity/layout unchanged. Existing tests cover extreme-color contrast
  and preserving the hue through base toggles.
- Review/status/cover/character windows and composer opened without submitting
  changes. Light custom text/backgrounds were inspected. Review rating/surface
  tokens now match custom values instead of the fixed cyan/dark local palette.
- CDP reduced-transparency emulation matched: opaque review surface, blur none.

Raw screenshots/logs and executable QA snippets stay in the parent task's
artifacts directory, outside Git/vault. Image/provider failures and blocked
production calls are not service verification. The matrix is local demo data,
not certification of every historical dialog or image/color combination.
Owner visual acceptance, physical-iPhone/VoiceOver/performance and live account
cross-device synchronization remain separate gates.
