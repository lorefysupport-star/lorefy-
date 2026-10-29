---
kind: session
status: local-verified-device-service-pending
date: 2026-10-24
---
# Banner audit follow-up repairs

Owner authorized fixing the four findings from the local banner audit, then
preparing for new work. Local source only; no push, native build or service change.
This supersedes the banner-specific open findings in that audit, within the
source/browser scope below. It does not certify every device or decoration asset.

## Repairs

- Reader uses the existing measured decoration inset rather than a fixed20px.
  Header measurement reserves the complete ring width for identity text. Names
  and LTR handles share a grid column. At350px and below, decorated Reader places
  identity below the complete frame instead of squeezing long names beside it.
- Removed Share Studio's unconditional important38% image position. Owner uses
  the saved inline position; public rendering retains its normalized owner value.
  Existing avatar/banner URLs and persisted artwork remain unchanged.
- Editor banner aspect ratio and fade stops derive from the live header geometry.
  The background profile previews draft layout/name/handle/crop without saving.
  Cancel restores the saved values. Preview content-box sizing excludes borders
  from the image ratio, and drag distance uses the actual preview height.
- New banner uploads pass the selected header ratio to Photo Framer. Crop outline
  and JPEG output use that ratio with a1200px longest-side bound. Avatar output
  remains512px square; unspecified banner ratio retains1200x450 compatibility.
- Small-phone original crests have their own row below44px controls, rather than
  shrinking into width-minus252px. Artwork is uniformly scaled; ribbon and banner
  stay joined. Wide headers retain64px joins. Reader toolbar respects frame backing
  height and keeps controls aligned at the top of their available area.

## Source

Runtime: `modules/lorefy-profile-header.js`, `modules/lorefy-photo-framer.js`,
`modules/lorefy-frame-motion.js`, `styles/lorefy-reader-layout.css`,
`styles/lorefy-profile-header.css`, `styles/lorefy-share-studio.css`,
`uploads/files/lorefy-app.js`. Mechanical patch: `tools/patch-banner-preview.mjs`.
Entry/cache changes: `index.html`, `sw.js`, cache `lorefy-v575-banner-repairs`.
Changed web assets selectively mirrored into both generated native web trees.
No native compilation was run. Other pre-existing dirty changes were preserved.

## Evidence

Six new tests: five banner repair cases and one Photo Framer ratio case. They
failed before their implementations. Updated old frame tests to distinguish
separate small-screen crest rows from unchanged wide-header collision rules.
Updated the main-app cache-key expectation. Final full suite:2449 pass,0 fail,
skip or cancellation, exit0,57648ms. Includes source/native-web asset parity.
Log outside repository: chat `artifacts/banner-repairs-tests-final.txt`.

Owner:9 final cases,320px Light/Dark and440px Light for all three layouts.
Actual width and scroll width match; decorated frames fully contained; image
position50% matches saved50%. Browser resize was allowed to paint before measuring;
earlier transient old-width readings were rejected. Saved to chat artifacts:
`banner-repairs-browser-results.json`, `banner-repairs-layouts.png`, and individual
`banner-fixed-<layout>-<theme>-<width>.jpg` screenshots without save toasts.

Public renderer:10 final cases at320px with long fictional names. Three renderer
families (ribbon-bunny/original, night-gaze/illustrated, maple-scout/autumn) in all
layouts, plus English Reader. Frames contained and no horizontal overflow.
`qa/profile-header.html` now loads real shop/frame dependencies, root base URL and
beta catalog flag, then rerenders after catalog readiness. Initial fixture runs
without this catalog initialization had null decorations and were rejected.
Evidence: `banner-repairs-public.png` and individual public screenshots.

Editor: final440px long-name Reader ratio440/264 and320px ratio320/341 exactly
match preview image ratios and50% positions. Cancel restored Panoramic and the
original name. Screenshot: `banner-fixed-editor-preview.jpg`.

## Remaining Limits

No physical iPhone, Safari, VoiceOver or deployed cross-account certification.
Ten public cases use fictional local profiles, not real service accounts. Not
every pack, custom image or safe-area combination was visually certified.
Very long Panoramic names still wrap in their narrow side column by design;
Reader's smallest decorated view is stacked. The audit's pointer-click versus
Enter indicator was not diagnosed as a device defect and is not claimed fixed.
No stored image replacement, GitHub push, database migration or Apple upload.

[[systems/Profiles-Lists]] | [[13-Project-Story]] | [[14-Feature-Coverage]] |
[[sessions/2026-10-24-Profile-Header-Extent]]
