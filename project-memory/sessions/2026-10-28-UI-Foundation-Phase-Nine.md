---
kind: session
status: source-browser-verified-device-pending
date: 2026-10-28
---
# Reading-state display vocabulary

Continuation of [[sessions/2026-10-28-UI-Foundation-Phase-Eight]]. Existing
UI/UX Pro Max consistency/accessibility and Apple skills used. Plugin Management
selected installed tools. Local only: no installation, GitHub, production action
or native build. This covers the reading-label portion of F05, not every string.

## Reproduced

Library, Profile, Work Status, Import and visitor library used different labels
for the same stored reading state. Work Status labels were tied to option index.
Profile result covers were clickable divs with empty image alt: the accessible
snapshot contained no named work action and keyboard activation was unavailable.

## Contract and consumers

`modules/lorefy-i18n.js` owns display-only `readingStatusLabel(value, language)`
and `readingStatusEmpty(value, language)`. Arabic labels are أقرأ الآن / قرأته /
أرغب بالقراءة / متوقف مؤقتًا / توقفت نهائيًا. English remains Reading / Completed /
Want to read / Paused / Dropped. Historical storage values remain أقرأ حالياً /
تم القراءة / قائمة الأمنيات / توقف / توقف نهائي. Unknown strings pass through.

These functions are called only at reading display sites. The general translator,
publication metadata, user prose, saved values, progress/checkpoint calculations,
review credits and synchronization algorithms were not changed.

- App badges/work action, Library and Profile filters use the shared label.
  Counts, selected keys and filtering remain in existing React state. Dead label
  arrays removed from minified filter render sites.
- Work Status labels follow the actual choice value. Existing selection/save/
  progress/removal callbacks remain unchanged.
- Import chips share the labels but retain original pasteStatus values and
  explicit preview/confirmation. No provider fetch or actual import ran.
- Visitor library formats the displayed reader's statuses, not the viewer's
  saved library. Three layouts checked with fixture props, not real accounts.
- Library/Profile state-empty messages share five meanings; search-empty and
  introductory messages stay separate.
- Profile result covers are named native buttons with unchanged open-work
  callback/geometry and no default button padding/background. Enter was tested.

`tools/patch-reading-terminology.mjs` guards mechanical minified source anchors
and asset keys. Cache: `lorefy-v620-reading-terms`. Eight runtime files selectively
mirrored byte-for-byte. No prepare/sync/native compiler ran.

## Verification

-22 new regressions:18 initial failures, then cache, named-button and two empty
  library cases separately observed failing before fixes.
- Full suite:2814 passed,0 failed. Test fixtures were updated to provide the new
  shared i18n dependency; old literal-array assertions now check shared filters
  while retaining Paused/Dropped and stale-owner import rejection behavior.
-51 browser cases:36 owner/library/status/import plus15 empty/visitor/keyboard.
  Normal/Panoramic/Reader, AR/EN, dark/pink/custom green, widths390/320, all five
  filters, draft-only selections and unchanged sampled library/progress values.
  Zero uncaught page errors. Isolated QA contexts closed afterward.
- Initial profile test searched cover-only innerText for titles; retained as
  `reading-browser-initial.json`. DOM inspection also exposed the actual missing
  accessible action. Final checks assert work IDs and accessible names. Browser
  uses the visible quick toolbar rather than its hidden legacy source.
- Screenshots inspected: status dialog, library, reader profile and fixture
  visitor labels. Fixture visitor rendering is not an audit of all its chrome,
  translations or external cover availability.
- External evidence: `artifacts/ui-execution-phase9-20261028/` contains scripts,
  browser JSON, screenshots, full-tests.log and final verification.json.

## Remaining

No real library save, import, review or service mutation. iPhone/VoiceOver, a real
two-account visit, full counter grammar, community strings and long-title/bidi
composition remain separate gates. The27-unit plan is not complete.

[[13-Project-Story]] | [[14-Feature-Coverage]] | [[systems/Reading-Library]] |
[[systems/Language-Media]]
