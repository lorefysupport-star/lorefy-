---
kind: session
status: source-browser-verified-device-pending
date: 2026-11-13
---
# Less Repeated Catalog CPU Work

Continue runtime smoothness after [[sessions/2026-11-13-Glass-Unity]]. Profiling
identified repeated catalog text preparation, not an established observer loop.
Pure short-string normalization is now bounded to1,024 entries; taxonomy reuses
one call-local text snapshot and skips inapplicable publisher checks. Live work
edits and content-safety gates are preserved. No appearance/motion change.

Five new cases first failed as expected and six regression cases now pass;
67 focused tests passed. Three interleaved4x CPU browser pairs retain the same
3,305-record classification/discovery signature. Taxonomy median310.0 to158.9ms;
Explore ranking173.8 to115.0ms. These are scoped CPU measurements, not whole-app
speed or device FPS. Populated local navigation and decorated Profile verified.

[Report and evidence limits](../../docs/CATALOG_HOTPATH_V716.md).
Full suite after final asset synchronization:3,572 passed,0 failed. The first
full run caught the not-yet-synchronized bundled policy asset; after selective
copying, both the17-case package/version check and the complete rerun pass.
Memory audit fresh:883 source files,380 notes, no issues or orphan notes.
Cachev716 and eight selectively mirrored web assets; no native build, provider
change, Supabase mutation, Apple upload or test Push. Physical device pending.

[[systems/App-Boot]] | [[systems/Catalog-Search]] | [[13-Project-Story]]
