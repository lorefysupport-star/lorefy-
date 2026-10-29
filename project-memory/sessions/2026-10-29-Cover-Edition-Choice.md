---
kind: session
status: source-browser-verified-device-pending
date: 2026-10-29
---
# F13 cover source and edition choice

Continues [[2026-10-29-Library-Shelf-Acceptance]] under
[[19-UI-Execution-Control]]. Existing Plugin Management, UI/UX Pro Max,
debugging/test-first and browser tools used. No dependency added.

## Change

The picker reduced provider responses to image URLs and numbered labels,
discarding known edition metadata. `LorefyCoverAPI.choices` now shares the
same cached lookup as legacy `alternates` and returns isolated metadata copies.
Existing URLs, provider selection, title matching, request limits and string-array
API remain. No extra metadata endpoint or provider permission is introduced.

- Open Library work editions: edition key, publisher, date, language and ISBN.
- Open Library title search: only the provided cover-edition key for its named
  cover; unrelated search ISBNs are not attributed to that edition.
- Google Books: record ID, publisher, date, language and ISBN from the same reply.
- MangaDex: each cover's own volume and locale, not a guessed work-wide value.
- Conflicting metadata for a shared image is omitted, not assigned to one edition.
  Unknown values remain unknown; image host is a source, not an edition.

`normalizeCoverChoices` in the compiled app preserves details through dedupe and
media-proxy rewriting. `LorefyWorkPanels.Cover` shows details on each candidate
and the selected preview, with explicit unprovided-edition copy. Metadata is
text, never HTML. Missing metadata does not invent a volume from the candidate
number. No cover choice changes the work ID, library, rating or progress.

## Verification

Seven new source tests were introduced after observing the missing API/metadata
path; initial suite failed before implementation. Existing preview/apply failure,
double-submit, image-error and owner guards remain covered by their tests.
Fresh complete suite:2973/2973,0 failures at the GitHub checkpoint.

External evidence: `artifacts/cover-f13-20261029/browser.json`,108/108 checks,
AR/EN x pink/dark x320/390/768. The real detail picker was exercised in isolated
demo contexts with controlled provider JSON and local bitmap image responses:
preview does not save; Escape restores focus; cancellation retains the old cover;
save uses the exact original image URL under the original work ID; reopen/reload
retain the selected cover; Restore removes only its custom cover; reading,
favorites and review storage strings remain unchanged. No page errors recorded.

Cache: `lorefy-v636-cover-editions`; six runtime files selectively synchronized.
This is local acceptance, not verification of live provider metadata, image
rights, native photo permissions, cloud durability or physical iPhone behavior.
The existing image rejection states remain; no automatic image substitution added.

[[systems/Explore-Works]] | [[systems/Catalog-Search]] | [[09-Data-Contracts]] |
[[15-Work-Control]] | [[10-Open-Questions]]
