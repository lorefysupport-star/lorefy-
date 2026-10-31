---
kind: session
status: source-browser-verified-device-pending
date: 2026-11-01
source_commit: ba381fe
---
# Unchanged reading state should not be parsed on every maintenance pass

Third measured repair after [[2026-11-01-Catalog-Classification-Work]]. The
diary sync observer and 2.5s safety poll parsed both full library/progress maps
and serialized them even when unchanged. One regression reproduced203 parses
and102 serializations instead of retaining the initial3/2 after100 idle checks.

Compare the two stored strings before parsing. Retain canonical fingerprinting
on actual changes, formatting-only suppression, malformed-data recovery and
storage-error handling. Check owner before the shortcut; reset it when the
owner dialog closes. Keep the safety poll, observer, real transitions and active
session ticker. No lost changes from legacy writers, no removed feature/timer.
Cachev649; six web mirrors synchronized; no native build or service change.

## Fresh evidence

- Four additional executable regressions; focused23/23, full3149/3149, zero
  failures, exit0 (66915ms). Actual progress/completion record once; malformed
  or inaccessible storage recovers. Canonical formatting-only changes don't write.
- Seven paired local runs with2000 saved works and100 unchanged sync calls:
  median154.05ms to0.0154ms. Parses200 to0, serializations100 to0. This is just
  repeated diary maintenance, not overall startup or network latency.
-16/16 actual-app browser checks AR/EN. Same2000-work/100-call workload: old
 117.2/124.9ms vs current0.5/0.6ms; parse/serialization counts200/100 to0/0.
  Real transitions once, dialog opens, changed owner closes it before shortcut.
  Isolated demo, fixture keys restored, external requests blocked, no page errors.
-12/12 additional Explore smoke checks on4x slowed CPU, AR/EN: rapid replacement
  query keeps latest input, local Berserk results appear with providers blocked,
  clear/cancel and no overflow. First available local result562/374ms in these
  samples. These are current acceptance timings, not a before/after search gain.
- Outside-Git evidence: output/playwright/diary-sync-benchmark.cjs,
  diary-sync-browser.js/results; performance-search-smoke.js/results;
  artifacts/diary-sync-20261101-red.log and full.log.

## Performance boundary

A fresh public-image Home sample at4x CPU remains3954ms to the action row,
versus3603ms in an earlier independent sample. Original image latency also rose
to3.0-3.6s. These variable samples do NOT establish faster overall startup.
Identity normalization and first layout still cost main-thread time. Continue
measured startup work; don't remove active styles/layouts just because old.
Physical iPhone/network/cloud latency remains unverified this turn.

[[systems/Reading-Library]] | [[13-Project-Story]] |
[[14-Feature-Coverage]] | [[15-Work-Control]]
