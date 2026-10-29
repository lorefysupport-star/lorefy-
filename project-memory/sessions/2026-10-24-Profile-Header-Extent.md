---
kind: session
status: local-verified-device-service-pending
date: 2026-10-24
---
# Profile artwork through the identity

The owner's three annotated screenshots (042456, 042507, 042518) request a larger
banner through the avatar, display name and handle in Reader, Panoramic and Normal.
This is a local-only change, not permission for a build, push or service migration.

## Implementation

`modules/lorefy-profile-header.js` measures the original image top, banner bounds,
name top, handle bottom and decorated avatar bottom. Artwork reaches the greater
of the existing banner bottom or identity bottom plus 20px. It updates CSS variables
without moving identity, controls or frame nodes, changing image URLs or storage.
Resize/mutation observers batch measurements; writes are idempotent and disconnected
pages release observers. No scroll animation loop or new runtime dependency.

`styles/lorefy-profile-header.css` positions the image absolutely, preserving its
existing top anchor. A theme-aware gradient keeps name and handle readable. Public
Reader surfaces no longer cover the extended artwork. Original selected images,
focal positioning, layout choice, account contents and decoration positions remain.

QA caught a fixture missing the app's safe-area variables: an in-flow image could
feed its measured height back into the layout. Absolute positioning removes that
feedback; the fixture now also supplies the production safe-area defaults. Stable
repeated measurements and a source regression cover this correction.

Entry links are in `index.html`; service-worker cache is `lorefy-v571-profile-header`.
Changed runtime assets are mirrored to `ios-web` and `ios/App/App/public` only.

## Verification

- Five tests in `tests/profile-header-extent.test.js`: layout/scroll geometry,
  invalid values, source constraints, idempotent writes and observer cleanup.
- Full final suite: 2443 pass, zero fail/skip/cancel, exit 0; evidence outside the
  vault: `artifacts/profile-header-tests-final.txt` in the chat workspace.
- Fresh focused suite: 32 pass, including Reader, version consistency and exact
  source/native-web parity. No native compilation was run.
- Actual owner app, all layouts: banner extends beyond handle/frame with no
  horizontal overflow. Normal image bottom 353px / handle bottom 332.98px;
  Panoramic 332px / frame bottom 311.64px; Reader 333px / frame bottom 312.78px.
- `qa/profile-header.html` uses the actual public renderer with fictional profile
  data, long English names and existing local artwork. At 320px: Normal dark
  image height 354px, Panoramic light 465px, Reader dark 313px. Each matches
  identity plus 20px, stays stable across repeated reads and has 320px scroll width.
- Public screenshots: `profile-header-public-normal-dark-320.jpg`,
  `profile-header-public-immersive-320.jpg`, `profile-header-public-reader-dark-320.jpg`.
  No final public-fixture browser errors were observed.

Physical iPhone, VoiceOver and deployed cross-account projection are not certified
by these local browser checks. Earlier unrelated phone-preview host observer errors
are not claimed fixed. No GitHub push, database change, Apple upload or build.

Related: [[systems/Profiles-Lists]], [[14-Feature-Coverage]],
[[sessions/2026-10-23-Reader-Layout]], [[sessions/2026-10-24-Wooden-Shelf]].
