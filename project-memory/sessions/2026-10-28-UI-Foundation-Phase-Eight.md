---
kind: session
status: source-browser-verified-device-pending
date: 2026-10-28
---
# UI consistency: legal and support documents

Continuation of [[sessions/2026-10-28-UI-Foundation-Phase-Seven]]. Existing
UI/UX Pro Max, Apple-like UI and Apple guidance used with Plugin Management
routing to installed tools. No installation, new service, production change,
GitHub, native build or contact submission.

## Reproduced and changed

Privacy displayed light/purple while the saved application theme was dark.
Legal pages had a40px back target,14px body, no section navigation, fixed
profile return and a stylesheet version different from the old precache key.

Privacy was implemented and its theme/section focus checked first. The same
shell was applied to Terms, Support and linked Community Guidelines so following
policy links does not restore legacy styling.

- `modules/lorefy-legal.js` reads semantic palette/custom colors before CSS
  paints, refreshes on theme storage/pageshow, writes no preferences and survives
  denied storage. No React, account/backend or analytics service is loaded.
- `styles/lorefy-legal.css` uses app tokens, glass only for sticky navigation,
  unframed sections,16px body,44px controls, safe-area spacing and wrapping text.
  Fallbacks include no-JavaScript, contrast/transparency and forced colors.
- Native details/summary contents uses existing h2 labels. Anchor navigation
  focuses the heading below the toolbar. Static skip/back links work without JS.
- Return/linked-policy context carries only entry and finite preview options.
  Only same-origin/same-directory known app referrers supply context; arbitrary
  redirects and auth query parameters cannot become the target. Return is Profile,
  not restoration of an open Settings modal.
- Four original article HTML/date/contact baselines are SHA256-locked unchanged.
  Documents remain Arabic with explicit lang/dir; only navigation chrome follows
  English preference. This is not an approved legal translation or content review.
- Cache `lorefy-v619-legal-studio` includes current CSS/JS and Community Guidelines.
  Seven runtime files selectively copied to both web mirrors; no prepare/native
  compiler. The separate public Edge Function documents were not changed/deployed.

## Verification

- TDD:19 new regressions;15 initial failures, four article baselines passed.
  Focused legal/release/report/data:56 tests passed.
- Full suite:2792 passed,0 failed. The initial run found the new module absent
  from ios-web. That run is retained as `full-tests-before-sync.log`; selective
  mirror copying corrected it before rerunning the suite.
- Browser:59 matrix/navigation/fallback cases plus6 recovery cases; four pages,
  Arabic/English chrome, six themes, widths390/320/1280, keyboard section/skip,
  native details, cross-document context, CSS200% zoom, no-JS, denied storage
  and forced colors. Zero uncaught page errors; matrix recorded zero app-service
  requests and no document-module preference/content writes.
- Screenshots inspected for all four pages. QA browser contexts were isolated
  from existing app tabs and closed afterward. Evidence/hashes/mirror parity:
  external `artifacts/ui-execution-phase8-20261028/verification.json`.

## Limits and next work

No email/contact, deletion, export, moderation or database operation. Precache
entries do not prove a complete offline install; CSS zoom is not Dynamic Type.
Native safe areas, iPhone, VoiceOver, policy/disclosure correctness and approved
translations remain separate gates. The27-unit plan is not closed. Next revisit
remaining display terminology/reading-state consistency, preserving saved values.

[[13-Project-Story]] | [[14-Feature-Coverage]] | [[systems/Privacy-Data]]
