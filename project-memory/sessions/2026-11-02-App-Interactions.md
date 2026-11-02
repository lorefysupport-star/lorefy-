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

## A-002: pending community edit lifecycle

Typing while save awaited transport could re-enable Save and issue another edit.
Late results could dismiss a closed editor again, steal focus, or alter abandoned
status. The editor now has a pending latch and connected/dismissed lifetime;
draft input stays disabled until failure, then unlocks for one explicit retry.
While saving, focus moves to Close so Escape/Tab still reach the active modal.
Closing does not claim to cancel an already sent request; stale UI results are
ignored. Payloads, ownership guards and backend transport are unchanged.

Evidence: three of four initial regressions failed before repair; a fifth adds
external detach. The busy-focus assertion also failed before the focus change.
All five pass; final3304/3304 full tests, exit0,62504ms. Actual DOM browser checks
AR/EN:18/18 with controlled deferred edit transport in isolated demo contexts,
not live writes.104/104 community modal regression checks also pass, errors[].
Cachev681; six selected web mirrors match. Receipts outside Git:
`artifacts/app-community-edit-20261102-full.log`,
`output/playwright/app-community-edit-v681-results.txt`,
`output/playwright/app-community-modals-v681-results.txt`.

## A-003: obsolete export rendering

After an export closed or its selection changed, awaited fonts/media could still
start page loads, allocate a full-size canvas, draw and encode an obsolete PNG.
The visible file already had a late-result guard, but that did not protect UI
work. Render now checks lifetime plus selection revision after each await and
before thumbnails; request-local image loading also checks this boundary.
Artwork, three designs, palette controls, paging and delivery contracts stay.
Already-started browser image/PNG operations are not falsely claimed canceled.

Six regressions failed before repair (close/supersede at fonts/page/avatar);
a seventh failing regression covered asynchronous source resolution. All nine
now pass including current-render success.19 share focused tests and
3313/3313 full tests, exit0,63233ms.44/44 actual browser checks AR/EN x320/430px
with controlled media loading, real canvas drawing and PNG encode counting:
closed renders encode0, replaced renders encode only the current image; all
three designs, square/story/portrait, custom accent and Escape restore pass.
No native share destination/Photos or live account certification. Cachev682,
six selected web mirrors match. Receipts outside Git:
`artifacts/app-export-lifecycle-20261102-full.log`,
`output/playwright/app-export-lifecycle-v682-results.txt`.

## A-004: closed conversation reply receipt

A successful delayed reply used the removed textarea's input event to rewrite
the shared reply draft. Closing and reopening the same conversation could lose
the newer draft; late failure also showed an obsolete toast. Reply dispatch and
both async continuation boundaries now require a connected conversation. Pending
send retains focus in the editable reply field so Escape still reaches it.
Current failure stays retryable; current success clears only its sent text.
Already-sent transport is not claimed canceled; server acceptance stays separate.

Three regressions failed before repair; the busy-focus assertion separately
failed before focus retention.5 new tests/43 related tests pass. Final3318/3318
full tests, exit0,63573ms. An old exact-source assertion was strengthened for
the new connected guard; its first-run failure was not a runtime regression.
26/26 actual AR/EN browser checks with controlled reply transport reproduce
close/reopen/new-draft/late receipt and failure/retry, errors[]. Cachev683;
six selected web mirrors match. Receipts outside Git:
`artifacts/app-reply-lifecycle-20261102-full.log`,
`output/playwright/app-reply-lifecycle-v683-results.txt`.

## Cross-page Browser Acceptance

168/168 AR/EN x320/430px checks exercise empty/populated Library, all4 modes,
mode persistence, search/recovery, all3 sorts, saving completed reading384/384,
cancel preserving completion, review deliberate zero/cancel, cover unchanged
save/close/focus, Work tabs, Settings, all3 appearance choices and profile layouts,
cancel and horizontal bounds. No real account write. The probe initially read
the missing aria-valuenow on a native progress element, then sampled before its
async refresh; it now awaits its native value. Customize group/name fixtures were
aligned with observed markup. No application change was needed for those probes.
Fresh Explore140/140 and Profile120/120 browser regressions also pass.
`output/playwright/app-cross-page-v682-results.txt`,
`output/playwright/app-explore-regression-v683-results.txt`,
`output/playwright/app-profile-regression-v683-results.txt` are outside Git.

## Audit Coverage and Next Work

| Area | Current evidence / next step |
| --- | --- |
| Profile / Explore | Prior independently verified P-001..003/E-001..002; do not repeat as new repairs. |
| Community overlays | A-001/A-002/A-004 source/browser verified; live writes remain separate. |
| Library / work / review | Core actual UI paths pass168 cross-page cases, not every possible datum/input. |
| Settings / personalization / export | Core settings/theme/layout/cancel pass; A-003 export verified. |
| Import / safety / notifications | Additional actual-browser pass ongoing; English inbox copy gap observed. |
| Device / live services | Native keyboard, Photos, hardware FPS, real accounts/providers remain separate. |

[[systems/Community-Notifications]] | [[systems/Explore-Works]]
[[13-Project-Story]] | [[14-Feature-Coverage]] | [[15-Work-Control]]
