---
kind: repair-session
status: in-progress
date: 2026-11-02
---
# Application interaction audit

The owner requested extending the profile/Explore methodology to the application.
This is a risk-based source and local-browser pass, not exhaustive device/service
certification. Existing layout, art, colors, identities and reading data stay.
No build, production writes or deployment. Push each verified repair separately.

## A-001: community modal background ownership

Actual-browser before probe: composer did not isolate app navigation; attachment
picker did not isolate the underlying composer. React profile/Explore repairs
did not cover this separately mounted DOM module.

`modules/lorefy-community.js` now shares reference-counted isolation across its
composer, attachment picker, editor, conversation and reader-post overlays.
Nested/outer-first release preserves the background until every owner releases;
previous inert state is restored, not blindly cleared. Existing batched DOM
maintenance releases detached overlay locks, without adding another observer.
Reader posts gain initial focus, Escape/Tab and opener return. Existing composer
draft/publish logic stays; conversation Tab ignores invisible controls. Escape
is consumed by the active layer. No visual redesign or provider/backend change.

Evidence:five new source regressions failed before repair, six now pass.30
focused tests;3299/3299 final full tests, exit0,62203ms. First full run caught one
obsolete asset-version assertion, updated only its expected URL before rerun.
104/104 actual browser checks: AR/EN x320/430px, all3 attachment modes, inert
focus blocking, inner/outer close, draft reopen, local publish, edit cancel,
conversation, reader posts and detached overlay cleanup. Initial probe now true.
Cachev680; six selectively synchronized web mirrors match before push.

Receipts outside Git: `artifacts/app-community-modals-20261102-full.log`,
`output/playwright/app-community-modals-v680-results.txt`,
`output/playwright/app-community-modal-probe-v680.js`.

## Audit Coverage and Next Work

| Area | Current evidence / next step |
| --- | --- |
| Profile / Explore | Prior independently verified P-001..003/E-001..002; do not repeat as new repairs. |
| Community overlays | A-001 source/browser verified; next inspect pending edit save behavior. |
| Library / work / review | Source routing reviewed; broader actual UI smoke still queued. |
| Settings / personalization / export | Source modal/async ownership reviewed; actual cross-page smoke still queued. |
| Device / live services | Native keyboard, Photos, hardware FPS, real accounts/providers remain separate. |

[[systems/Community-Notifications]] | [[systems/Explore-Works]]
[[13-Project-Story]] | [[14-Feature-Coverage]] | [[15-Work-Control]]
