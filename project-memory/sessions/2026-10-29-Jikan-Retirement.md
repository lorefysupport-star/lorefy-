---
kind: session
status: source-and-compatible-service-verified-device-pending
date: 2026-10-29
verified_on: 2026-10-29
source_commit: 74fbee4
---
# Retire the discontinued Jikan public endpoint

Owner asked how to fix failing MAL lookups during the active server/performance
repair. Primary maintainer evidence confirms Jikan public API shutdown on
October 1. This supersedes the earlier temporary-outage inference; it is not
evidence that MyAnimeList itself is unavailable.

[Report](../../docs/JIKAN_RETIREMENT_2026-10-29.md) records exact source references,
provider contract, test command, individual request timings and limits. Tenrai's
Jikan-compatible v1 responses were verified for all six routes Lorefy uses.
Character, cover, growth and chapter modules use the maintained base; legacy
gateway URLs translate safely. MAL IDs, user artwork, account keys and saved
progress remain unchanged. Three new failures were reproduced before the fix;
365 focused checks pass afterward. Browser Explore boots and real character
retrieval returns 82 entries with preserved MAL IDs.

Live public function version 14 changes only the old catalog upstream target,
retaining JWT configuration and path restrictions; requests now return 200 and
invalid paths 400. Seven source assets match both selectively synchronized native
web trees. No native compile, Apple/EAS release, schema or user-data writes.

The isolated worktree starts at the latest UI checkpoint, preserving the original
checkout's pending security work. The unrelated deferred security patch was not
deployed. Installed native clients require separately authorized release work.
General search aggregation and first-result latency remain open; this is mainly
a character/cover/chapter enrichment repair, not full search acceptance.

[[systems/Catalog-Search]] | [[13-Project-Story]] | [[14-Feature-Coverage]] |
[[15-Work-Control]] | [[10-Open-Questions]]
