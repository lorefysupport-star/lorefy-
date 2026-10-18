---
kind: session
status: source-verified-device-pending
date: 2026-10-18
---
# Community and full Profile UI consistency

The owner requested broader application of the installed Apple Design skills
to Community and Profile. This extends [[2026-10-18-Apple-UI-Surfaces]] in the
existing web/Capacitor stack, not a SwiftUI migration or a native release.

## Presentation contract

- Owner and visitor share three segmented Profile tabs. Below 360px icons
  stack over labels so English Overview has sufficient horizontal space.
- Reading values use tabular numerals and logical separators. Captions wrap on
  words; favorite-format text is smaller than numeric metrics. The 320px check
  exposed split Completed/Manga labels, corrected before delivery.
- Identity and bio use theme tokens. Lower Profile headings, Lists/Posts
  gutters and compact inline create actions share the established hierarchy.
- Read-only ranked lists use stable rank/cover/title tracks and 56x76 covers.
  Editing controls retain their existing layout and keyboard contract.
- Community, Profile posts and conversations share 40px avatars, 16px body
  text and restrained author metadata. Review media keeps original covers.
  Action grids accommodate owner/visitor counts with 44px minimum targets.
- Composer tools are unframed icon-and-label controls; a black dimming scrim
  works in light and dark appearances. Publish remains disabled when empty.
- Conversation header/reply tracks are balanced. Reply text is 16px. Thread
  bars join the supported material and opaque reduced-transparency fallbacks.
- New social/Profile controls have immediate press feedback; reduced motion
  keeps opacity feedback without displacement. Home friend rails use compact
  88px items; Explore and expanded rails are not targeted.

No banner/frame geometry, artwork, reading calculations, stored state, account
boundaries, follow relationships, post persistence or API behavior changed.
The shared CSS, entry and worker cache key are updated together.

## Verification evidence

- Fourteen regression tests were observed failing before their corresponding
  implementation; 79 focused tests and 2133 full-suite tests passed, zero
  failures, skips or cancellations.
- Browser checks: AR/dark at 390x844; EN/light at 320x900; owner Profile at
  1280x900. No document horizontal overflow in the sampled states.
- Opened owner Overview/Lists/Posts, DFH read-only list and its editor; editor
  controls remained 44x44 and inside the row at 320px. Cancelled without saving.
- Owner post actions measured at least 47x44 at 320px. Visitor actions measured
  at least 44x44 at 390px. The fixture visitor retained its green appearance,
  decorative assets and values (2 completed, 20 chapters, 3 estimated hours).
- Composer tools measured 91x69 at 320px; typing a temporary draft enabled
  Publish, then clearing it and cancelling avoided any publication.
- Conversation send target measured 44x44, reply font 16px; empty send stayed
  disabled. Reduced-transparency bars were opaque with backdrop-filter none.
- Forced active Profile-tab state computed opacity .76 / scale .97 normally,
  and opacity .76 / transform none under reduced motion.
- Home friend items measured 88px; Explore retained 98.8px at 390px. Preferences
  restored to Arabic/dark. No follow, post, reply or list mutation was submitted.
- Only three repaired web assets were copied into both generated native web
  trees and matched by SHA-256. No full native sync/build command was run.
- Screenshots and test logs remain outside Git in the conversation artifact
  folder `artifacts/social-profile-ui-20261018/`.

## Remaining limits

This is not exhaustive accessibility, VoiceOver, physical-iPhone, FPS or all-27-
decoration certification. The legacy Profile review renderer still exposes
some action buttons as count-only accessible names; that semantic improvement
is a separate source task, not repaired by CSS or DOM injection. Existing cover
fallbacks can appear while remote artwork resolves; image logic was not changed.
No native build, Apple upload, production service, secrets or dependency change.

[[systems/Profiles-Lists]] | [[systems/Community-Notifications]] |
[[playbooks/Apple-Interaction-Quality]] | [[18-Progress-Handoff]]
