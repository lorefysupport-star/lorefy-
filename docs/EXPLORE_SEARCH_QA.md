# Explore Types and Search

Date: 2026-10-26. Local source only. No GitHub push, native build, Apple upload,
production deployment, schema or billing change.

## Changes

- Eight format tiles now use actual catalog artwork with separate glass labels,
  consistent 208px outer height, two columns on phones and four on desktop.
  Legacy grid-row assignments no longer reverse the artwork and label.
- Search opens with catalog suggestions rather than a blank screen. Media,
  People and My lists remain separate. My lists searches the current account's
  lists, not the public list directory.
- Recent searches are explicit submissions or opened results, never keystroke
  logging. They stay in sessionStorage, scoped to the account, capped at eight,
  deduplicated by normalized query/mode/format and clearable. Nothing is added
  to cloud/account sync. Invalid, expired or inaccessible storage is tolerated.
- Most relevant ordering prioritizes exact titles, aliases and title prefixes
  before author/popularity ties. Arabic diacritics are normalized. Existing
  matching, canonical IDs, editions and content-policy admission remain intact.
- Search filters combine format, genre, publication status and sort. Local and
  remote catalog requests use the selected format. Results render in batches of
  36 with explicit Show more rather than silently cutting off at 120.
- Idle, short query, loading, updating, partial failure, failure and genuine zero
  results have distinct states. Failed sources do not erase available results.
  Retry is query/account generation guarded. People search can surface live
  failures without changing the default directory fallback contract elsewhere.
- Separate Cancel, a single field focus ring, clear action, automatic text
  direction and RTL/LTR arrow-key tab navigation complete the search controls.

## Verification

New relevance/history/state tests and strict-directory regressions were observed
failing before implementation, then passing. Existing search-provider privacy,
catalog matching/ranking and Explore regressions were rerun. The final complete
suite: **2549 passed, 0 failed**, exit 0 (final run, 64.2 seconds).
The first complete run had one outdated isolated-function test harness missing
the new cancellation dependencies; that harness was updated to assert those
dependencies, then the entire suite was rerun successfully.

Authorized alternative Playwright used an isolated local demo browser. Production
Supabase requests were blocked. Browser runtime checks verified:

- All eight type buttons open the correct format page and return correctly.
- No horizontal overflow or reversed tile rows at 320, 390 and 1024px. Search
  also checked at 430px. English search checked at 320 and 1024px.
- Actual Berserk title search, Novel-only filtering and reset, recent search
  insertion and clearing, and pagination from 36 to 72 cards.
- People/My lists probes did not call the catalog loader with their query.
  Existing provider input-privacy regressions remain passing.
- Injected reader-directory failure and recovery show error/retry then results.
  These are temporary browser fixtures, not production users or service proof.
- A delayed failed media retry cannot overwrite the cleared idle screen.
- Arabic and English keyboard tab directions, mobile phone-preview iframe, and
  no pageerror events in the tested flows.

Screenshots and raw test logs stay in the parent task's artifacts directory,
outside the repository and project vault. Runtime web files are selectively
copied to the two existing mirrors; this is not native preparation or a build.

## Limits

Real-account availability, Supabase quota/auth recovery, external-provider uptime
and iPhone keyboard/performance remain separate checks. This redesign does not
claim those services are fixed. Catalog art still uses the existing source,
rights-safe and unavailable-cover fallbacks; no covers or metadata were invented.

Project record: ../project-memory/sessions/2026-10-26-Explore-Types-Search.md
