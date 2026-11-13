# Comics Coverage and Search, v717

## Findings

The existing remote configuration disables Google Books and sets
`openSourcesEnabled:false`; BookBrainz, Wikidata and GCD have localhost/proxy
gates. This pass does not certify installed-client gateway availability. The all-format search only
used a general bibliographic pass for comics; ambiguous titles could be buried
under literary matches. The local raw index's format labels are not a count of
unique, correctly classified comics: runtime taxonomy can reclassify them.

The browser also reproduced an independent access failure: return from a work,
type a new query immediately, and the queued80ms route refresh clears the newer
local search. With external requests blocked this produced an empty/error view
even though the new comic existed in the local search index.

## Source Addition

- One bounded Wikidata Query Service snapshot adds2,000 distinct Wikidata IDs
  explicitly classified as comic-book series (`Q14406742`); direct manga class
  `Q8274` is excluded. No claim of exhaustive international comics coverage.
- Source/license/query/input hash/import time and parts are preserved in
  `uploads/catalog-sources/wikidata-comics.json`. Wikidata structured data is
  CC0: https://www.wikidata.org/wiki/Wikidata:Data_access
-1,559 imported title strings did not exactly match normalized title/Arabic title/
  alternative-title strings in the previous index. This is a textual comparison,
  not a semantic unique-work or new-user-demand metric.
- Seven new source/runtime parts164-170, at most300 records each. Compact payload
  totals1,168,721 bytes and is demand loaded; the original163 runtime parts remain
  byte-for-byte unchanged. Search index count121,920 to123,920, now21,616,024 bytes.
  The enlarged index still downloads on search, not at initial application boot.
- Preserve stable `wd-Q...` IDs, `catalogLevel:series`, `metadataOnly`, source URL,
  license and Wikidata ID through compaction and future regeneration. Do not turn
  an imported series into individual issues or merge it by title alone.
- Unknown author, date, completion, cover, chapters and rating are not invented.
  The simple query intentionally supplies identifiers/titles rather than a costly
  full bibliography. These additions remain metadata-only and do not assert an
  adult/safety classification. Unclassified items do not become recommendations.

Importer: `node --use-system-ca tools/import-wikidata-comics.cjs --fetch <json>`;
review the snapshot, then `--input <json>`. The importer refuses existing output
parts and never withdraws old records. It refreshes only new compact parts and
the aggregate manifest. Run `node tools/build-catalog-map.js` and
`node tools/build-catalog-search-index.mjs` afterward. Review source provenance
before any later snapshot; this import is not a scheduled crawl.

## Search Repairs

- Open Library comic queries add a comics/graphic-novel subject scope. Treat
  punctuation literally rather than as a Solr field/group. If the full scoped
  query exceeds the existing160-character gateway budget, retain the full literal
  title without the additional subject clause; never truncate the user's title.
- All-format search adds one Open Library comic pass, with the existing maximum
  of two format jobs in flight. Do not repeat the gated/authenticated providers.
- Comic batch cache identity changes independently so old broad results cannot
  mask the repaired pass. Existing non-comic query/cache behavior remains.
- Delayed Explore route work cannot clear a search issued after navigation;
  leaving Explore still cancels its query.
- Version the new search index, map and workers separately from unchanged bootstrap
  shard URLs. Cache `lorefy-v717-comics-coverage`; selectively mirrored web assets.

## Verification

Added regression coverage for scoped/general search, literal punctuation, long
queries, bounded/imported provenance, compact fields, the full2,000-record
snapshot and return-navigation cancellation. Original failures were observed
before repairs. Existing focused taxonomy, all-format, cancellation, source-
policy, package and offline version tests were also run.

Four actual browser searches opened their real imported detail records with
external/API requests blocked: Radiant Black, Paper Girls, Black Badge and
Supergirl: Woman of Tomorrow. Return and immediate retyping were exercised.
Source URL, CC0, series level, original title and absent invented score/chapters
were retained. No sampled page exceptions. Local browser proof is not native
device or every-title acceptance.

Two live human-scale Open Library probes returned HTTP200: Saga364 hits and
Black Hammer10 hits for the subject-scoped query. Counts are provider hits,
not unique series or complete coverage. No bulk Open Library harvesting.

Local evidence stays in the parent workspace's `output/playwright/comics-v717-*`
and `output/wikidata-comics-20261113.json`. Final complete suite:3,582 passed,
zero failed after final source/data mirroring. The43-case final package/version/
coverage/navigation check also passes. Memory audit:381 notes,886 source files,
fresh snapshot, no issues or orphan notes.

## Remaining Gates

Metadata-only entries have an honest missing-cover state and may lack creator/
publication information. The snapshot is bounded to2,000 series. This does not
enable GCD or the other gated sources for production; those still need approved
gateway/account configuration. No provider account, production deployment,
Supabase change, native binary or Apple upload was made.

Source research: [Open Library Search](https://openlibrary.org/dev/docs/api/search),
[API usage and limits](https://openlibrary.org/developers/api),
[GCD API](https://github.com/GrandComicsDatabase/gcd-django/wiki/API).
Comic Vine was not added: its [official API terms](https://comicvine.gamespot.com/api/)
restrict use to non-commercial purposes and redistribution. This report records
the published terms, not legal approval of a future integration.
