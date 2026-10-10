# Discord beta re-audit - 2026-10-03 evening

## Scope and evidence

Read the visible bug forum (12 topics), suggestions, help, general, updates,
ur-profile and the historical bug-log through the signed-in Discord browser.
Latest observed general message: October 3, 18:53; latest observed suggestion:
October 3, 13:03. Read active discussion replies, not only forum titles.
This is not a claim to have inspected inaccessible channels, archived threads,
DMs, or every attachment. No Discord messages, permissions or tags were changed.

Compared against BETA_TESTER_AUDIT_2026-10-03.md (earlier 09:50 cutoff),
BETA_REMEDIATION_2026-10-03.md and the current regression tests. Owner promises
and acknowledgements are not evidence that a fix reached testers. Build 33 is
announced in Discord; this audit does not verify App Store Connect distribution
or establish the build/device used by every reporter.

## Remaining release blockers

| Priority | Report | Current status and required closure |
| --- | --- | --- |
| P0 | Library/rating disappearance after reopening | Two independent testers; one distinguishes rating-only loss from reviews that remain saved. Local batching, pending-change retry and partial-catalog preservation have tests, but the reported cold-reopen scenario is not closed. Verify account identity, rating-only save, cloud acknowledgement, force-close, cold-open, offline recovery and a second device. Disappearance does not itself prove server deletion. |
| P0 | Google sign-in unusable | Owner acknowledges failure in the distributed beta. Local callback/dismissal race and native session-restoration tests pass. Still requires real iPhone testing with new/existing accounts and delivery of a new build. Mock success is not provider login verification. |
| P0 | Explicit sexual content in Surprise recommendations | Tester reports hentai. Recommendation eligibility needs reproduction and complete adult/unknown-content filtering across recommendation paths. Existing title exclusion policy and non-adult cover lookup are not a complete recommendation safety policy. A separate complaint about an unrelated religious book concerns relevance, not evidence that religion is unsafe content. |
| P1 | Account deletion fails | Remains unverified; test a disposable account with reauthentication, backend deletion and subsequent inability to sign in to the deleted identity. Never treat logout as deletion. |
| P1 | Search sometimes freezes/turns white; Epic genre turns white | Still open. Test each genre, rapid search, empty results, slow/failing requests and both languages; capture the actual runtime exception before declaring a root cause. |
| P1 | Onboarding seems stuck before three choices | One tester explicitly confirms selecting three resolves it. Hidden minimum, not demonstrated crash. Explain minimum and show remaining count before interaction; cover 0/1/2/3 selections. |
| P1 | Descriptions repeated/wrong; comic character image/name mismatch | Still open. Match source IDs and report unavailable descriptions instead of fabricated summaries. Verify editor, profile and external export from the same identity. |
| P1 | Cold launch lag, frequent freezes and content jumping | Repeated in general. Browser layout improvements do not establish native performance. Measure device cold-launch and scrolling; prevent layout shifts during deferred content loading. |
| P1 | Notifications for own review | Still an open report. Determine whether this is self-notification or a global review event; exclude actor, deduplicate and separate event preferences. This report does not prove APNs availability or failure. |

Primary sources:
- [Persistence discussion](https://discord.com/channels/1548805628430909453/1555548766763749526)
- [Login and deletion discussion](https://discord.com/channels/1548805628430909453/1555547589955424417)
- [Surprise recommendations](https://discord.com/channels/1548805628430909453/1555556945795088414)
- [Search failure](https://discord.com/channels/1548805628430909453/1555617293193707620)
- [Epic genre failure](https://discord.com/channels/1548805628430909453/1555627700075634789)
- [Onboarding clarification](https://discord.com/channels/1548805628430909453/1555569257520037939)
- [Character/top selection issues](https://discord.com/channels/1548805628430909453/1555561832637403217)
- [Description issues](https://discord.com/channels/1548805628430909453/1555554119283114035)

## Local changes awaiting tester confirmation

- English review action now has a language-independent identity and regression
  coverage. Do not close the Discord report until an English review succeeds in
  the replacement native build.
- Home is now the social timeline; Explore owns discovery. This addresses the
  duplicated navigation request locally, not in the already distributed IPA.
- Neutral dark surfaces, Pink appearance and community layout/composer changes
  have local tests and earlier browser QA. They still require on-device checks.
- Cloud saves are serialized in batches of at most 20 keys, preserving failed
  batches for retry. This fixes a demonstrated failure mode, not every possible
  cause of the reported disappearance.
- Native Google callback race has local regression coverage; real OAuth and
  account/session lifecycle remain a release gate.

## Suggestions added after the earlier audit

1. Related series/sequels and a complete author bibliography instead of generic
   recommendations alone. [09:53 suggestion](https://discord.com/channels/1548805628430909453/1555538889215709245/1555835278957084732)
2. Separate Paused / Read later from permanently Dropped.
   [13:03 suggestion](https://discord.com/channels/1548805628430909453/1555538889215709245/1555882874849329226)
3. Android availability question in general at 18:39. This is an availability
   question, not a confirmed Android defect or authorization to ship Android.

## Earlier requests still needing a decision or implementation

- More books, especially George R. R. Martin, historical and self-development
  categories; validate findability of named works, not catalog totals alone.
- Chapter read checkboxes, mark-all-read and clearer work reading status.
- Optional personal overall rating separate from the detailed criterion mean:
  a product choice, not a proven calculation bug.
- Complete character lookup, consistent top ordering in RTL/LTR and searchable
  work favorites beyond the initial sample.
- First-250 tester badge: owner acceptance is not implementation evidence.
- Username editing: currently intentionally locked; changing it requires a
  policy and link-identity decision rather than treating the lock as data loss.
- Old September reports about Hunter chapter/hour totals, review visibility,
  comic runs versus collected editions and iPad sizing remain regression cases;
  old reports alone do not demonstrate current failures.

## Verification performed this audit

Executed:

```text
node --test tests/beta-remediation.test.js tests/beta-persistence.test.js tests/home-social-discovery.test.js tests/catalog-content-policy.test.js tests/native-auth-flow.test.js
```

Result: 50 passed, 0 failed. Includes source assertions and mocked runtime
tests; not a live-device acceptance test. No new IPA was built or distributed,
no production account was deleted, and no server-side fix was applied here.

## Next repair order

1. Reproduce rating-only cold-reopen loss and native Google login with dedicated
   test accounts; log redacted identity/state transitions, not tokens.
2. Close recommendation safety and account deletion gates.
3. Reproduce search/Epic white screens and fix onboarding feedback.
4. Validate catalog identity/content, then native performance and notifications.
5. Ship a distinct build, rerun the original reports with testers, and only then
   mark issues resolved. Product additions should not displace these gates.
