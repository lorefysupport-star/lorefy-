# Supabase Pro restoration check and database optimization

Verified 2026-10-29 against the existing `qsroxmltioxqozmykens` project.
Owner requested restoring servers after subscribing to Pro and general
optimization, then connected the owning Supabase account. This authorizes this
targeted service follow-up; it does not authorize replaying historical migrations,
shipping the unrelated local security patch, changing ownership or a native build.

## Availability and workload

- Organization `lorefy` reports `plan=pro`; project status is `ACTIVE_HEALTHY`.
- No resume/restart was needed. The database process reports a September 29
  start time; the observed outage concerned function requests, not proof of a
  paused Postgres server.
- Last-24-hour aggregated function logs show catalog HTTP 402 responses through
  17:50:58 UTC, followed by HTTP 200 responses from 18:07:42 UTC. This supports
  recovery from the earlier billing restriction. Current AniList and MangaDex
  public catalog probes return HTTP 200 with results. Auth health/settings also
  return HTTP 200; anonymous table/RPC probes still return denial or zero rows.
- Database size was approximately 26 MiB, with 8 connections against a limit
  of 60 and no blocked sessions at inspection. These are snapshots, not CPU,
  egress, storage billing or peak-load measurements. Compute and connection limits
  were kept unchanged. Historical statistics were not reset.

## Applied change

[Migration](../supabase/migrations/20261029194223_optimize_feed_and_foreign_keys.sql)
was created using Supabase CLI 2.122.0, reviewed and tested locally, then applied
through the connected project's migration tool. The local filename was aligned
to its confirmed live migration version, `20261029194223`.

1. Added `reviews_feed_created_id_idx` on `(created_at DESC, id DESC)`. The feed
   relies on RLS, so the existing partial `is_public` index could not satisfy this
   unfiltered ordering. The partial index remains intact.
2. Added covering foreign-key indexes on community reaction `user_id`, notification
   `actor_id`, purchase `product_id`, and private username reservation `user_id`.
3. Changed only `auth.uid()` to `(select auth.uid())` in the two chapter-review
   policies. Ownership, privacy, both block directions, roles, policy commands,
   permissiveness and table grants are preserved. A drift guard aborts the
   migration if the inspected policy predicates have changed.

The largest affected table was 200 KiB. The transaction used a 2-second lock
timeout and 30-second statement timeout. All five indexes are valid and ready;
their combined observed size is 88 KiB. No production user records were inserted,
updated or deleted, and no test accounts were created.

## Fresh verification

The representative authenticated-role feed query selects the normal eleven
review fields, orders by `created_at DESC, id DESC`, and limits to 30. A nonexistent
synthetic subject was supplied only as transaction-local claims; this is a database
RLS test, not an actual Auth login or a real user's account session.

| Live EXPLAIN ANALYZE | Before | After |
| --- | ---: | ---: |
| Execution time | 80.915 ms | 23.905 ms |
| Access path | Sequential scan + sort | Feed index scan |
| Visible candidate rows processed | 205 | 30 |
| Shared block hits | 1565 | 499 |

This is a single before/after query observation, not a production latency SLO or
device-speed claim. A separate live read-only check compared the ordered IDs with
index scans enabled/disabled and confirmed identical results without outputting
IDs. Chapter-review EXPLAIN shows an identity InitPlan. Chapter reviews were empty
at inspection, so no live chapter-review speedup is claimed.

- [Isolated SQL integration harness](../supabase/tests/server-optimization.mjs):
  23 assertions passed using temporary PGlite 0.5.13, including owner/visitor,
  private profiles, both block directions, delete ownership, anonymous denial,
  policy metadata preservation, indexes and drift rejection. No network/database
  credentials are used by this harness. PGlite was installed outside the repo;
  application dependencies and lockfiles were not changed.
- Focused source suite: 63/63 passed, exit 0:
  `node --test tests/account-surface-isolation.test.js tests/account-sync-isolation.test.js tests/chapter-review-session.test.js tests/community-cloud.test.js tests/account-identity-hardening.test.js tests/paid-collections.test.js`.
- Performance advisors no longer report the four
  [unindexed foreign keys](https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys)
  or the two
  [per-row identity evaluations](https://supabase.com/docs/guides/database/database-linter?lint=0003_auth_rls_initplan).
  Security advisory categories/counts remain unchanged.

To rerun the isolated harness, install `@electric-sql/pglite@0.5.13` in a temporary
directory and run `node supabase/tests/server-optimization.mjs /absolute/path/to/node_modules/@electric-sql/pglite/dist/index.js`.
The fixture is deliberately unrelated to production Auth users.

## Remaining evidence and limits

- Jikan proxy probes return HTTP 502 after roughly 10 seconds; a direct upstream
  request also failed. An upstream/connectivity problem is likely. Neither Pro
  nor this database migration proves Jikan recovery. Google Books also had HTTP
  429 responses in the inspected window.
- Apple authorization logged HTTP 503. Deployed version 7 returns that status
  when required server configuration is absent; which value is missing was not
  inspected. Credentials were not changed. Other Auth operations were responding;
  physical Apple sign-in/account deletion were not exercised.
- Auth's fixed 10-connection allocation remains an informational tuning notice;
  there was no evidence of exhaustion. The connector has no Auth-config update
  operation. Revisit percentage allocation alongside a future compute change.
- Unused-index notices are observations, especially for new indexes and small
  tables. No indexes were dropped. Historical backup-schema tables were preserved.
- Existing security notices (privileged RPCs, `pg_net` placement, server-only
  tables with no client policies, password protection setting) require contextual
  review. Required authenticated APIs were not disabled to silence the advisor.
- No backup restore, authenticated two-account service audit, hardware test,
  Edge Function deployment, native build, Apple upload or ownership transfer.
  The deferred October 21 proxy/security work remains local.

If rollback is needed, inspect the current policies first, restore the two original
predicates shown in the migration's drift guard, and remove only these five new
indexes through a separately recorded migration. Do not replay this migration or
rewrite its applied history.

## Later same-day resolution and source integration

The initial Jikan connectivity inference above is superseded by the verified
[retirement repair](JIKAN_RETIREMENT_2026-10-29.md). The public Jikan service had
closed; Tenrai-compatible replacement and the narrowly updated gateway restore
those routes. The separate [search performance repair](SEARCH_PERFORMANCE_2026-10-29.md)
measures and fixes startup/provider/CPU delays. Historical service measurements
above retain their original scope; Apple configuration, rate limits, physical
device acceptance and release delivery are not closed by these later changes.

The existing server optimization commit is integrated with latest main and the
client repairs for the owner's direct GitHub handoff. Its already-applied
migration is preserved as source history and **is not reapplied**. No additional
production database or Edge operation occurs during this integration.
