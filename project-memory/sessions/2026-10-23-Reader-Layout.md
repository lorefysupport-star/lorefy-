---
kind: session
status: local-verified-service-pending
date: 2026-10-23
---
# Reader: third selectable profile layout

Owner selected the supplied white Profile visual and requested that it be a
layout choice alongside Normal and Panoramic. All work stays local; no GitHub
push, native build, release or production database change.

## Implementation

- [Layout contract](../../modules/lorefy-profile-layout.js): `reader` is the
  third allowed value, with AR/EN radio labels and a preview in the existing picker.
  Existing editor draft/save/cancel and account-scoped storage remain in place.
- [Reader composition](../../modules/lorefy-reader-layout.js) rearranges React
  elements before mounting. Existing layouts return their exact original tree.
  Root keys isolate layout changes from imperative profile enhancements.
- [Reader stylesheet](../../styles/lorefy-reader-layout.css) is profile scoped:
  opaque real banner, offset avatar, full cover rail, reading rows and statistics.
  Reading rows use actual saved status/progress; empty accounts show an empty state.
  Character insertion follows statistics in Reader only. Existing tools remain
  available through settings/customization and cover editing.
- Owner and public renderers use the same selected layout; discovery preserves it.
  Public composition preserves the owner's theme, artwork and follow handler.
- [Pending migration](../../supabase/migrations/20261023193458_reader_profile_layout.sql)
  extends only the installed artwork projection whitelist. It preserves the
  existing function body and privileges and fails if its expected anchor changed.
  NOT applied to Supabase. Live visitor parity still needs that migration and service QA.
- Updated cache keys and copied only changed web assets to both generated bundles.
  No native compilation, packaging, secret changes or release performed.

## Evidence and limits

New choice/normalization, original tree identity, owner/public composition,
real progress actions, directory layout and stable character placement have
behavioral tests in [reader-layout](../../tests/reader-layout.test.js) and
[profile-layout](../../tests/profile-layout.test.js).

Browser: saved Reader, reloaded, re-opened picker, cancelled a Normal draft,
saved Panoramic, saved Normal and restored Reader. Lists hide overview sections.
EN light, EN dark at 320px, and decorated header inspected. No captured JS errors.
The source mock's fictional content was not copied over saved account data.
Existing Lorefy fonts, safe areas, navigation routes and custom colors are retained.
Physical-device and live service checks remain unverified.

The first all-suite run exposed Node heap limits in catalog tests; those 49
cases passed with an 8GiB heap. A later 2421-test run passed before the final
character-placement refinement. Its 61 focused cases passed after refinement.
Final full run: 2422 passed, 0 failed/skipped/cancelled, exit 0, with the 8GiB
heap. See local artifacts `reader-layout-tests-complete.txt`.
Final browser artifacts: `reader-layout-ar-final.png`, `reader-layout-picker.png`
and `reader-layout-en-dark-320.png` in the chat's external artifacts directory.
The decorated AR toolbar and crest leave separate center/edge channels.
UI acceptance notes and comparison paths: [design QA](../../design-qa.md).

## Detail polish - 2026-10-24

User accepted Reader and requested finer typography, copy and symbols.
Scoped changes retain artwork, saved layout/handlers and account content.
Readex Pro remains the Arabic face; English uses the system UI stack through
the existing `--ui-font` token. Heading weights use 600 rather than synthetic
750, captions are at least 12px, cover labels 13px and bio 15px. Lucide strokes,
44px action targets, tooltips, focus and reduced-motion states are consistent.
User-entered emoji are untouched; no decorative emoji added.

Reading copy now says "Currently reading" / "أقرأ الآن". Chapter ratios use
LTR `bdi` to prevent RTL reversal; progress has localized `aria-valuetext`.
Unknown totals do not invent percentages. Statistics align at the top despite
multiline labels, and long favorite-type values can wrap. Character headers
follow the current writing direction with a visible edit caption.

Three new behavioral regression tests first failed, then passed. Browser
checks cover Arabic light 390px, English dark 320px, lists and overview,
actual computed font and no profile-level horizontal overflow. Only changed
web assets copied into generated bundles; no native build or deployment.
New evidence: `reader-details-tests-final.txt`, `reader-details-en-dark-320.png`
and `reader-details-ar-390.png` in this chat's external artifacts directory.
Existing physical-device/live-service limits above remain unchanged.
Final full suite after the polish: 2425 passed, zero failures/skips/cancellations,
exit 0 with an 8GiB Node heap. No captured browser console errors.

[[systems/Profiles-Lists]] | [[13-Project-Story]] | [[14-Feature-Coverage]]
