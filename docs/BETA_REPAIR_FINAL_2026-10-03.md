# Beta repair verification - 2026-10-03

## Result

The remaining locally actionable repair passes were completed in this session.
This is not approval to release and is not evidence that the changes have reached
TestFlight. No IPA was built or uploaded, no production account was deleted,
and no Supabase functions or database schema were modified in this session.

## Repair Matrix

| Report | Implementation and evidence | Remaining acceptance gate |
| --- | --- | --- |
| Ratings/library disappear | Previous state-recovery pass retains pending writes arriving during cloud pull, isolates owner/generation and covers cold-reopen persistence. Existing runtime tests remain green. | Real authenticated cold launch, offline recovery and second-device verification. |
| Google registration | Wait for native callback-listener registration before opening the provider; existing callback/dismissal/session restoration coverage retained. Deferred-listener test failed before repair and passes now. | New/existing Google accounts on physical iPhone. Mock tests do not verify provider configuration. |
| Account deletion failure | Missing session cannot report success; duplicate submits share one request; server error codes yield actionable reauthentication or cleanup-failure messages. Session remains until successful server deletion. | Delete a specifically authorized disposable account, verify server cleanup and Apple authorization revocation. This client repair does not prove the reported server failure is resolved. |
| Explicit recommendations | Source content classifications retained. AniList requests exclude adults; explicit catalog records filtered; unknown classification fails closed for automatic personalized, editor and related-work recommendations. Empty recommendation sections are hidden without hiding the remaining catalog. | Classification coverage is deliberately incomplete; unclassified works remain searchable but are not automatically promoted. Not an all-ages certification. |
| Search white screens | Search tolerates absent indexing fields, numeric fields and invalid rows, includes aliases and Arabic normalization. Shared helper now loads before the app. Search index avoids repeated normalization and follows record edits. | The historical Epic control is absent in the current Explore UI; its original exception has not been reproduced or declared solved. |
| Hidden onboarding minimum | Required selections and remaining count visible before interaction; Continue disabled until minimum. Catalog-ready/ingested events refresh work choices rather than freezing the initial sample. | Real signup progression on iPhone after authentication. |
| Fabricated/repeated descriptions | Work/Explore uses available source synopsis; catalog placeholders discarded; original English used rather than a guessed Arabic story. Explicit missing-source state replaces fabricated plot. | Imported source text may itself be incorrect; source provenance is not a guarantee of factual accuracy. |
| Character picture/name mismatch | Failed ID-specific Jikan lookup preserves verified seed instead of falling back to a name-only search. Work-scoped Wiki galleries retained. | Existing imported/custom images were not bulk replaced; investigate concrete mismatched identities supplied by testers. |
| Character cap of 25 | Regression suite verifies all AniList pages, stale 25-row caches, changed pageInfo and incomplete continuation failure. | Sources may have incomplete casts; cannot promise every character of every work. |
| Own notifications | Live list and realtime callbacks exclude own actor while retaining null-actor system events. Read-only Supabase inspection confirms deployed private.enqueue_notification already blocks recipient = actor and deduplicates event_key. | External push still requires owner APNs credentials and device delivery test; no secrets created. |
| English interface | Review opens in English; chapter page counts and dates use active language; diary subtitle no longer reintroduces Arabic every observer pass; dynamic reaction labels translated. Authored content remains untouched. | This is targeted coverage, not a claim that every catalog/user-authored field is translated. |
| Dark/Pink/community layout | Existing neutral dark and Pink palettes verified visually. Community/thread have no horizontal overflow at tested widths; long unbroken text wraps. | Physical-device keyboard, safe-area, cold-start and scrolling performance remain unmeasured. |

## Verification

- npm test: **572 passed, 0 failed**, final log qa/beta-repair-final-tests.log.
- npm run ios:prepare and npx cap copy ios completed after final source edits.
- Shipped web/Xcode bundle synchronization test passes.
- Scoped git diff --check passes; only Windows line-ending warnings.
- Real localhost browser: Hunter x Hunter searchable, 420 chapters and sourced
  chapter titles present; empty search and Book filter remain usable.
- Search helper timing over 22,567 records: approximately 22 ms initial and
  20 ms subsequent lookup in this desktop browser. This is not iPhone timing,
  end-to-end render latency or a no-lag guarantee.
- Onboarding browser probe in edit mode: 0/1/2 genre selections disabled;
  3 selections enabled. Next stage exposes minimum three works. All 60 visible
  work buttons have text. Probe removed by reload; no preferences saved.
- English Write a review opens the real review sheet. No new review published.
- Community long-text thread at 390 px: scrollWidth = clientWidth = 390.
- Community app at 375/768 px: scrollWidth = clientWidth at both widths.
- Pink profile screenshot: qa/beta-final-pink-profile.jpg. Dark profile inspected
  visually; profile shows 420 chapters and 84 estimated hours for demo completion.

## Product Suggestions Not Implemented As Bug Fixes

Complete author bibliographies/related sequels, separate Paused and Dropped
semantics, chapter mark-all-read, optional independent overall rating,
first-250 badge and username policy changes still need their own implementation
and acceptance pass. Android distribution was not requested or performed here.
These were not silently marked complete with the repair work.

## Release Gate

Hold any claim of full beta readiness until physical-iPhone Google/Apple login,
authenticated persistence, disposable-account deletion and APNs delivery pass.
Existing Build 33 is unchanged by editing local web assets; a newly built native
binary is required to deliver these repairs to testers.
