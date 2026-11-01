---
kind: session
status: source-browser-verified-service-device-pending
date: 2026-11-01
source_commit: 4cc1e78
---
# Keep recommendation intent across review restoration, display and counting

L-003 follows [[2026-11-01-Logical-Public-Review-Projection]]. savedDraft lost
legacy rec:false for a valid positive rating, so a text-only edit could publish
recommend:null. Canonical recVal:null fell through to legacy false and invented
a zero dislike. A further visible-state regression showed legacy no+positive
was unselected, and clicking it erased the score instead of deselecting.

One internal recommendation resolver respects canonical null/yes/no first,
then legacy valid booleans. Draft restoration and local dislike counts share it.
No old positive rating is migrated to zero. Legacy negative choice renders its
honest localized Not for me caption and selected state. Deselect preserves the
score; a new deliberate Dislike chooses zero. Existing current-editor guards,
publication ownership and reading-completion contract remain. Cachev653 and
six web mirrors synchronized; no native build/service mutation.

Fresh evidence: five new executable regressions (including actual main opener/
publish request false payload), focused50/50 and final full3163/3163, exit0,
62890ms. Original four data regressions and later visible-selection regression
were observed failing separately. The intermediate full run exposed the added
visible-selection case; final stable-source full run passed after its repair.

52/52 actual-app checks AR/EN x320/390 dark/pink: seeded legacy review opens
with2/no, text-only publish preserves it; deselect keeps2, deliberate new dislike
sets0, republishing keeps one review, explicit library/progress unchanged.
Canonical unknown0 stays unselected and cannot publish. Dialog fits horizontally,
closes normally, no page errors. Steady-state screenshot after fade completion
inspected. Isolated demo mode with synthetic owner, external requests blocked;
no real account or public review was written. Initial fixture attempted the
hidden legacy action; verified run uses the visible current quick-review action,
retaining both the intentional bridge and authentication checks.

Receipts outside Git: artifacts/logic-recommendation-20261101-red.log,
logic-recommendation-ui-20261101-red.log and verified.log;
output/playwright/logic-review-roundtrip.js/results and logic-legacy-review.png.
The aggregate docs/LOGIC_AUDIT_2026-11-01.md closes the three scoped findings,
not all unreviewed app logic, cloud behavior or physical-device acceptance.

[[systems/Community-Notifications]] | [[13-Project-Story]] |
[[14-Feature-Coverage]] | [[15-Work-Control]]
