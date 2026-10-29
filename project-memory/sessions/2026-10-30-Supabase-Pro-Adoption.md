---
kind: session
status: source-verified-service-readonly
date: 2026-10-30
source_commit: 5933fdc
---
# Supabase Pro adoption and private image signing

Owner requested practical use of the subscription, not a new build or paid
add-ons. Connected project inventory/advisors/aggregate logs and dashboard
Billing/Usage/Backups were read. Pro and enabled Spend Cap were confirmed;
the current cycle is under1% on displayed principal quotas. Physical backups
exist, but exclude Storage bytes. No production configuration, SQL, function,
bucket visibility, credentials or billing changed.

Subsequent owner instruction on30 October authorizes a separate GitHub push
after each verified repair, superseding local-only publication for source.
This does not authorize production deployment or paid resources.

[Adoption report](../../docs/SUPABASE_PRO_ADOPTION_2026-10-30.md) maps each useful
service, costs, evidence, actual implementation and remaining acceptance.
Do not replay the already-applied20261029194223 optimization migration.

`backend/lorefy-backend.js` now coalesces private image signing and reuses the
exact URL in memory for at most60s and before token expiry (5s margin), bounded
to256 entries. Each caller still validates Auth; scope includes owner, active
owner, epoch, client and project plus bucket/path/lifetime. No token persistence,
RLS relaxation or longer URL lifetime. Sign-out/invalid-session and profile
replacement/review deletion invalidate reuse; late old promises cannot repopulate
the active cache. Failure/empty responses remain retryable. Profile upload
cache-control remains0 because paths can be overwritten.

14 new VM tests in `tests/storage-signing-cache.test.js`; baseline observed
20 signing HTTP requests for20 simultaneous consumers, now1. This is not a
95% whole-app/network billing claim. Existing storage owner, artwork persistence,
profile mutation and review-backend owner tests passed alongside the initial12
new cases (86/86); the2 additional sign-out/expired-auth cases passed too.

Selective web-runtime mirroring of Backend/index/sw; cachev639. No iOS compile.
Fresh final synchronized-source suite: **3004/3004 passed**, zero failures,
exit0 (71,965ms). `node --check backend/lorefy-backend.js` and `git diff --check`
passed. Log: workspace `artifacts/supabase-pro-20261030-tests.log`, outside Git.
The initial full run correctly caught stale runtime copies; it was not accepted
until all copies and asset/cache expectations were synchronized and rerun. Live
cache-hit ratio, device behavior, two-account acceptance, responsive image
transformations and background jobs remain unverified/unimplemented. No
transformation quota was consumed by this work. Existing UI F15/F16 order is
not superseded by another UI/media micro-batch.

[[systems/Accounts-Sync]] | [[13-Project-Story]] | [[14-Feature-Coverage]] |
[[15-Work-Control]] | [[10-Open-Questions]]
