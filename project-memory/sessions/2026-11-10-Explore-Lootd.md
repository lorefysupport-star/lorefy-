---
kind: repair-session
status: source-browser-verified-device-pending
date: 2026-11-10
---
# Explore: query-only loading and stable result work

Owner requested a specific Lootd Explore speed/UI study and application.
[Study and receipt](../../docs/EXPLORE_LOOTD_2026-11-10.md) separates public
observations from private implementation assumptions and device claims.

The loader skips browse bootstrap parts for nonempty queries and cancels short
queries without a lookup. Global More now reveals local cards then loads matching
shards, with complete context/owner guards. Result memos depend on catalog data
and ingestion/safety changes, not replacement callbacks or status notifications.
Category summaries are lazy/linear; Types skips personalized ranking.

Direct format selection shares advanced filters and theme glass tokens. Single
results no longer reserve a dummy edition toolbar. Bounded grids use actual
card layout rather than a short offscreen estimate; image loading stays lazy.
Reading, identity, ranking and personal storage contracts remain unchanged.

22 added cases first reproduce the target problems. Full3480 passes; actual
AR/EN browser covers filters, Berserk open/back and Love36 ->72 cards. Five
controlled Types status events give ranking5 ->0, not a device latency claim.
One synthetic1000-record/8-format summary counts23001 ->0 hidden type reads,
then1000 on Types open. Cachev705/native copies aligned. No build/service change.

[[systems/Explore-Works]] | [[systems/Catalog-Search]] | [[13-Project-Story]] |
[[14-Feature-Coverage]]
