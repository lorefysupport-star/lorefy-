---
kind: session
status: in-progress-source-browser
date: 2026-11-01
source_commit: b90489f
---
# Community timeline, freshness and interaction pass

Owner priority: community only, reduce stalls/repeated fetching, make new friend
ratings/reviews timely and reactions consistent. Push each verified repair;
do not build, upload to Apple or mutate production data.

C-001: uploads/files/lorefy-app.js review effect no longer full-refreshes on
every table's event. Fixed180ms event coalescing, typed review/graph routing and
one non-overlapping dirty catch-up preserve changes received during a job.
Five initial failures; focused16/16, full3180/3180 (65269ms, exit0) and browser
18/18 AR/EN pass. Browser uses the actual extracted effect with controlled backend
plus actual demo UI idle/card retention checks; not live or device certification.
Cachev657-community-routing and six affected mirrors byte-identical.

See docs/COMMUNITY_TIMELINE_2026-11-01.md for evidence and remaining scope:
friend shared loading, post invalidation routing and review reaction consistency.
No generic dead-code purge or design replacement is part of this repair.

[[systems/Community-Notifications]] | [[13-Project-Story]] |
[[14-Feature-Coverage]] | [[15-Work-Control]]
