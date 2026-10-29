---
kind: session
status: source-browser-verified-device-pending
date: 2026-10-28
---
# Reading titles, bidi and text enlargement

Continuation of [[sessions/2026-10-28-UI-Foundation-Phase-Nine]]. UI/UX Pro Max,
Apple, accessibility, systematic debugging and test-first guidance applied.
Plugin Management selected existing tools; no new dependency or plugin needed.
Local only. This covers reading-title portions of F06, not all app typography.

## Reproduced and repaired

- Library title inherited LTR/left alignment without explicit direction or full
  title metadata. Display now uses literal full text, `dir=auto`, isolation and
  start alignment; checkpoint direction follows app language separately.
- Home resume and Reader current-reading titles could expand unpredictably.
  Stable two-line slots now preserve metadata flow. The resume uses a container
  query to put its cover above the copy when the component is narrower than240px;
  no viewport-scaled font size is used.
- Library title tracks and Showcase captions used fixed heights. They can now
  grow with enlarged text. Showcase uses `2lh` with a `2.8em` fallback so its box
  follows the effective line height, including legacy layered important rules.
  An attempted unlayered line-height override did not win that cascade and was
  superseded; the final fix does not depend on that override.
- Showcase captions could stay stale when React updated an existing title node.
  `lorefy-library-view.js` observes only its `data-work-title` attribute and
  source-title character changes in addition to existing child-list changes.
  One animation-frame mount is coalesced; generated caption changes and unrelated
  prose/attributes do not trigger a new pass. Full tooltips update with labels.
- Public-profile favorite/library titles now follow the same full-text/direction
  contract. Visitor-library text was10px and single-line; it is now13px/two-line,
  with12px metadata. Viewer and displayed-reader ownership were not changed.

## Files and boundaries

Runtime: `uploads/files/lorefy-app.js`, modules `lorefy-home-cinema.js`,
`lorefy-reader-layout.js`, `lorefy-library-view.js`, `lorefy-public-profile.js`;
styles `lorefy-home-immersive.css`, `lorefy-library-refined.css`,
`lorefy-profile-refined.css`, `lorefy-book-showcase.css`; `index.html` and `sw.js`.
`tools/patch-reading-typography.mjs` uses exact-once guarded mechanical anchors.
Cache: `lorefy-v621-reading-type`; changed asset version:
`20261028-reading-type-v1`. Eleven runtime assets selectively mirrored, without
native prepare, build or sync. Frozen release artifacts were not touched.

No stored title truncation/translation, source artwork/theme replacement,
progress/status/review-credit algorithm change, catalog/schema change or real
save. Favorites7, Showcase3 and Bookshelf7 remain existing presentation rules;
the full Library still shows all matching works.

## Verification

-19 new regression tests, with relevant failures observed before fixes.
  Full source suite:2833 passed,0 failed.
-72 browser cases,0 uncaught page errors:42 owner/home/library/profile matrix,
  6 boundary checks and24 visitor-library cases. AR/EN, widths320/390/1280,
  dark/pink/custom green, Normal/Panoramic/Reader, grid/list/Showcase/spines.
- Mixed Arabic/English, long unbroken text, short titles and literal source word
  `توقف` checked. Full DOM title/tooltip preserved; two-line boxes, direction,
  horizontal containment and caption growth checked at normal and2x font size.
- Boundary checks include a220px Home container, Reader metadata/progress flow,
  unclamped full Work heading and updating an already-mounted Showcase caption.
  Initial failed evidence retained; final JSON files all pass.
- Visitor fixtures mount the actual PublicProfile component in isolated contexts
  with no backend client. This checks display and preserves viewer storage; it
  does not prove a real two-account service visit. All QA contexts closed.
- Screenshots inspected for Home, Library grid/Showcase, Reader and narrow Home.
  Browser fixtures do not certify external artwork availability.
- Evidence: external `artifacts/ui-execution-phase10-20261028/` contains scripts,
  JSON, screenshots, full test log and byte-parity/parse verification.

## Remaining

Inline2x font testing is not physical iPhone Dynamic Type, browser zoom or
VoiceOver certification. Real device, account/service and image-provider gates
remain. Remaining community/counter copy, long authors and other F06 text
surfaces need separate work; the27-unit plan is not complete. No GitHub, Apple,
Supabase write or native build occurred.

[[13-Project-Story]] | [[14-Feature-Coverage]] | [[systems/Reading-Library]] |
[[systems/Language-Media]] | [[systems/Profiles-Lists]]
