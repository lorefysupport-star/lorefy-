# Open Catalog Integration

## Local Scope

The existing search federates Open Library, BookBrainz, Wikidata and Grand
Comics Database (GCD); this is not a bulk import or production deployment.
Existing AniList/MangaDex paths are unchanged. New adapters are fail-closed
outside loopback unless `openSourcesEnabled` and an approved
`openSourcesProxyUrl` are configured.

Preview: `http://127.0.0.1:8796/index.html?preview=demo&demo=ready&route=discover&adaptive=1`.
Start with `node tools/lorefy-api-server.js 8796`. Port 8795 has an older server
and does not expose the added routes. Do not mistake it for the new gateway.

## Sources And Identity

| Source | Coverage | Identity |
| --- | --- | --- |
| Open Library | Books, prose, graphic collections | Work ID and existing subject taxonomy |
| BookBrainz | Works, editions, edition groups | BBID plus entity scope; unknown types stay Book |
| Wikidata | Literary entities including web novels | QID and instance classes; animated adaptations excluded |
| GCD | Comic series and collected editions | Series ID, scope and year; variants are not chapters |

New adapters import metadata, not cover images or full texts. Automatic cover
resolution is disabled for these metadata-only records to avoid title-matched
images from a different edition. Explicit user-selected artwork remains available.
Search results show readable titles and source captions. Missing ratings,
summaries and chapter totals remain absent/zero. Unknown publication status is
not completed. IDs do not replace reading-progress keys. Conflicting scopes,
ISBNs and issue/volume numbers block title-based merging. Merged metadata
retains every source/URL/license attribution, displayed in work detail tools.
Coverage is improved, not exhaustive; missing covers do not mean missing works.

## Bounded Gateway

`tools/catalog-provider-gateway.js` fixes hosts/paths, spaces upstream requests,
coalesces identical requests, caches successful searches for 15 minutes and
BookBrainz entities for a day, respects 429 cooldowns, and limits the queue to 24.
Responses are capped at 3 MiB; upstream timeout 10 seconds, browser timeout 18 seconds
per request. Obsolete queries cannot ingest late results. Partial result batches
expire after a minute rather than hiding a failed source for days.

GCD anonymous testing is local-only and capped at 20 upstream requests/hour.
Production requires approved credentials. Server environment names only:

- `GCD_API_USERNAME`, `GCD_API_PASSWORD`.
- `GOOGLE_BOOKS_API_KEY` for independently approved optional Google access.

Never put these values in browser configuration or Git. Client-supplied Google
keys are stripped. Google Books stays disabled after the observed quota issue;
its comics query now uses `printType=all`, not magazines only. Verify key/quota
before enabling it. Local budgets do not supersede provider terms or limits.

## Missing Work Requests

Explore offers reference-link drafts scoped to the current account. The form
explicitly states that drafts are on this device, not sent/published. It supports
reload persistence, deletion and JSON export. Account changes block stale
saves/exports/deletes; storage failures do not show success. No work is inserted
automatically. Authenticated cloud submission, ownership policies, moderation,
duplicate review and delivery acknowledgement remain unimplemented gates.

## Production Checklist

1. Review current provider terms, attribution and permitted workload.
2. Host the bounded gateway and configure GCD's approved account.
3. Approve/configure the production URL without shipping credentials.
4. Implement authenticated missing-work submission and review.
5. Verify real-account cross-device persistence and mobile networks.
6. Audit existing AniList use separately against its tracker restrictions.

Primary references: [Open Library](https://openlibrary.org/developers/api),
[BookBrainz licensing](https://bookbrainz.org/licensing),
[Wikidata](https://www.wikidata.org/wiki/Wikidata:For_developers/en),
[GCD API](https://github.com/GrandComicsDatabase/gcd-django/wiki/API),
[Google Books](https://developers.google.com/books/docs/v1/using),
[AniList terms](https://docs.anilist.co/guide/terms-of-use).

## Verification

New tests: `catalog-open-routing`, `catalog-provider-gateway`,
`open-catalog-providers`, `catalog-requests`. Full suite: `npm test`.
Runtime files are mirrored selectively into both shipped web directories;
no native build, production migration, deployment or GitHub push was performed.
