---
kind: session
status: source-browser-verified-service-limits-open
date: 2026-10-30
verified_on: 2026-10-30
source_commit: 6781dcfb533e26e2174b831ca6a6f6771f248247
---
# Agentic search performance and correctness audit

Owner requested an agentic audit of search speed, API behavior, correct results
and unnecessary processing. Prior direct GitHub commit/push authorization
continues. Latest main6781dcf was fetched before work; newer inbox/import/Storage
repairs are preserved. Three parallel agents owned provider, local-index and UI
paths; root handled live probes, character search, gateway and integration. A
cross-module review caught and corrected an introduced media cache-header issue
before delivery. Existing original-checkout security edits stay excluded.

[Full report](../../docs/SEARCH_AUDIT_2026-10-30.md) links public receipts, browser
images, exact test command, source modules and reproducible benchmark tools.
Canonical sources changed before13 selective web assets were mirrored. Cachev644
and worker imports are aligned. No new runtime dependency, framework migration,
provider enablement, production migration/deployment, native build or upload.

## Verified repair areas

- Catalog data/plan/loader/search-worker reuse index fields and downloads, skip
  queued obsolete input scans, yield1000-row fallback slices and preserve alias
  edits. Full ordered hashes match across7index queries;852568compact-index string fields
  have identical normalization. Coldcatalog675.32→303.80ms; typo373.77→76.49ms.
- API/open adapters preserve alternate/Arabic titles, strong source types,
  Unicode/page-size batch keys, partial/incomplete cache state and honest
  HTTP/GraphQL/shape failures. Public cache reads avoid repeated full parsing;
 100checks59.58→0.45ms. Same-work names preserve IDs, editions and owner fields.
- Explore/User Discovery stop hidden discovery ranking and per-keystroke scans;
  broad34150-row ranking386.78→54.42ms, same orderedIDs. People lookup no longer
  waits for follow hydration and shares duplicate queries. Browser reproduced
  All/الكل mismatch hiding remote failures; canonicalization now shows warning,
  cards and Retry in AR/EN. Stale query and owner guards remain.
- Character system/growth picker avoid full catalog indexing on cache/remote
  misses and reuse normalized titles. Empty-result median565.13→0.01ms; picker
 402.71→153.00ms, same IDs. Book/ambiguity/provider-ID guards still pass.
- Gateway source preserves error Retry-After, no-store on failures and bounded
  catalog-body buffering; five mocked checks pass, including preserved media
  caching. Connected function remains liveversion14: source is not deployed.

Final fullsuite **3111/3111**, exit0. Local browser checks cover8formats,
OnePeice correction, Enter/Escape, People/Media, Arabic author results and
controlled partial failure/retry. Initial isolated helper-fixture failures were
resolved without removing storage/edition assertions. No saved account data
changed; fixtures contain only public metadata and local demo records.

Fresh12publicprobes:11valid200, GoogleBooks429dailyquota. Google already disabled;
optional BookBrainz/Wikidata/GCD bibliography remains production-gated despite
valid public probes. Primary provider responses are checked, not every query or
record. These local CPU/browser receipts do not prove physical-iPhone frame rate,
VoiceOver, peak-load reliability or installed-client delivery. An already-running
stalled shard can still hold its queue until the existing20sdeadline. Broader
full-ingest/recommendation paths and bibliographic data quality remain open.

[[systems/Catalog-Search]] | [[systems/Explore-Works]] |
[[09-Data-Contracts]] | [[13-Project-Story]] | [[14-Feature-Coverage]] |
[[15-Work-Control]] | [[10-Open-Questions]]

Verified repair commits are kept separate and pushed to the search-audit branch:
4b8af4d(localindex),af14009(APIintegrity),ff879ce(UI/errorfeedback),
5ed0e0f(characterbudget),a2e802a(gatewaysource). The final handoff includes the
3111-check combined integration receipt; direct main push is owner-authorized.
