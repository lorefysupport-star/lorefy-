---
kind: session
status: source-browser-and-simulator-verified
date: 2026-10-21
---
# Type-page search reaches online catalogs

Owner showed Golden Son missing in Novel search after Red Rising was explained as a Novel rather than Book. Index inspection confirmed Red Rising is bundled as a Novel; Golden Son was absent from the bundled index. Category restriction alone did not explain this second report.

`modules/lorefy-explore-studio.js` type-page search only ran the bundled shard/index lookup. Its input was not opted into the existing online enrichment listener in `modules/lorefy-api-catalog.js`. That listener also used the URL type, while Explore changes selected format in React state without putting it in the URL.

Repairs:
- Format search explicitly opts in using `data-lorefy-catalog-search` containing the selected format.
- Online input binding uses that explicit format, retains the URL fallback for existing catalog search, and cancels queued lookups if input, format or connected state changes.
- Public catalog searches report query/type-scoped waiting, ready and provider failure states. Explore does not show a false final empty result while its online lookup is pending and offers retry for failure.
- Drafts and character/user/profile fields without the catalog opt-in remain excluded. Search remains debounced; no eager all-format download was introduced.
- Existing online catalog cache size budget remains in place.

Evidence: 53 focused tests passed across input privacy, explicit Novel routing, debounce cancellation, remote status/error handling, local catalog demand/recovery, API expansion, cache budgeting and UI versions. Browser UI: Explore → Type → Novel → Golden son; showed Searching, returned Golden Son, then opened the actual result. Detail title Golden Son, author Pierce Brown, year 2015, source Open Library. The work was fetched through the normal provider path rather than manually seeded. Screenshot remains outside the repository.

Selective prepared web assets installed in Device Hub's existing simulator. No native compile, account preference mutation, catalog-source pruning, production migration, commit or push. Online lookup depends on configured provider availability; a browser success is not a guarantee every title/provider request succeeds.

[[systems/Catalog-Search]] | [[systems/Explore-Works]] | [[13-Project-Story]] | [[14-Feature-Coverage]]
