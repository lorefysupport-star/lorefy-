---
kind: session
status: source-browser-verified-device-pending
date: 2026-10-28
---
# UI consistency: correction, safety and missing-work tools

Local continuation of [[sessions/2026-10-28-UI-Foundation-Phase-Five]].
Corrections/editor passed14 browser checks before Safety was edited. Safety
then passed15; the owner's subsequent continue request extended the batch to
Missing work drafts, verified separately. No GitHub, native build, production
operation or new plugin/dependency. UI/UX Pro Max error-recovery/feedback and
existing Apple/material guidance were used without changing frameworks.

## Shared chrome and ownership

Explicitly opted-in sheets get `.lf-product-studio`. The existing data-studio
stylesheet owns reusable sheet/header/section/action chrome; Data-specific
visibility rows remain `.lf-data-studio`. New trust-studio CSS owns correction,
safety and request content. Material/font/fallback variables include the actual
standalone `.lf-trust-studio` mount. No global palette or page reskin.

## Correction center and editor

- Direct AR/EN,44px tools,16px fields, wrapping records, localized dates with
  unavailable-date fallback. Original work title/IDs are not rewritten.
- `core.corrections.submit` only writes the device queue. UI now says saved on
  device, not sent to the server or already reviewed. No transport was added.
- Real form with associated labels, linked inline required error/focus and
  draft-preserving storage failure feedback. Detached/stale-account forms cannot
  write. Existing stored field names retained.

## Safety

- Direct AR/EN, empty/populated sections and explicit named Unblock/Unmute.
  Identifiers remain original. Stored statuses distinguish pending/local, open,
  resolved, closed and unknown; rendering is not live delivery/moderation proof.
- Single-flight pending feedback moves focus to enabled Close. Failure keeps
  the row, enables retry and focuses inline feedback. Existing core account,
  generation and service guards remain unchanged.
- Browser pending/failure substituted a deferred fixture rejection before the
  action. No actual block/unblock service or real mutation was invoked.

## Missing works

- Shared glass, visible native labels, regular16px values, local-only copy and
  empty state. Delete is a44px icon with the target draft's accessible name.
- Existing API validates public references/types. Field errors are inline,
  linked and focused; storage/limit feedback retains values. Detached/stale
  forms cannot save. Delete errors retain rows; success focuses the title field.
- Browser QA never saved a valid draft, deleted a draft or exported data.
  Source tests use isolated memory storage. No provider/publication behavior changed.

## Verification

-22 added tests:8 corrections,7 safety,7 requests. Full **2752/2752**,0 failures.
- **56/56** local Chromium cases:14 corrections,15 safety,15 requests,12 Data
  regressions. AR/EN,6 palettes,390/320px and short568px viewport, empty/populated
  and long identifiers, keyboard/return, inline errors and fixture-only recovery.
  No pageerrors. Fixtures restored; sampled unrelated content keys unchanged.
- Six runtime assets match both derived native web-copy directories. Cache
  `lorefy-v617-trust-studio`; no native preparation/build.
- Evidence outside repository: `artifacts/ui-execution-phase6-20261028/` contains
  full-tests.log, corrections-browser.json, safety-browser.json,
  requests-browser.json, data-browser.json, verification.json and screenshots.

Initial request QA failed on about:blank storage, then used the wrong fixture
owner fallback. These were setup errors, not passing cases. The final script
opens the local demo origin and follows actual owner precedence before seeding
and restoring fixtures. Final field-weight browser assertions pass after repair.

## Remaining

Real iPhone/VoiceOver/Dynamic Type, native export, live service delivery and
already-open language switching remain unverified. Prior outer Settings
synthetic-teardown Body-focus limitation is not fixed by this batch. Community
report editor, legal documents and the rest of the27-unit plan remain open.

[[systems/Privacy-Data]] | [[systems/Accounts-Sync]] | [[13-Project-Story]] |
[[14-Feature-Coverage]] | [[09-Data-Contracts]]
