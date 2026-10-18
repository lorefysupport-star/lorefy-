---
kind: session
status: source-verified
date: 2026-10-19
reviewed_on: 2026-10-19
---
# Dynamic Account-State Synchronization

Parent `8ea8e16`, after independently verifying and pushing
[[bugs/LF-069-Pull-Remote-Deletions]]. [[bugs/LF-070-Dynamic-State-Sync]] is a
separate push-side defect reproduced with the complete canonical Backend.

The fixed list plus live storage enumeration missed removed dynamic keys. Four
new failures demonstrated stale server images, a falsely cleared deletion
journal even offline, and a remote addition missing from local state. The diff
now includes acknowledged base/pending keys; adoption includes acknowledged
remote keys. Both additions filter the existing account namespace contract and
deduplicate keys, preserving conflict detection and twenty-key batching.

Six additional cases cover dynamic deletion, a deletion missed by the observer,
remote addition across two pushes and its stored-state event, offline failure
then retry, foreign key exclusion, and 25 unique removals split 20/5. The complete
isolated suite for this file now contains 13 cases. No actual account writes.

Focused command: `node --test tests/state-sync-deletions.test.js
tests/state-recovery-runtime.test.js tests/account-sync-isolation.test.js
tests/runtime-repairs.test.js tests/beta-remediation.test.js
tests/release-v11-regressions.test.js`: **76 passed**, zero failures.

Full `npm test`: **2177 passed**, zero failures/skips/cancellations. Memory audit:
203 notes / 569 indexed sources, fresh, no issues, orphans or duplicates.
Metadata workflow tests also rerun after the new issue/session notes:4 passed.

Backend/index/sw are selectively synchronized to both native-web copies with
cache `lorefy-v525-sync-dynamic`. No native build, upload, service code or schema
change. The existing source-only direction and unrelated local changes remain.

## Limits

A second read-only SQL transaction used the supplied viewer claim and
`SET LOCAL ROLE authenticated`, then returned aggregates only: own state rows1,
foreign state rows0, other private profiles visible0, other block rows visible0.
It rolled back without data changes. This exercises current SELECT RLS under
that database role, not SDK auth/JWT verification or mutation access controls.

The read-only service receipt in [[sessions/2026-10-19-Pull-Remote-Deletions]]
does not prove actual signed-client login, SDK storage integration or writes.
Only one test viewer has been supplied; two-account mutations, blocked/private
transitions, cross-device persistence and installed matching-release acceptance
remain open. No second user account was selected or changed without direction.

[[bugs/LF-070-Dynamic-State-Sync]] | [[systems/Accounts-Sync]] |
[[13-Project-Story]] | [[14-Feature-Coverage]] | [[18-Progress-Handoff]]
