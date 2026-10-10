# First repair gate: library and rating persistence

## Reproduced defects

Three runtime tests failed before the change:
- A rating written while pull awaited the server was overwritten by an older
  cloud response because the local snapshot and pending journal were stale.
- A deletion in the same interval was resurrected.
- A response requested for one account overwrote another account's local state.

These are demonstrated defects, not proof that they explain every tester's
reported disappearance. Production data was not inspected or modified here.

## Changes

- Associate a pull with its owner and generation before the network request;
  reject stale responses after another pull, account change or stopSync.
- Read the current local state and journal after the response arrives, before
  applying cloud values, so newly written ratings and deletions survive.
- Install the storage observer on Storage.prototype, restricted to the local
  storage instance, and restore it when stopped. This supports exotic named
  setters without intercepting sessionStorage. Chromium's previous instance
  hook was observed working; the synthetic exotic-setter test is a portability
  regression test, not proof that this was the production failure cause.
- Version the backend asset and service-worker cache, regenerate ios-web and
  copy the updated web assets to the iOS project.

## Verification

- Four new tests failed before implementation; seven new runtime tests pass
  after the fix. Cases include pending cold-reopen replay, failed hydration,
  acknowledged newer remote state, in-flight edit/delete and account isolation.
- Full npm test: 551 passed, 0 failed; qa/state-recovery-tests.log.
- The local demo browser loaded the new state-recovery-v1 asset and prototype
  hook. A temporary account-state probe and its pending journal survived a real
  reload. The probe was removed afterward without changing user library data.
- npm run ios:prepare and npx cap copy ios completed successfully.

## Not closed yet

No new IPA was built, uploaded or distributed in this repair. No real iPhone
force-quit test or real Supabase rating-only round trip was performed. A browser
storage probe and mocked cloud response do not establish either result.

Before closing the Discord report, use a dedicated test account on the new
native build to rate a work without writing a review, force-quit and reopen;
repeat offline, then reconnect and verify cloud acknowledgement and the rating
on a second device. Also cover first account startup, an existing account and
logout/account switching. If any case fails, stay on this issue and trace the
actual device/session/state transition rather than proceeding to another issue.

Other repair items remain open. This document deliberately does not mark the
entire persistence complaint or the beta resolved from passing local tests.
