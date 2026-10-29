---
kind: session
status: source-browser-verified-device-pending
date: 2026-10-29
---
# F08 search edition groups

First bounded task after [[19-UI-Execution-Control]] reset. Existing Plugin
Management, UI/UX Pro Max, Apple interaction guidance and test-first workflow;
no dependency installation. Local only, no GitHub, native build or service write.

## Delivered behavior

- Global and format-scoped media searches present matching edition records as
  one display group with a separate Editions action. The chooser shows each
  original record/cover with publisher, publication date, language, ISBN and
  source when provided. Selecting a record calls existing onWork with its own ID.
- Existing sameWork/catalog organization is unchanged. Grouping is not a data
  merge: it never remaps reading state, ratings, covers, favorites or identities.
  A shared Open Library work ID is a strong link. Otherwise grouping requires
  literary format, exact normalized title/author and a known subtitle in an
  explicit edition record. Unknown author/subtitle, different formats, numbered
  volumes/issues and adaptation/abridgement/collection markers remain separate.
  Translated titles require explicit linkage, not fuzzy title inference.
- Google mapper now retains subtitle/publisher/language/publicationDate already
  in its response. It previously dropped that context. No endpoint, provider
  policy, catalog regeneration or additional network lookup was introduced.
  Old cached records lacking those fields intentionally remain separate.
- Group identity, representative and order remain stable within the same
  query/filter/owner context as later sources arrive. New groups append. A44px
  action slot reserves height; single-record controls are hidden. Counts use
  AR singular/dual/plural and English singular/plural. Paging counts groups.
- Chooser snapshots its records while open; incoming results do not replace
  focused choices. Escape/close returns focus, keeps query/filter/scroll and
  owner/query changes close obsolete edition dialogs. Background uses existing
  isolation/focus-trap behavior. No default edition is stored.
- Chooser-only styling fixes inherited forced-dark surfaces with pink-theme
  text and a low-contrast Close icon. Original page/other dialog styling remains.

## Verification and limits

-13 regressions cover grouping/nonmutation, ambiguity boundaries, explicit
  linkage, late order/representative, IDs, count forms, existing sameWork guards,
  mapper metadata, picker integration/theme and controlled provider ingestion.
  Initial tests failed before implementation; later theme/count assertions were
  also captured red. Focused related suite54/54; complete suite2963/2963.
-99 controlled browser cases, AR/EN x320/390/768, pink/dark. Actual Explore
  component mounted with fixture props and copied current theme tokens. Work
  navigation is a spy, not a real rating/library action. Checks include group
  boundaries, native sibling actions,44px target, loaded cover pixels, chooser
  metadata, tab trap, frozen list, exact chosen ID, focus return, stable scrolled
  late results, filter/query preservation, owner close and unchanged saved reading
  keys. Global paging and format-search chooser exercised as extra cases.
- Minimum measured metadata contrast5.33:1; title>=4.5 and Close>=3 across six
  fixtures. Screenshots captured after the opening transition, not mid-animation.
  Early scrolled-case diagnostics sampled a still-running smooth scroll; fixture
  positioning now uses instant scroll before testing late-result invariance.
  No application scroll workaround was added to satisfy that diagnostic.
- Five web/entry assets mirrored to both runtime copies, SHA256 and JS parsing
  verified. Cache lorefy-v634-search-editions; changed key20261029-search-editions-v1.
  Existing byline extraction harness updated for the optional edition parameter;
  unrelated Work stylesheet key was retained rather than broadly versioned.
- Evidence outside repo: `artifacts/search-editions-20261029/` contains browser
  script/results/screenshots, full/focused logs, failed theme/scroll diagnostics
  and verification. Initial red log: `artifacts/search-editions-red.log`.
- Not real provider/gateway acceptance, bibliographic identity certification or
  physical-iPhone validation. Provider entries are shown with original IDs and
  ISBNs; the UI does not certify every source record as a distinct physical print.
  Data without a safe link is deliberately not grouped. No real account changed.

## Next

F08's scoped local journey is delivered. Do not reopen it as another series of
button/image micro-batches. Next is F12 Library shelf/showcase count acceptance;
F07 image remainders remain one deferred task. Live/native gates stay separate.

[[19-UI-Execution-Control]] | [[13-Project-Story]] | [[14-Feature-Coverage]] |
[[systems/Catalog-Search]] | [[10-Open-Questions]]
