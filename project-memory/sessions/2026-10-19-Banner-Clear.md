---
kind: session
status: source-verified
date: 2026-10-19
---
# Banner removal and stale profile media

Owner reported an unexpected saved profile banner and requested a fix. Its
original upload cause remains unproven; no claim that these defects caused it.

Confirmed regressions: `_profileMediaPath` restored its fallback for an explicit
empty selection; `_hydrateProfile` restored cached artwork for cleared server
media or an unresolved replacement. The editor also retained old storage paths
when the save returned empty paths. These are now cleared explicitly. Added a
localized Remove banner control using the existing guarded selection flow;
late image decoding cannot undo removal.

Six new regression tests failed before the corresponding fixes. Final related
suite: 92 passing, zero failures, covering refresh, editor and account ownership.
Two repaired runtime files hash-matched in both generated web trees and the
installed simulator. This does not identify the historical uploader or certify
physical-device behavior. No release, database migration or stored image deletion.

[[systems/Accounts-Sync]] | [[13-Project-Story]] | [[14-Feature-Coverage]]

Simulator UI verification: Remove banner appeared in the profile editor; used it
and Save, which returned Profile saved. The unwanted image disappeared while
the decoration remained. This changed the authorized account banner reference
through the normal profile flow; the stored image object was not deleted.

After terminating and relaunching Lorefy, reopened Profile: banner remained absent.
