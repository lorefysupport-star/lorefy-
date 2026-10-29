---
kind: session
status: local-verified
date: 2026-10-26
aliases: ["open catalog", "missing works", "BookBrainz", "Wikidata", "GCD"]
---
# Open Catalog Federation

Owner requested all four improvements/sources. Existing dirty local UI/frame
changes were preserved. No GitHub push, production deployment/migration or
Apple build. See [implementation and production gates](../../docs/OPEN_CATALOG.md).

## Changes

- Existing search adds bounded BookBrainz/Wikidata/GCD alongside Open Library;
  fixed-host gateway, rate limits, single-flight cache, queue/response/deadline
  bounds and server-only credentials. Google stays disabled after quota failure;
  its collected-book query filter was repaired, not its quota.
- Stable source IDs retain work/edition/group/series/collection scope and
  ISBN/issue/volume distinctions. Source/license attribution survives merges.
- No invented chapter totals, publication completion, ratings or summaries.
- Metadata-only records cannot auto-fetch a title-matched cover from another
  edition. Search cards retain readable title/source captions; manual artwork
  selection is not disabled.
- Lazy input resumption and bootstrap guards preserve the first typed search;
  stale results are discarded, partial batches retry after a minute.
- Explore has account-scoped local reference-link drafts with reload persistence,
  delete/export and honest unsent status. Cloud submission is NOT implemented.
- Runtime changes selectively mirrored into both shipped web directories.

## Evidence

Full suite: 2517 passed, zero failures. New provider/routing/gateway/request
suites plus cover-lock regression passed. Browser checked dark form contrast,
immediate title autofill, draft persistence/removal, early search completion,
GCD work detail attribution and isolation from People search. Rapid switching
People -> Media now clears stale busy state and resumes the current media input;
the browser returned to seven results, not an indefinite search message.

Live gateway returned 200 for all four sources. Integrated probes returned 19 GCD
Watchmen records, one Wikidata Lord of Mysteries web-novel entity, four
BookBrainz Watchmen bibliographic records and 48 Open Library Golden Son hits.
These are query hits, not unique verified works or complete coverage.

Browser: year-separated Absolute Watchmen results opened the 2005 collection as
`gcd-series-21965`, with GCD/license attribution. A demo missing-work draft
survived reload and was removed through the UI. Raw screenshots/logs are outside
the vault under the task's artifacts directory.

The older 8795 server could not be restarted through the available execution
path. New hidden local server 8796 has the added routes. Use its preview.

## Gates

Production gateway/configuration, GCD account/terms approval, authenticated
request submission/review and real-account cross-device checks remain.
New sources fail closed outside approved local/production configuration.
[[systems/Catalog-Search]]
