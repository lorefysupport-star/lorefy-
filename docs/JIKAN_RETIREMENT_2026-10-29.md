# Retired Jikan public API: verified replacement

Date: 2026-10-29. Source base: `74fbee4` on `origin/main`, isolated from the
original checkout's uncommitted security work and earlier Pro optimization.

## Cause and correction

The [Jikan maintainer announcement](https://github.com/jikan-me/jikan-rest/issues/613)
confirms that `api.jikan.moe` was discontinued on October 1, 2026. This supersedes
the earlier conversation's inference that the observed failures might be a
temporary upstream/connectivity outage. It does not establish that the
MyAnimeList website is down.

The maintainer lists Tenrai and Jikan-Edge as alternatives. Jikan-Edge uses a
different camelCase contract. [Tenrai v1 documentation](https://api.tenrai.org/documentation)
explicitly describes a Jikan v4-compatible public API; its compatible routes were
also checked live before changing Lorefy. Tenrai is beta, with documented public
limits of 120 requests/minute and 4 requests/second per IP. No credentials or
paid plan were created. Existing request deadlines, data caches and fallbacks
remain in place; this is not a provider uptime or peak-load guarantee.

## Source change

- `modules/lorefy-character-system.js`, `lorefy-cover-api.js`,
  `lorefy-growth-features.js` and `lorefy-chapter-metadata.js` now use
  `https://api.tenrai.org/v1` for the existing MAL-compatible requests.
- `modules/lorefy-data-proxy.js` translates legacy `https://api.jikan.moe/v4/`
  URLs while preserving their exact path/query. The internal `jikan` provider key
  and helper names remain compatibility interfaces. Lookalike hosts are not
  rewritten. New character source attribution is Tenrai; MAL character/work IDs,
  portrait URLs, progress keys, custom artwork and account data are unchanged.
- `supabase/functions/lorefy-public/index.ts` changes only the `catalog-jikan`
  upstream base. The production deployment used the freshly retrieved deployed
  version 13, replacing just that upstream URL. Version **14** is ACTIVE and
  preserves `verify_jwt=false`, path restrictions and every other live function
  behavior. Canonical source has the same target change; an existing harmless
  media-host array ordering difference was not deployed as part of this repair.
- Asset URL suffixes and service-worker cache `lorefy-v637-mal-provider-tenrai`
  prevent stale web assets. Only the five changed modules, index and service
  worker were synchronized into `ios-web/` and `ios/App/App/public/`.
  This is selective web-asset synchronization, not a native build or release.

## Fresh evidence

[Three regression checks](../tests/mal-provider-migration.test.js) failed before
the repair and passed afterward. They exercise legacy URL translation,
gateway-free character retrieval with stable MAL IDs and images, and chapter
count identity/attribution. Existing fixture URLs and assertions were updated to
the new service without removing ownership, identity, fallback or timeout checks.

Focused suite: **365/365 passed**, exit 0, using:

```sh
node --test tests/mal-provider-migration.test.js tests/character-provider-body.test.js tests/chapter-metadata.test.js tests/cover-source-lock.test.js tests/literary-character-images.test.js tests/build19-regressions.test.js tests/release-v13-readiness.test.js tests/version-consistency.test.js tests/character-gallery-hydration.test.js tests/character-editor-ownership.test.js tests/character-name-search.test.js tests/character-search-lifecycle.test.js tests/catalog-input-privacy.test.js tests/catalog-online-all-types.test.js tests/ui-unity.test.js tests/bootstrap-auth-safety.test.js tests/community-copy.test.js tests/report-studio.test.js tests/cover-media.test.js tests/work-byline-typography.test.js tests/data-studio.test.js tests/reading-typography.test.js tests/reading-terminology.test.js tests/legal-studio.test.js
```

The worktree reused the original checkout's installed dependencies through
`NODE_PATH`; no package manifest or lockfile changes. Source and generated copies
were checked separately; memory refresh/audit follows the curated update.

| Live public request | Result | Observed time |
| --- | --- | ---: |
| Tenrai manga 2 detail | 200, expected MAL ID | 422 ms |
| Tenrai manga 2 characters | 200, 82 characters | 129 ms |
| Tenrai manga 2 pictures | 200, 20 entries | 2719 ms |
| Tenrai character 27 pictures | 200, 20 entries | 1127 ms |
| Tenrai character name search | 200, 8 entries | 1142 ms |
| Tenrai manga title search | 200, 3 entries | 1156 ms |
| Lorefy compatibility route, manga detail | 200, expected MAL ID | 927 ms |
| Lorefy compatibility route, cast | 200, 82 characters | 305 ms |
| Lorefy compatibility route, portraits | 200, 20 entries | 333 ms |
| Lorefy compatibility route, invalid path | 400 | 186 ms |

These are individual observations, not a benchmark distribution or device latency
claim. A loopback browser booted the current Explore demo. A temporary browser
fixture then loaded the real character module and gateway, received 82 characters with Tenrai attribution and preserved `mal-` IDs
in 2517 ms. It used no user account; the temporary fixture was removed.

## Remaining scope

Installed native versions that call Jikan directly still need a separately
authorized app build/release to receive these client changes. Updating the
server compatibility route does not remotely replace installed JavaScript.
No Apple/EAS upload, native compile, production migration, test user creation or
deployment of the deferred security patch occurred.

Jikan is used mainly for character, cover and chapter enrichment. Main work
search uses other providers. Its batch aggregation, outdated requests and time
to first useful result need separate source/device measurements and repair;
this provider migration does not close the search-performance complaint.
