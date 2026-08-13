# Lorefy Catalog and Media Rights Audit

Status: **not yet approved for App Store submission**.

## Runtime sources found in the app

| Source | Current use | Verification result | Required action |
| --- | --- | --- | --- |
| Open Library | Book metadata and cover URLs | Public APIs support human-facing discovery and cover display, with low-volume usage, caching, identification, and a courtesy link requested. | Add visible attribution/link and identify server requests as `Lorefy (lorefysupport@gmail.com)`. Avoid using the live API as a bulk backend. |
| AniList | Manga/novel metadata, covers, characters | Terms prohibit competing list/tracker services unless authorized and restrict mass collection. Lorefy is a tracker. | Obtain written authorization from AniList before App Store submission, or remove AniList from the release catalog. |
| MangaDex | Manga metadata and cover URLs | API is documented, but the repository does not contain written permission proving Lorefy's commercial/store use and cover redistribution rights. | Obtain written authorization/acceptable-use confirmation and add attribution, or remove this source from the release catalog. |
| Bundled/static media | Covers and character images embedded or referenced by existing data files | Per-item source and license evidence is not consistently recorded. | Produce a source/license manifest or replace assets with verified APIs, user uploads, licensed media, or generated placeholders. |

## Official references checked

- AniList API Terms: https://anilist.gitbook.io/anilist-apiv2-docs/docs/guide/terms-of-use
- Open Library API Guidelines: https://openlibrary.org/developers/api
- Open Library Covers API: https://openlibrary.org/dev/docs/api/covers
- Open Library Licensing: https://openlibrary.org/developers/licensing
- MangaDex API documentation repository: https://gitlab.com/mangadex-pub/mangadex-api-docs

Do not mark `contentRightsVerified` true in `config/lorefy-release.json` until the actions above are complete and the evidence is stored with release records.

