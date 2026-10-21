---
kind: session
status: source-browser-and-simulator-assets-verified
date: 2026-10-21
---
# Search field audit

Owner requested checking the other searches after the type-page online search repair. Reviewed main media/type searches, reader discovery, account lists, library matching, character names and favorites/list pickers. Source tests do not certify every live provider or public profile.

Found and repaired two integration defects: main Explore online search defaulted to Manga because its selected scope was not in the URL; its shared People/Lists field also matched catalog listeners. Main Media explicitly requests All; People/Lists carry a local-search marker respected by remote and local catalog listeners. The React effect owns scoped local loading, avoiding a second URL-default lookup. Returning to Media replays the current search. Legacy All/الكل route values remain All for remote search.

All-format online search uses six provider jobs covering Manga/Manhwa/Manhua, general books, Light Novel and Web Novel. General book metadata distinguishes Book/Novel/Comics and light/web fiction using source categories rather than assigning every result the requested tab. General book providers run once, rather than repeatedly for each book-like type. At most two format jobs run together; queued jobs stop when input/scope changes. Per-provider caching and debounce remain; no eager all-format catalog download. Waiting/error/retry applies to the main Media search as well as format pages.

Verification: 234 focused checks passed, including all eight input scopes, bounded online job concurrency and cancellation, category inference, Arabic/alternate title/author matching, failed-search recovery and deadlines, character name/lifecycle, reader directory isolation/ranking, library presentation and shared matching, list/favorite picker identity, Explore and cache keys. Browser isolated demo: main Golden son search displays Golden Son; People and Lists modes show their scoped empty states. Library has no entries in this isolated demo; populated library matching is covered by shared matcher source tests, not a live owner mutation. Reader tests use fixtures; no claim that production directory availability was certified. Screenshot outside repository: /tmp/lorefy-search-audit.png.

Five prepared web assets selectively synchronized byte-for-byte into native project and installed simulator app, then relaunched. No native compile, cloud account changes, migration, commit or push. Existing provider fuzzy results/ranking and catalog coverage remain separate from field wiring correctness.

[[systems/Catalog-Search]] | [[systems/Explore-Works]] | [[13-Project-Story]] | [[14-Feature-Coverage]]
