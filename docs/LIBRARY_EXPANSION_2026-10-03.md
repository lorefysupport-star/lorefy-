# Library expansion and source gates

This is a local catalog update, not a TestFlight upload. The definitive current
counts are generated with `node tools/audit-library-coverage.js` in
`output/catalog-bulk/coverage-final.json`. Each section is audited against a
7,000-work target. Unmet targets remain explicitly unmet.

## Import routes

- Open Library monthly work and author dumps, streamed through gzip. Editions
  are rejected. Author references must resolve to actual names. New records
  require source covers; missing ratings, pages, or chapter totals stay missing.
- Text imports use a conservative publication cutoff of 2021. Comics may have
  newer or undated source records. Declared AI and explicit metadata are rejected.
  This screening cannot certify human authorship or identify undeclared AI text.
- MangaDex metadata API, safe/suggestive classifications only, author and cover
  relationships required. Source-supplied Latin titles and alternate titles are
  retained. No reading chapters or scanlation pages are collected.
- Source MAL/AniList identifiers are retained from MangaDex links to merge
  cross-provider identities; these are not additional AniList API requests.

## Source conditions

- [Open Library bulk access](https://openlibrary.org/developers/api#bulk-access)
  requires dumps instead of mass API harvesting.
- [Open Library dumps](https://openlibrary.org/developers/dumps) describe the
  source work/author record formats. Metadata availability does not grant new
  rights to third-party cover artwork.
- [MangaDex acceptable use](https://api.mangadex.org/docs/api.yaml) requires
  attribution and prohibits advertising/paid services. This integration is for
  the current free beta only; it must be replaced or separately authorized before
  monetization. Every imported record carries source attribution and provenance.
- [AniList terms](https://anilist.gitbook.io/anilist-apiv2-docs/docs/guide/terms-of-use)
  prohibit mass harvesting and restrict competing tracking services. No AniList
  mass collector was used for this expansion. Existing integration approval is a
  separate release gate, not implied by the current import.
- Comic Vine, Metron and Grand Comics Database were investigated, not imported
  without verified access/terms. No paid service was purchased or new account made.

## Correctness and release limits

Known duplicate identities are merged using the existing identity system. A
provider work can still be a translation or collection without cross-language
canonical links. Counts must not be advertised as perfectly deduplicated global
series counts. Books about comics and fiction criticism are classified as books,
not used to inflate comics/novel quotas.

The browser's large `splice.apply` identity rewrite was replaced with indexed
assignment, preserving the array object without exceeding mobile argument limits.
The catalog continues to start with one route-relevant shard, then loads and
canonicalizes the rest in its worker. Full-catalog memory and launch behavior
still need physical-iPhone verification before a release-readiness claim.

The author search now tolerates punctuation and separated initials. George R. R.
Martin also has a deliberate Arabic search alias. Other author aliases come from
the source author records. Search remains across all work types by default.

## Verified snapshot

The final audit contains 96,512 canonical records after 691 policy exclusions
and 1,290 known duplicate merges. Counts: Manga 11,057; Manhwa 9,241;
Manhua 7,078; Comics 16,113; Novel 23,551; Book 26,959;
Light Novel 548; Web Novel 1,965. Six of eight targets are met, not eight.

All 580 automated tests pass after native asset preparation and copying.
Browser verification loaded all 121 shards, displayed Martin author results
with source covers, and recorded no console errors or horizontal overflow.
This is not physical-device performance certification or a TestFlight upload.

## Import commands

```powershell
node tools/import-openlibrary-dump.js
$env:LOREFY_MANGADEX_NONCOMMERCIAL='1'
node tools/import-mangadex-metadata.js
node tools/enrich-mangadex-links.js
node tools/reclassify-bulk-library.js
node tools/build-catalog-map.js
node tools/audit-library-coverage.js
```

Optional `LOREFY_BULK_TYPES`, `LOREFY_DUMP_SECONDS` and `LOREFY_BULK_CANDIDATES`
bound the import. Cached dumps are identified by date. If the budget stops a
stream, its report says `complete: false`; that is not a complete source census.
Install locks serialize shard writes. Re-imports compare against the current
bundled catalog before adding records. Interrupted API runs reuse cached pages.
