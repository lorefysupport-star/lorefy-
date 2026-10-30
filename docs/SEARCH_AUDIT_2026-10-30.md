# Search speed, correctness and provider audit — 30 October 2026

Owner requested an agentic audit of everything related to search, including
unnecessary processing that causes lag. Three parallel agents inspected provider
adapters, local indexing/workers, and search rendering/People lookup. Root
verified live public services, repaired adjacent character search and gateway
handling, reviewed integration, and ran the complete application suite. A second
cross-module review caught a media cache-header regression before delivery; it
was fixed and protected by a regression test.

Baseline is the freshly fetched GitHub main `6781dcfb533e26e2174b831ca6a6f6771f248247`,
including the newer import, inbox and Storage changes. The earlier October 29
speed repair remains intact. This work uses the existing React/Capacitor stack,
with no new runtime dependency or additional search service.

## Measured unnecessary work removed

These are local Node CPU measurements, **not physical-iPhone or end-to-end
network promises**. Actual catalog/index samples contain121,920 records.

| Operation | Before | After | Evidence |
| --- | ---: | ---: | --- |
| Cold Naruto catalog search | 675.32ms | 303.80ms | [before](../qa/search-audit-cpu-before-20261030.json), [after](../qa/search-audit-cpu-after-20261030.json) |
| Warm relevance sort, broad `the`,34,150 matches | 386.78ms | 54.42ms | [ranking](../qa/search-audit-ranking-20261030.json) |
| Typo suggestions, `One Peice` | 373.77ms | 76.49ms | [index before](../qa/search-audit-index-before-20261030.json), [after](../qa/search-audit-index-after-20261030.json) |
| Repeat preparation of unchanged records | 649.82ms | 41.26ms | CPU receipts above |
| Empty character result, median of3 | 565.13ms | 0.01ms | [character/picker](../qa/search-audit-character-20261030.json) |
| By-work character picker, Naruto | 402.71ms | 153.00ms | character receipt above |
|100 public-cache state checks,420,354-character fixture | 59.58ms | 0.45ms | [cache](../qa/search-audit-cache-20261030.jsonl) |

Result equivalence is checked separately from speed: all seven compact-index
query hashes retain complete ordered shard counts/scores and suggestions; all
three relevance-query hashes retain ordered IDs; four character work-picker
queries retain the same12 IDs. All852,568 flattened compact-index string fields (including aliases) normalize
identically to the baseline: [receipt](../qa/search-audit-normalization-20261030.json).

Concrete causes and changes:

- `lorefy-catalog-loader.js` downloaded and parsed the full discovery index for
  every fallback query. It now shares one successful index; failed attempts
  remain retryable. Main-thread fallback yields every1000 records and stops
  obsolete work. The measured maximum Node slice was9.13ms across121 yields;
  this is not a Safari frame-time certification.
- `lorefy-catalog-search-worker.js` skips superseded input queries queued during
  first index loading, while preserving independent author lookups.
- `lorefy-catalog-data.js` validates reusable indexes without rebuilding raw
  field arrays/signatures for every unchanged record. ASCII-equivalent fast
  normalization preserves the multilingual behavior; alias mutations invalidate
  the cache. `lorefy-catalog-plan.js` reuses source fields for typo suggestions.
- `lorefy-explore-studio.js` stops computing hidden personalized rankings,
  shelves and featured sorting during active searches. Three rapid format
  keystrokes previously performed three full scans; now none occurs until the
  query settles, followed by one. Relevance reuses normalized fields and cached
  comparator keys: the broad-query Unicode normalization count fell116,183→1.
- `lorefy-user-discovery.js` starts reader matching independently of follow
  hydration. Identical simultaneous queries share one request, bounded by a
  retryable deadline. Duplicate reader IDs are removed; late follow hydration
  preserves intervening follow choices. People search omits the unneeded follow
  lookup, and existing backend ownership guards remain authoritative.
- `lorefy-character-system.js` no longer classifies the whole catalog for an
  empty cast cache, an empty provider result or an already inactive caller.
  `lorefy-growth-features.js` reuses the shared index in the By work picker,
  normalizing titles only for actual hits. Book exclusion, title ambiguity,
  conflicting provider IDs and saved favorites remain protected.

## Search correctness repairs

`lorefy-api-catalog.js` and `lorefy-open-catalog.js` now:

- Retain AniList/MangaDex alternate titles and Arabic names, so a provider match
  does not disappear when local filtering evaluates a different display title.
  Existing proven same-work records gain names without replacing curated Arabic
  labels, IDs, saved ratings, progress, artwork or edition identity.
- Respect known source-format classification instead of relabeling every book
  result to whichever format the user selected. Unclassified metadata can retain
  the requested scope; a known contradictory format is not silently converted.
- Distinguish HTTP/GraphQL/malformed provider failures from valid empty arrays.
  Cached partial results retain source errors and their retry semantics.
- Preserve Unicode query identity and include requested page size in cache keys.
  Evicted/incomplete batches cannot masquerade as complete14-day results.
- Reuse parsed public metadata rather than reparsing and serializing the entire
  cache on each state read. External edits/policy replacement invalidate it;
  persisted public snapshots are detached from mutable live records.
- Respect bounded per-provider rate-limit cooldown, including Retry-After, and
  avoid duplicate provider entries. No provider coverage was enabled blindly.

Actual browser verification exposed an additional cross-module defect:
`formatKey('All')` and `formatKey('الكل')` differed, although the compiled app
uses the Arabic All value in both languages. Remote waiting/error/partial events
therefore failed to match global search. They now share the existing Arabic
canonical value. Available cards stay visible with a partial warning and Retry;
a total connection failure cannot become a trusted “no matching results.”

## Live API observations

[Public probe receipt](../qa/search-audit-providers-20261030.json) records each
status, response shape, count and elapsed time. These are low-volume observations
using public metadata, not an authenticated-account or peak-load audit.

| Source/path | Fresh result | Current application scope |
| --- | --- | --- |
| AniList work and character search |200, valid records | Enabled |
| MangaDex title search |200, valid records | Enabled |
| Open Library English/Arabic search and exact-work editions |200, valid records | Enabled |
| Tenrai MAL title and character-name search |200, valid records | Enabled |
| Wikidata search |200, valid records | Character enrichment route; bibliographic search locally previewed |
| BookBrainz search and one edition detail |200, expected array/alias/author-credit shape | Local preview; production gateway remains gated |
| GCD search with JSON Accept header |200,50 records | Local preview; production credentials/gateway remain gated |
| Google Books search |429, daily quota exceeded | Already disabled in current client config; not declared repaired |

The first diagnostic GCD request lacked an Accept header and returned its HTML
API browser. A JSON Accept request verified the actual API; the existing local
production-shaped adapter already sends this header. Probe tooling now does too.
BookBrainz edition metadata included Dune/Frank Herbert and a release date; this
checks the exercised contract, not every bibliographic record's correctness.

Open Library's current [API guidance](https://openlibrary.org/developers/api)
requests caching and bounded human-initiated traffic; this repair removes
redundant requests rather than bypassing upstream limits. The maintained MAL
replacement's [contract](https://api.tenrai.org/documentation) remains in use.

## Gateway source and deployment boundary

`supabase/functions/lorefy-public/index.ts` now prepares retryable error behavior:
failed upstream requests use no-store, Retry-After/rate-limit headers are preserved
and exposed to browser callers, and chunked catalog bodies stop at4MiB rather
than buffering the complete upstream body first. Successful metadata caching and
successful cover/media caching retain their existing policies. Five executable
mocked-request checks cover these contracts.

**This gateway change is source-tested, not deployed in this round.** The
connected read-only inspection still reports live public function version14.
The current live Google429 response still carries its old public cache header.
Existing unrelated gateway/security differences are not auto-deployed, and the
production gates on optional providers are not weakened. No schema migration,
credential operation or production user-data write occurred.

## Browser and complete verification

[Browser receipt](../qa/search-audit-browser-20261030.json) covers local demo
searches in all eight formats: Naruto, Solo Leveling, Tales of Demons and Gods,
Watchmen, Dune, Atomic Habits, Overlord and Shadow Slave. Atomic Habits initially
waited for its catalog shard and then appeared; other captures also include
honest in-progress states. This does not certify every catalog record or title.

Also verified: typo suggestion One Peice→One Piece, native input retained while
typing, Enter commit, Escape back/cancellation, People/Media transitions, Arabic
interface author search `نجيب محفوظ`, and a controlled503 source alongside
successful MangaDex metadata. The latter reproduced the All mismatch and, after
repair, showed the available card plus warning/Retry in both interfaces. Retry
was exercised. Screenshots: [Arabic](../qa/search-audit-arabic-20261030.png),
[partial results](../qa/search-audit-partial-20261030.png). Temporary fixture
sources are removed after verification. No production accounts or favorites
were changed.

Fresh final full suite: **3111 passed,0 failed**, exit0, using
`node --test --test-concurrency=1 tests/*.test.js`.
[Full receipt](../qa/search-audit-tests-20261030.txt). New regressions include
provider integrity, local efficiency, UI work budgets, character work budgets,
and gateway resilience. Existing isolated helper fixtures were updated for new
helper dependencies without dropping their edition/storage assertions. Source
and generated-asset equality checks are part of the full suite.

Thirteen changed web assets are selectively synchronized into both native web
trees, with refreshed URLs/imports and service-worker cachev644. This is source
synchronization, not a native build, EAS/Apple submission or installed-client
update. Package manifests/lockfiles, art, decorations and frozen artifacts remain
unchanged.

Remaining limits: Google quota, production enablement/credentials for optional
sources, physical-device/VoiceOver/frame-time and peak-load acceptance, and
bibliographic correctness of unreviewed records. A genuinely stalled already
running catalog shard can still hold the shared shard queue until its existing
20-second deadline; queued obsolete generations stop afterward. Full ingest and
recommendation behavior beyond the audited search paths is not claimed free of
all possible performance issues.

Reproduction tools: `tools/benchmark-explore-performance.cjs`,
`tools/benchmark-catalog-local-search.cjs`,
`tools/benchmark-search-ui-work.cjs 6781dcf`,
`tools/benchmark-character-search.cjs 6781dcf`,
`tools/benchmark-search-api-cache.cjs 6781dcf`, and
`tools/audit-search-providers.cjs`. The compact-index benchmark accepts saved
baseline data/plan paths through its documented environment variables.
