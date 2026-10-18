---
kind: decision
status: accepted
date: 2026-10-11
aliases: ["فصول", "ساعات", "عدادات القراءة"]
---
# Saved Reading Metrics

Problem: completed totals were inferred from mutable catalog totals on each
render. Catalog loading/enrichment made chapters and hours appear to change.

Use saved progress checkpoints as the counter source. Explicit completion
captures totals once; legacy missing checkpoints initialize once when totals
exist. Preserve explicit zero and partial progress. Cleanup must not delete a
checkpoint merely because it matches catalog totals.

Daily chapter history records explicit increases, not rendering, migration or
library removal. Hours are the existing estimate, not an actual session timer.
Normalize non-finite saved progress without poisoning profile totals.

2026-10-18 owner-directed update: [[sessions/2026-10-18-Rating-First-Completion]]
uses the existing one-time completion checkpoint after successful publication of
a currently untracked work. Existing library/progress/removal entries win, even
an explicit zero. Historical review hydration never backfills reading totals.

This is a dated design contract, not a fresh correctness assertion.
Sources: [audit](../../docs/FEATURE_AUDIT_20261011.md),
[metrics module](../../modules/lorefy-reading-metrics.js),
[regression tests](../../tests/reading-metrics-stability.test.js).

[[00-Home]] | [[playbooks/Reading-Metrics]] | [[05-Verification]]
