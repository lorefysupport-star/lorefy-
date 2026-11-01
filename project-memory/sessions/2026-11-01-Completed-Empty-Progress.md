---
kind: session
status: source-browser-verified-device-pending
date: 2026-11-01
source_commit: 5b6b702
---
# Count explicit Read choices when catalog totals arrive

Owner reported Shadow Slave marked Read and rated, but no chapters/hours.
The exact bundled `fwn-featured-novel-shadow-slave` record has ch=0/vol=0.
The status save already captured known totals; however, a saved zero snapshot
blocked later initialization. Earned review snapshots had the same empty-snapshot
problem, and chapter-detail enrichment did not notify the app's migration hook.

## Repair and policy

- [Reading metrics](../../modules/lorefy-reading-metrics.js) now initializes
  missing **or all-zero** progress for an explicit completed status once totals
  are known. Preserve notes and every positive saved checkpoint, including
  partial/page/volume values. Reading/wishlist/paused/orphan progress is unchanged.
- This deliberately supersedes the older completed-plus-explicit-zero exception
  in [[2026-10-16-Review-Progress-Independence]] and the zero-preservation clause
  of [[2026-10-18-Rating-First-Completion]]. An all-zero completed work is pending
  metadata, not permanently excluded from the owner's requested accounting.
- Only already-earned, owned `completedByReview` records with an existing empty
  completionProgress are backfilled. Ordinary historical ratings and another
  reader's reviews do not earn new credit. A positive snapshot stays frozen.
  Reading status and manual checkpoints remain independent of publishing.
- Catalog ingestion and the new `lorefy:chapter-metadata` event trigger these
  persisted repairs; unchanged results return the original object/array.
  Rendering itself does not infer or increase progress as catalog totals grow.
- [Chapter metadata](../../modules/lorefy-chapter-metadata.js) seeds the exact
  Shadow Slave identity with a publisher-observed3233-chapter baseline, checked
  2026-11-01 at [Webnovel](https://www.webnovel.com/book/shadow-slave_22196546206090805).
  This is an ongoing-work snapshot, not a final total, live API, chapter-text
  download or title-based fuzzy match. Other unknown works still require a real
  count; no invented chapters/hours or page-to-chapter conversion.
- Existing per-work maximum prevents double-counting the status and review.
  Existing time model remains12 minutes/chapter (or page/volume alternative),
  not measured reading time.3233 chapters display647 estimated hours.
- Four canonical runtime files, index and SW selectively mirrored; cachev665.

## Evidence

- New regressions first failed on missing baseline, skipped empty completion,
  missing late-review repair and frozen zero review snapshot. Six new tests plus
  existing completion/ownership/units suites cover the fix. Two old tests were
  updated to the owner's superseding all-zero-completed policy, not removed.
- Final full suite:3225/3225, zero failures, exit0. The earlier full run had one
  obsolete zero-preservation expectation; it was explicitly updated and rerun.
- Actual-app Playwright demo, AR/EN at320/390px:48/48 checks, no page exceptions.
  Selected Read through the real sheet, confirmed local save and visible profile
  counts, reloaded, published a rating through the real editor, verified no
  double count, then reloaded a seeded empty completed checkpoint with a note.
  Both the recovered count and note survived; no horizontal overflow.
- Local receipts outside Git: `output/playwright/completed-progress-results.txt`,
  `completed-shadow-ar.png`, `completed-shadow-en.png`; full log
  `artifacts/completed-progress-20261101-full.log` in the parent workspace.

## Limits

No actual account mutation, physical-device acceptance, Supabase schema/deploy,
native build, EAS, Apple or TestFlight upload. Existing installed binaries do not
receive a GitHub source commit automatically. Live/cloud statistics parity and
unknown provider coverage remain separate acceptance work.

[[systems/Reading-Library]] | [[09-Data-Contracts]] | [[15-Work-Control]]
