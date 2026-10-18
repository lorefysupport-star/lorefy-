---
kind: session
status: source-verified
date: 2026-10-19
reviewed_on: 2026-10-19
---
# Pull Reconciliation and Read-Only Privacy Check

Parent: `fe714ac`. The owner authorized continuing source development, with no
new native build. [[bugs/LF-069-Pull-Remote-Deletions]] records a newly reproduced
source issue, not a claim about a specific user's lost data.

## Reproduction and Repair

[state-sync-deletions](../../tests/state-sync-deletions.test.js) executes the
complete canonical Backend with isolated Web Storage and a simulated versioned
server. Three initial failures retained a remotely removed list/library field
beside an unrelated offline edit. The fixed pull checks the union of snapshots,
adopting deletion only for unchanged account keys with an acknowledged base.

Seven cases cover absence, null, an empty newer snapshot, first sync without a
base, writes during pull, offline failure and account switch. The first two also
push afterward and assert the removed data is not re-uploaded. No actual account
data is used in these tests.

Focused command: `node --test tests/state-sync-deletions.test.js
tests/state-recovery-runtime.test.js tests/account-sync-isolation.test.js
tests/runtime-repairs.test.js`: **51 passed**, zero failures.

Full `npm test`: **2171 passed**, zero failures/skips/cancellations. The first
full run caught missing source-commit/device-queue metadata in LF-068/LF-069;
those notes were corrected and the entire suite rerun successfully. Memory audit:
201 notes / 569 indexed sources, fresh, no issues/orphans/duplicates. Backend,
index and service-worker SHA-256 match both selective native-web copies.

The canonical Backend, index query and service worker are selectively copied to
both native web directories. Cache `lorefy-v524-sync-delete`; not a native build.

## Current Service Evidence

The configured Supabase project was accessible on this date. Read-only catalog
inspection confirmed the deployed `get_public_profile_lists` and
`sync_user_state` contracts, their anon-execution denial and authenticated grants.
RLS is enabled on profiles, user_state and profile_blocks; current owner policies
and profile visibility predicates are present. This is metadata inspection, not
an exhaustive security review or proof that every API path follows those rules.

A read-only SQL transaction set only a transaction-local viewer claim for the
owner-supplied test viewer. Aggregate projection across 158 other profiles:
5 private targets, 0 blocked targets, 2 profiles with public lists, 0 restricted
profile leaks and 0 nonpublic-list leaks. Rolled back; no profiles, lists, account
settings, secrets, migrations or service code changed. No identifiers, list
content, tokens or credentials are stored in this vault.

Because no blocked relationship was present, that case remains unproven by this
sample. A SQL viewer claim is not an actual client login/JWT/RLS end-to-end test.
Only one test account was supplied; a two-account mutation test was not performed.
SDK auth/storage, cross-device durability, native permissions, force quit and a
matching installed iPhone release still require their own evidence.

[[bugs/LF-069-Pull-Remote-Deletions]] | [[systems/Accounts-Sync]] |
[[systems/Profiles-Lists]] | [[13-Project-Story]] | [[14-Feature-Coverage]] |
[[18-Progress-Handoff]]
