# Remaining beta product work - 2026-10-04

## Implemented and checked

- Chapter read-through checkpoints update progress and library immediately.
- Next chapter opens the appropriate discussion editor; mark all available
  chapters and one-step undo are supported. Storage failure rolls back both
  keys. Undo refuses to overwrite newer changes to the same work.
- Completed legacy library entries without a checkpoint remain fully read.
- Verified ongoing source status takes precedence over stale catalog status;
  reading all available chapters of an ongoing work does not complete it.
- Paused and Dropped are separate library/profile/editor statuses. Legacy
  paused values remain valid; AniList, MAL, Kitsu and CSV dropped imports retain
  their meaning. Dropped contributes a distinct negative recommendation signal.
- Author bibliography opens from detail, matches attributed author identity,
  handles runtime auth fields and coauthors, and renders 24 covers per batch.
  The open list refreshes when the background catalog delivers more records.
- Updated source asset cache keys and copied final web assets into the iOS tree.

## Evidence

- Final npm test: 642 passed, zero failures.
- Log: qa/remaining-beta-20261004-tests.log.
- New focused tests: chapter-reading-progress, reading-status-policy,
  author-bibliography. Earlier full suite was 623 tests.
- prepare-ios-web and cap copy ios succeeded after the final source changes.
- Scoped git diff --check passed with Windows line-ending warnings only.
- Live local demo: Hunter checkpoint 3 updates its reading status, quick-action
  label follows the React update, next opens chapter 4, undo restores the
  original library state. Five status choices appear in the editor.
- Author list displays seven attributed Togashi catalog records after loading,
  including editions. This is not a claim of complete global bibliography.
- 375px viewport has no horizontal document overflow; author covers render.
  Screenshot: qa/author-bibliography-mobile.png. Inspected console has no errors.

## Explicitly pending

- Verified series/sequel relationships: generic related recommendations are
  not sufficient evidence to label books as sequels.
- First-250 badge: needs authoritative server eligibility/history, not a local
  counter or client-only badge.
- Username changes: require a server policy compatible with the current
  immutability protection and uniqueness rules.
- Physical iPhone provider login, authenticated persistence/second device,
  native keyboard/safe-area/performance, disposable-account deletion and APNs
  delivery acceptance remain open as in DISCORD_REPAIR_VERIFICATION_2026-10-04.

No production account was deleted, no Discord reply was posted, and no new
IPA was built or uploaded. The distributed TestFlight Build 33 is unchanged.
