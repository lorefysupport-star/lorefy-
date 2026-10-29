---
kind: session
status: source-browser-verified-device-pending
date: 2026-10-28
---
# UI consistency: review reporting and content controls

Local continuation of [[sessions/2026-10-28-UI-Foundation-Phase-Six]].
Used existing UI/UX Pro Max form-feedback/recovery guidance, Apple material
rules and local Playwright. Plugin Management guidance selected available tools;
no plugin/dependency installed, permissions changed or external account connected.
No GitHub, native build, production mutation or real moderation action.

## Reproduced

The review-options entry opened an opaque legacy sheet,36px Close, unassociated
note label and Arabic-only content. Send had no single-flight/pending feedback;
all successes claimed delivery even when Core only saved a device report. Async
actions could update obsolete UI. Core captured the report array before awaiting
the existing reporting service, so out-of-order receipts could overwrite one
another; the local receipt write lacked a final owner/client/generation check.

## Implementation

- `modules/lorefy-product-tools.js`: review-menu label is direct AR/EN; the
  existing `openReviewSafety` opts into `.lf-trust-studio.lf-report-studio` and
  shared Product Tools chrome. Real form, native associated labels, six preserved
  reason values and optional800-character details. IDs/content targets unchanged.
- One pending operation across report/mute/block. Fields/actions disable while
  Close remains enabled and focused; inline status announces progress. Failures
  retain reason/prose, focus safe retry feedback and do not expose raw RPC errors.
- Pre/post validity includes opening account, backend/client identity, mode,
  generation, connected target card and overlay lifetime. Late results cannot
  close a replacement, hide another account's content or toast into obsolete UI.
- Device-only mode explicitly says reports are not sent. A cloud-delivery message
  requires the existing remote path and its non-pending receipt. Reporting itself
  does not hide content; mute/block remain separate, explicit actions.
- `modules/lorefy-product-core.js`: before storing an awaited report receipt,
  check owner/generation/backend/mode/client. Merge into the current report list,
  not its pre-request snapshot. Existing backend/RPC signatures and schema unchanged.
- `styles/lorefy-trust-studio.css`: scoped semantic glass/action pairs,16px
  native fields,44px controls and inline feedback. Shared chrome/palette retained.
- Fresh module/style keys and cache `lorefy-v618-report-studio`. Five changed
  runtime files match both native web-copy directories; no native prepare/build.

## Verification

-21 new regressions, including a separately reproduced client-change case.
  **2773/2773** full source tests,0 failures, exit0.
- **13/13** visual/keyboard cases:6 palettes x AR/EN at390/320px and844/568px,
  plus1280px desktop. Labels, targets, reason values, optional limit, Tab loop,
  Escape/opener restoration, actual ancestor isolation and material verified.
  Minimum measured primary action contrast6.02:1; block control also >=4.5:1.
- **7/7** lifecycle cases: replaced fixture report/block/mute rejections, close
  during pending, old completion with a new dialog, fixture local-result wording
  and backdrop return. These replace the operation before activation: no actual
  report, mute or block function/service runs. Sampled storage values unchanged.
- Initial browser report tested `.nc-screen.inert` directly and failed because
  its ancestor `#root` is correctly isolated. DOM inspection confirmed this;
  final checks test `closest('[inert]')` for both isolation and restoration.
  Initial evidence is retained, not counted as successful application validation.

Evidence outside repository: `artifacts/ui-execution-phase7-20261028/` contains
full-tests.log, report-browser.json, report-lifecycle.json, verification.json and
screenshots. Arabic pink, English fixture recovery and desktop images reviewed.

## Boundaries

Closing the UI does not cancel an already-issued service request. A same-owner
receipt may still be persisted by Core; stale UI is ignored. Live delivery,
moderation review, retry idempotency and physical iPhone/VoiceOver/Dynamic Type
remain unverified. Existing post reporting coverage is not expanded by styling
the review-options flow. Legal pages and remaining27-unit plan are still open.

[[systems/Privacy-Data]] | [[systems/Community-Notifications]] |
[[09-Data-Contracts]] | [[13-Project-Story]] | [[14-Feature-Coverage]]
