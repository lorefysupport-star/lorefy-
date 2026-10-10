# Lorefy performance and catalog verification

## Scope
Local app and synchronized iOS web assets. No TestFlight build was uploaded in this session.

## Measured results
Measurements are JavaScript computation time on this Windows PC with the complete browser catalog loaded, not total launch/network time or physical-iPhone measurements.

| Operation | Before | After |
| --- | ---: | ---: |
| Uncached personalized recommendation computation | 5,983 ms | 39-121 ms across observed runs |
| Repeated recommendation request | Not measured | About 0.1 ms |
| First full-catalog author query | 4,118 ms | 82-90 ms |

The later browser runs contained 113,111 records including dynamically loaded provider entries. Timing varies with garbage collection, device load and browser state. These figures are not a guarantee of sub-100-ms end-to-end interactions.

## Changes
- Bounded top-K ranking instead of sorting the full library for home and recommendation rows.
- Reusable genre/author features and content classification prepared ahead of ranking.
- Catalog parsing, safety/quality checks, canonicalization and search indexing in a worker.
- Lightweight catalog cards; full source descriptions hydrate on work-detail navigation.
- Search sorting evaluates confidence once per record, retaining stable tie ordering.
- Smaller cover rows with full lists still accessible through Show All.
- Per-reader review isolation, stable backend account IDs, and cache invalidation when library statuses change.
- Source-only runtime JSON caching and automatic runtime generation before iOS asset preparation.

## Catalog additions and coverage
- Added 13,154 light-novel records and 1,820 documented web-original records.
- Canonical bundled coverage: 13,702 Light Novels; 3,785 Web Novels; 7,078 Manhua.
- Bundled total after known identity merges and exclusions: 111,486.
- Manhua did not gain new verified records from the additional source scan; this expansion request remains incomplete.
- Web Novels still fall short of the earlier 7,000-per-section target by 3,215.

Source: [RanobeDB official database dumps](https://ranobedb.org/database-dumps), metadata under ODbL 1.0 / DBCL 1.0. The attributed adaptation is available at `uploads/catalog-sources/ranobedb.json`. Web originals require an explicit source URL, not just a genre guess. Safe cover metadata does not imply that a work has a verified safe-content classification; unclassified works remain excluded from automatic recommendations.

Explicit/adult and declared AI metadata are screened. Publication cutoffs and labels cannot certify human authorship or detect undeclared AI content.

## Verification and remaining limits
- Full Node test suite: 596 passed, zero failures.
- New-source covers verified in the 390 x 844 browser and production media gateway (HTTP 200, image/jpeg). The deployed gateway change only adds the exact RanobeDB image host; existing authentication configuration and media limits are unchanged.
- Full detail synopsis remained hydrated (758 characters) after the background catalog completed; absent source scores no longer crash the detail page.
- iOS web preparation and Capacitor asset copy succeeded.
- Mobile-size browser search verified at 390 x 844 with no horizontal page overflow.
- Account personalization tests verify distinct fantasy/romance rankings and exclusion of already-read work IDs.
- No physical iPhone performance, native release archive, memory ceiling, or slow-network guarantee verified.
- The large catalog still loads in the background; first launch, remote images and uncached detail downloads take time.
