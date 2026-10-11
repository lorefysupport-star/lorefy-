# Feature Audit - 2026-10-11

Scope: recent profile sections, folders/ranked lists, public profile presentation,
work banners, community integration, appearance, reading metrics and decorations.

## Fixed

- Reading counters previously inferred completed progress from mutable catalog totals on every render. Saved progress now supplies counters independently of catalog loading/enrichment.
- The old legacy cleanup could delete a completed checkpoint solely because it matched catalog totals. It is now nondestructive.
- Explicit completion captures chapter/volume/page totals into the existing account-scoped `lorefy.user.progress.v2` storage. Legacy completions with no saved checkpoint initialize once; missing totals wait for catalog loading. Existing explicit checkpoints, including zero and partial progress, are preserved.
- Chapter history still counts explicit checkpoint increases only. Rendering, migrations and removing library items do not fabricate or rewrite historical daily totals. Hours retain the existing estimate (12 minutes/chapter, or page/volume fallback), not an actual session timer.
- Non-finite saved progress is normalized to zero instead of poisoning counters.
- All 17 current storefront bundles are temporarily free. Two-part originals still contain exactly avatar/page frames; three-part collections retain their effect. Free offers do not call checkout, ownership lookup, price availability, restore or billing listeners.
- Prices/restore controls are hidden for the all-free offer, with Arabic/English temporary-free wording. Account checks, local preview boundaries and bundle allowlists remain in force.

## Database Deployment

Only `20261011181942_free_current_profile_bundles.sql` was applied, with explicit user approval, to the configured Lorefy project `qsroxmltioxqozmykens`.

The existing guard/public artwork helper now permits exactly the current 12 originals without a receipt. Purchases and refund records are unchanged. Verification: all 12 database product IDs are permitted; an unknown future ID is not; the real write guard accepted all 12 using a temporary table inside a rolled-back transaction. Internal helper execution remains revoked from anonymous/authenticated roles. No real user state was modified by the probe.

To restore paid offers later, remove the temporary allowlist from the helper in a new migration and set the manifest `freeForNow` to false together. Do not change existing receipts.

## Browser Verification

Full `npm test`: **1051 passed, 0 failed**, no skipped tests. `npm run ios:prepare` succeeded with 121,920 catalog works and the unchanged catalog content hash. Changed runtime files were synchronized with the native public directory after preparation/tests.

- `qa/reading-free-audit-browser.cjs`: fixed chapters/hours through three reloads, repeated catalog updates and profile tab navigation; explicit progress changes update counters; daily history preserved. All 17 bundles preview/apply/remove in both languages without billing calls; avatar and page canvases advance and have nonblank pixels.
- `qa/profile-sections-browser.cjs`: work/character list creation, editing, reordering, persistence/reload, privacy/delete, post creation/thread/reactions, read-only visitors, keyboard tabs and seven widths.
- `qa/profile-header-browser.cjs`: owner/visitor reading metrics, normal/panoramic layouts, Arabic/English, dark/light/custom colors, five widths and four phone sizes; complete owner shelf clears navigation.
- `qa/public-profile-layout-browser.cjs`: 10 distinct fixture users, two languages, four phone sizes (80 layouts), public favorites, shelf sizing and owner-specific appearance.
- `qa/work-list-presentation-browser.cjs`: 20 layouts, large work banner, folder previews with 0/1/2/3/10 entries, long/empty lists, rank geometry, edit/save/remove, focus restoration and public read-only views.
- No browser JavaScript exceptions occurred in these audited flows. Evidence is generated under `output/playwright/` (not committed).

## Remaining Activation / Platform Limits

- `20261011134708_profile_public_lists.sql` remains prepared but NOT deployed, as previously requested. Live database verification confirms `get_public_profile_lists(uuid)` is absent. Owner lists/fixtures work locally; live cross-account list viewing requires separate authorization and activation. The app reports unavailable lists without exposing the viewer's storage.
- Native iOS crash testing, device memory/performance, Google/Apple sign-in and real cross-device sync were not certified by browser QA on Windows. No new TestFlight build or App Store upload was performed.
- Source, `ios-web` and `ios/App/App/public` runtime assets must remain synchronized. Archived/build34 copies are untouched.

## Commands

```text
node --test tests/reading-metrics-stability.test.js tests/paid-collections.test.js
node qa/reading-free-audit-browser.cjs
node qa/profile-sections-browser.cjs
node qa/profile-header-browser.cjs
node qa/public-profile-layout-browser.cjs
node qa/work-list-presentation-browser.cjs
npm run ios:prepare
npm test
```
