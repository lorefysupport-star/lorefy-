---
kind: session
status: source-verified-device-pending
date: 2026-10-18
---
# Minimal sign-in and launch, selected owner direction

The owner supplied two sparse dark launch references and explicitly rejected
illustrative sign-in imagery. This supersedes the earlier editorial opening
for the welcome stage. A generated book scene was explored before that change
of direction but was not copied into the project, referenced or shipped.

## Implementation

[Auth presentation](../../styles/lorefy-auth-flow.css) now has a charcoal
welcome surface, restrained Lorefy wordmark and only the existing Google/Apple
provider controls. No scene, hero image, feather tile, promotional heading or
feature paragraph is shown there. Provider glyphs, language control and legal
copy remain. Buttons have stable 56px targets and 8px corners, native activation
and visible keyboard focus. Visual order matches DOM/tab order.

The dark welcome palette is deliberately scoped to welcome. Account completion,
recovery and preferences retain the selected appearance and existing auth/data
logic. No provider enablement flag, OAuth callback, credential handling or
email-auth policy changed. Local unconfigured mode still fails closed and
offers its existing explicit demo entry, with extra space to avoid overlap.

[Web bootstrap](../../index.html) replaces the floating raster icon and visible
preparing-library text with a centered mint L monogram and three small opacity
loading dots on charcoal. It uses no remote asset or new timer. Reduced motion
stops the animation. It remains an indeterminate status, not fake progress.
The native launch storyboard and installed app icon were not changed.

## Verification

- Two visual source contracts failed before implementation; a third new focus
  regression failed before its correction. The existing provider-route guard
  confirms exactly two original provider activations remain.
- Browser: actual welcome component in the local-only
  [presentation harness](../../qa/minimal-entry.html), AR at 390x844, EN at
  320x640, desktop at 1280x900. Zero img elements in welcome, no document
  horizontal overflow. Both provider buttons measured 350x56 at 390px.
- Apple and Google activated their respective isolated mock callbacks and
  recovered enabled state after a simulated failure. No real account, external
  OAuth, legal acceptance or credentials were submitted in this UI test.
- Loader preview clones the canonical index markup/styles rather than a second
  implementation. Mark measured 76x76, horizontally centered; all three dots
  compute animation none under reduced motion. Tab focuses Google visibly.
- Final run: 48 focused tests and 2145 full-suite tests passed, zero failures,
  skips or cancellations. Raw logs/screenshots stay outside Git in conversation
  artifacts/minimal-entry-full.log and minimal-entry-focused.log, with the
  minimal-entry-ar-390.png and minimal-loading-390.png screen captures.
- Updated entry, worker and auth CSS selectively match both native web copies.
  The QA harness and project memory are excluded from native runtime packaging.

This is source/browser verification, not native OAuth, VoiceOver, physical-
device launch, FPS or deployment certification. No new native build or Apple
upload. Existing user profile artwork and app-wide appearance remain intact.

[[systems/Accounts-Sync]] | [[playbooks/Apple-Interaction-Quality]] |
[[13-Project-Story]] | [[14-Feature-Coverage]] | [[18-Progress-Handoff]]
