---
kind: playbook
status: maintained
aliases: ["ثبات الفصول والساعات"]
---
# Reading Counter Regression Playbook

1. Read [[decisions/Saved-Reading-Metrics]]. Identify the active account, library state, saved checkpoint and whether catalog totals are hydrated.
2. Compare counters before/after reload, catalog enrichment and profile-tab navigation without explicit progress changes.
3. Never overwrite or delete the user's saved checkpoint to make counters appear correct.
4. Reproduce explicit completion, legacy missing totals, zero/partial progress and non-finite input in an isolated test.
5. Verify daily history changes only for explicit checkpoint increases. Distinguish estimated hours from tracked sessions.
6. Run `node --test tests/reading-metrics-stability.test.js` and the relevant browser audit, then the broader suite if shared behavior changed.
7. Record cause, fix, test result, source version and remaining cloud/device gaps.

Sources: [metrics tests](../../tests/reading-metrics-stability.test.js),
[browser audit](../../qa/reading-free-audit-browser.cjs),
[feature audit](../../docs/FEATURE_AUDIT_20261011.md).

[[00-Home]] | [[05-Verification]] | [[templates/Bug]]
