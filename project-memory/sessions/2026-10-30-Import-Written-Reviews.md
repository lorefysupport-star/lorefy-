---
kind: session
status: source-browser-verified-cloud-device-pending
date: 2026-10-30
source_commit: a0ae3eb
---
# Preserve written reviews from explicit CSV exports

Owner requested continuing the Pro adoption work and pushing each verified
source repair independently. No new build, production mutation or paid resource.

## Reproduced

Goodreads and generic CSV parsed rating/status but discarded written reviews.
`imApply` created every review with `txt:'—'`, skipped the whole row if its work
was already in the Library, and recognized only explicit userId:'me' duplicates.
This lost exported text and prevented recovery into existing reading entries.
Initial13 regressions included11 failures; final15 behavior cases cover this
contract plus2 AR/EN UI cases. Existing CSV, session and rollback checks retained.

## Repair

- `modules/lorefy-growth-features.js`: Goodreads My Review and explicit generic
  My Review/Review/Review Text/المراجعة columns retained. Multiline/quoted text
  follows the existing record parser. Notes are not reclassified as reviews.
- Missing text can be added to the owner's existing rating without replacing
  its number (including deliberate zero), ID, recommendation or timestamp.
  Authored nonempty text remains authoritative. Existing Library statuses and
  progress stay unchanged; missing local review records may be added independently.
- Text-only imported records are unrated (`r:null`, no dislike recommendation),
  newly created records explicitly isPublic:false. No publishReview/community
  method is called. Data remains in the existing account-owned local/cloud-state
  contract, not a new server-side public review or background import queue.
- Legacy untagged owner reviews deduplicate too; duplicate input/repeated import
  retain one owner/work record. New IDs no longer reuse the Library-added counter.
- Preview uses literal text in native details/summary, named include-text checkbox
  and localized no-overwrite/no-auto-publication explanation. Users can import
  ratings only. Save failures retain selection/preview and the old three-key
  rollback contract. Summary distinguishes ratings/text/unchanged reading states.
- Scoped styling uses existing semantic tokens. Cachev642 and4 changed web assets
  selectively mirrored into both runtimes. No compilation or installed update.

## Fresh Evidence

-132 focused tests passed. Final complete source suite **3034/3034**, zero failures,
  exit0,63,647ms. JS syntax checked. Memory audit run after documenting this repair.
- **168/168** actual local-app browser checks; AR/EN x dark/pink x320/390/768.
  Real CSV file input, preview before save, literal script-like text, bounds,
  checkbox default/opt-out, simulated write failure/rollback/retry, missing-text
  recovery, private unrated record, unchanged reading state, repeat import and
  completion focus. No pageerrors or publication requests. All isolated demo
  contexts; external hosts blocked. Not a real user's library or service import.
- Workspace evidence outside Git: `artifacts/import-reviews-20261030-red.log`,
  `-full.log`, `-browser.js`, `-browser.json`, and preview screenshots.
  First browser attempt used an unscoped locator during leaving-dialog animation;
  acceptance was rerun against the active non-inert dialog, without changing UI.

## Limits

AniList/Kitsu still import library metadata and scores; this does not claim
published-review retrieval from those providers or automatic tweets. MAL export
does not magically gain review text. Public publication, durable server jobs,
provider paging/resume, actual cloud-state acknowledgment and physical file
access need separate acceptance. Existing authored text is never overwritten.

[[systems/Reading-Library]] | [[systems/Accounts-Sync]] |
[[09-Data-Contracts]] | [[13-Project-Story]] | [[14-Feature-Coverage]] |
[[15-Work-Control]] | [[10-Open-Questions]]
