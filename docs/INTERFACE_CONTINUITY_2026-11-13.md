# Interface continuity

Date: 2026-11-13. Source-only implementation; no native build or service change.

## Reference

The owner's [reference post](https://x.com/Kubai087/status/2120320609255043510)
demonstrates continuity between navigation, cards, search, player, charts and
menus. Its public 30-second video was viewed in the browser. The touched object
carries into the next state. Lorefy has no music player: adding one or copying
decorative motion would not serve its reading workflows. Third-party prompt text
was reference, not project instructions.

Developer-local UI Animation and Apple Design guidance was used. No new library,
plugin, framework, animated blur, sound or perpetual animation loop was added.
Existing immediate press feedback, gestures and decoration motion owners remain.

## Shared implementation

- `modules/lorefy-interface-continuity.js` observes only a short activation window,
  never idle pages. Click/focus arms a coalesced frame and a 650ms deadline;
  navigation, capsule movement or a new dialog ends observation immediately.
- A new keyed route receives a 180ms directional hint. Tab navigation follows
  physical button positions; detail Back reverses direction. The old automatic
  route CSS entrance is suppressed. Passive hydration, reactions and list updates
  do not replay a screen entrance.
- A loaded cover travels into the matching work poster in 260ms. Returning targets
  a visible matching card, never full-bleed backdrop art. Missing, mismatched or
  undecoded images fall back to ordinary immediate navigation.
- Filled selected controls move their existing capsule in 230ms: dock, profile
  sections and other segmented groups. Source paint is captured before selection
  changes; transparent underline tabs stay underlines. Rapid reversals retain the
  capsule's on-screen rectangle and paint, not its old destination.
- Search field geometry continues into search mode in 200ms. Dialog entrances use
  220ms; menus use 160ms from the triggering control. Existing dismissal, focus
  traps and gestures own their actions. Pointer-down cancels dialog entry before
  a drag begins.
- Finite WAAPI effects use transform/translate/scale/opacity only. No action,
  save or navigation waits for motion. Hidden pages, reduced motion, resize,
  pagehide and auth changes cancel pending work. No account data is stored.
- `styles/lorefy-interface-continuity.css` preserves palettes/artwork. Temporary
  layers are aria-hidden and pointer-transparent. No screens/dialogs are cloned;
  cover overlays reuse the loaded URL, subject to browser cache revalidation.

Entry/cache v713 ships the two new assets. Only these, entry and service worker
are mirrored into `ios-web/` and `ios/App/App/public/`.

## Verification

Final full suite: 3541 passed, zero failed/skipped, 110955ms. Source/native web
mirrors were checked byte-for-byte; no native compilation was performed.

Eight tests in `tests/interface-continuity.test.js` cover invalid/zero geometry,
interruption, cancelled promises, reduced/hidden/unsupported environments, bounded
observers, disabled controls, auth teardown, decoded matching images and cache.
The first run failed before implementation. Eight older cache assertions were
advanced to v713; feature-specific asset/behavior assertions remain unchanged.

Actual Chromium demo checks observed:

- Home, Explore, Library and Profile navigation: 180ms route / 230ms capsule.
- Normal, Panorama and Reader selections: section capsule works, no horizontal
  overflow. Dark/light/pink paint remains theme-derived.
- Search retains input focus; Review immediately focuses Close during 220ms entry.
- Work menu grows in 160ms from its trigger rather than the screen center.
- Matching cover forward/back; return target 103x156 instead of backdrop art.
  The first pass caught and corrected a transparent capsule and broad selector.
- Actual CSS widths 320 and 433: no document horizontal overflow.
- Settled runtime: zero owned effects, temporary layers/attributes and observers;
  no browser error logs in the inspected demo session.

Evidence stays outside Git under workspace `artifacts/interface-continuity-20261113/`:
browser receipt and eight consecutive screenshots. Full test output is in
workspace `artifacts/interface-continuity-tests-20261113.log`.

## Limits

Shared infrastructure is not a bespoke morph for every field. Existing sheet
exits stay feature-owned; no dismissal is delayed or replaced with cloned dialog
content. Animation does not accelerate slow image/search services. Physical
iPhone frame pacing, VoiceOver, resume and installed-beta acceptance remain open.
