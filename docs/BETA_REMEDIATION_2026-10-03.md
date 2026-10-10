# Beta remediation: first verified batch

This report does not close the entire tester audit. Source changes are local;
the already distributed TestFlight build has not been changed or replaced.

## Implemented

- Cloud state saves are serialized and split into batches of at most 20 keys,
  matching the deployed sync_user_state RPC. Only acknowledged changes are
  cleared; a failed later batch retains its pending local changes for retry.
- The work review action has a stable data-lorefy-action identity. English
  labels no longer remove the review action or prevent its toolbar discovery.
- Shared React and reading-diary dark surfaces use the neutral CSS palette.
  Detail actions and community reactions no longer inherit oval shadows or
  unreadable foreground/background combinations.
- Added reversible translations for review, chapter, profile, settings and
  community controls, including placeholders and accessibility labels.
  Reader-authored posts, review text and quotes are not machine-translated.
- Community filters retain stable identities after translation. Post and reply
  submission guards prevent editing from enabling duplicate in-flight sends.
- Thread composer follows the visual viewport, long text wraps, reply layout
  follows writing direction, closing restores focus, and Tab remains in the
  conversation dialog. Updates after dismissal do not repaint the old dialog.
- Native Google browser dismissal now allows the returning app URL to complete
  authentication rather than immediately cancelling the pending sign-in.

## Verification

- npm test: 512 tests passed, 0 failed (2026-10-03).
- Regression tests reproduced the English review/filter failures, oversized
  state patch rejection and native browser-dismissal callback race before fixes.
- Added a failed-second-batch retry test and Arabic/English round-trip test.
- Browser demo: wrote, rated and published an English work review; posted a
  long mixed-language message and submitted a reply; selected My posts in
  English; switched back to Arabic successfully.
- Thread layout: document and message bodies did not overflow horizontally at
  320x700, 375x812 and 768x1024. Composer bottom matched each viewport.
- npm run ios:prepare and npx cap copy ios completed successfully. Package
  consistency tests confirm source assets match the generated iOS bundle.
- Supabase read-only inspection: Google provider enabled; authorization
  redirects to Google's account endpoint with the Supabase callback and state.

## Not yet verified or completed

- Real iPhone Google/Apple login, app lifecycle and software-keyboard behavior
  must be tested on-device. Mock callback tests cannot prove provider login.
- No production accounts/comments were removed; no production SQL was changed.
- No new IPA was built, uploaded or distributed in this batch.
- The rest of docs/BETA_TESTER_AUDIT_2026-10-03.md remains open, including catalog
  content correctness, adult recommendation safety, account deletion reports,
  search/genre blank-screen reports, onboarding clarity and other suggestions.
- Translation coverage was expanded, not certified exhaustive. Source-backed
  chapter dates and some secondary captions still need locale-specific review.

## Release gate

Do not declare all beta problems solved from passing local tests. Reproduce
remaining reports, test native auth with an existing and a new account on iOS,
then prepare a distinct build number before distribution.
