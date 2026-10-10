# Discord repair verification - 2026-10-04

## Scope

Reviewed the existing Discord audit and current implementation, then reran
regression tests and the actual localhost browser. The previous live Discord
read included 12 forum topics, replies, suggestions, help, general, updates
and historical bug-log. This session did not post messages or mark reports
resolved in Discord. Local preview is not the distributed TestFlight build.

## New repairs in this session

- A late cloud push cannot clear another account's pending journal, overwrite
  its synchronization baseline, or submit the next batch after an account switch.
- Profile hydration checks account ownership and request generation after both
  the profile query and media signing. It cannot overwrite a newer local edit.
- An offline identity edit awaiting synchronization takes precedence over an
  older profile response.
- Native photo selection retains PNG/JPEG/WebP MIME and extension rather than
  incorrectly labelling every image as JPEG. Unsupported formats report failure.
- English reading-session copy, version text, dynamic library actions and rating
  accessibility labels have targeted translation coverage.

Nine new behavioral regression tests cover these account and photo cases. The
tests reproduced failures before repairs and pass afterward. Existing batching
and retry tests were updated with explicit account-owner fixtures.

## Report matrix

| Report | Current evidence | Still required |
| --- | --- | --- |
| Library/rating disappearance | Cold-reopen journal replay, pull-time writes/deletions, partial-catalog preservation and batch retry tests pass. Additional push/profile account races repaired above. | Authenticated force-close and second-device acceptance on iPhone. |
| Google sign-in | Native callback registration, single code exchange, cancellation, reload and secure session tests pass. | Physical iPhone login with new/existing accounts. Do not equate simulated OAuth with provider success. |
| Account deletion | Client duplicate protection, recent-auth guidance and failure/session preservation tests pass. Backend deletion/revocation implementation inspected. | Explicitly disposable account deletion and server cleanup verification. No production accounts deleted. |
| Search/white screen | Invalid/unindexed records and Arabic aliases covered. Browser author search shows 28 George R. R. Martin results; navigation and review open without observed console errors. | Historical Epic exception was not reproduced; current UI no longer exposes that control. Native freezes remain a device acceptance case. |
| Unsafe Surprise recommendations | Explicit/AI/unknown classification exclusion regression tests pass across automatic recommendation paths. | Classification quality and concrete tester examples. Not an all-ages guarantee. |
| Onboarding blocked | Existing 0/1/2/3 choice/minimum coverage passes. | New-account native flow after real provider login. |
| Missing/mismatched characters | Pagination, stale 25-row cache, source ID matching, failure fallback and portrait export tests pass. | Validate named mismatches; sources cannot guarantee every character. |
| Profile image changes | Owner upload RLS inspected read-only; native MIME mismatch and late profile overwrites repaired. | Real iPhone replacement, cloud persistence and other-reader display. |
| Incorrect synopsis/catalog gaps | Source-synopsis and comic identity/taxonomy tests pass. Named author search verified in browser. | Source facts and editions still require curation; catalog size alone is insufficient. |
| Own notifications | Existing actor exclusion/deduplication tests pass. | External delivery still requires APNs setup and device testing. |
| English review | Actual Write a review button opens English editor. Session copy corrected. | Full-language coverage and native keyboard acceptance; user-authored content is intentionally not translated. |
| Dark/Pink/community | Palette, responsive reply/thread and long-text tests pass. English dark review at 838px has no horizontal page overflow or broken images. | Native keyboard/safe-area and measured cold-start/scrolling performance. |
| Chapter comments appear as tweets / Publish inactive | Existing dedicated chapter discussion tests pass: comment-only publish, private save, duplicate protection, errors/retry, no community publishing. | Authenticated chapter submission in replacement native build. |

## Server observations

Read-only Supabase log aggregates for the default preceding 24-hour window:
101 successful /token responses; one Google /authorize event, no /callback
entry in the selected aggregate; no delete-account request in function-edge
logs. These observations neither establish Google success nor prove the cause
of the historical failure. No credentials, raw user logs or tokens were exported.
No database schema, provider credentials or Edge Functions were changed.

## Verification

- Initial focused existing suite: 71 passed.
- Final npm test: 623 passed, 0 failed.
- Final log: qa/discord-repair-20261004-tests.log.
- node tools/prepare-ios-web.mjs and npx cap copy ios succeeded after source edits.
- Scoped git diff --check succeeded, with only a Windows line-ending warning.
- Browser: English editor opens, 28 author results, no console errors in inspected
  routes; review dialog width 600px/scroll width 598px, page width 838px/viewport
  838px, zero broken images. No review published. Preview language/theme restored.

## Not silently completed

Separate Paused/Dropped semantics, chapter mark-all-read, author/series pages,
first-250 badge and username-policy changes remain product work, not completed
by these bug repairs. Independent overall-rating UI already exists; its native
acceptance should still be checked. No Android release, IPA build or TestFlight
upload occurred. Existing Build 33 remains unchanged.

Full beta readiness remains blocked on real-device authentication, authenticated
persistence, authorized disposable-account deletion and APNs delivery acceptance.
