---
kind: session
status: selected-six-ear-study
date: 2026-10-25
---
# Elven Cosmetic Concepts

The later [[2026-10-25-Elven-Local-Motion]] supersedes the ear-only implementation
state and source/layout TODOs below. Historical concept-selection evidence remains.

## Latest Owner Selection

The owner selected ONLY the six designs visible in their screenshot:1A,1B,1C
(elf ears) and2A,2B,2C (woodland). Moon/court concepts remain archived assets,
not visible or approved in the current gallery. The owner requested a small ear
twitch and asked for motion-video research before implementation.

- Reviewed two animated visual references in the browser:
  [High Elf Archer ear twitch](https://tenor.com/view/happy-ear-twitching-high-elf-archer-goblin-slayer-gif-11925863358911879955)
  and [Nephy ear wiggle](https://tenor.com/view/nephy-elf-ears-anime-anime-nephy-ear-wiggle-nephy-nephtalia-gif-12070323842121564569).
  These are motion-study references, not artwork imported into Lorefy.
- Technical reference: [Spine physics constraints](https://esotericsoftware.com/spine-physics-constraints)
  for a fixed bone/root and secondary motion. No Spine runtime, license or paid
  dependency was installed.
- [Ear study](../../qa/elf-concepts/ear-motion.js) now animates ONLY the three
  selected ear pairs in QA. Independently timed root pivots, under3.2 degrees,
  short damped pulses with long rests; about9 seconds of each12-second loop rests.
  The ring, portrait aperture and page frame do not rotate/wobble.
- Cached raster masks have a feathered root transition and a fixed joint cap.
  A first hard polygon trial visibly cut silk ribbons; superseded by the feathered
  mask. Artwork has5% internal padding so tips do not clip while moving.
- One30fps loop for visible QA canvases, offscreen/background pause, zoom cleanup,
  plus local playback/seconds controls for deterministic visual inspection.
- Selection radios were removed after approval. The gallery displays exactly six
  codes and exports their approval manifest, still `appliedToApp:false`.
- Fresh focused suite:53 passed. Three corrected rest/action screenshot pairs
  sampled every2px at RGB difference>20:1A3090,1B1572,1C3320 changed samples.
  For ALL three, changed samples outside ear bands, protected middle and lower
  ring/page were0. Screenshot artifacts stay outside the repo.
- Remaining: final separated ear/jewelry layers, forest motions, page-border motion,
  calibration and acceptance in all three actual layouts, and physical-device FPS.
  This is a local hinge study, not a finished or shipped six-pack collection.

## Scope and State

The owner requested four new elf-themed families, three initial alternatives per
family, with an elf-ear option. The original round produced twelve STATIC choices,
not twelve implemented animations. Latest approval above supersedes selection state.
Existing Atelier packs, avatar rigs, page borders, account data and app entrypoints
are unchanged. No GitHub push, native build, upload or production service change.

- [Local gallery](../../qa/elf-concepts.html) displays each choice's PFP and matching
  page border with independent zoom, light/dark background and optional selection.
- [Manifest](../../qa/elf-concepts/concepts.json): 1A-1C elf ears, 2A-2C woodland,
  3A-3C moon, 4A-4C high elven courts. These names are original aesthetic directions,
  not a claim of canonical fantasy taxonomy.
- Four original ImageGen comparison sheets are stored in `qa/elf-concepts/`:
  ears.png, woodland.png, moon.png and courts.png. Each is1536x1024 RGBA, with
  transparent portrait/page apertures. No Discord asset was copied.
- Slice windows account for unequal composition gutters. Some detached ornaments
  share atlas gutters; complete uncropped boards are linked beside each family.
  These concept sheets are not calibrated production sprite atlases.
- Gallery selection uses only `lorefy.qa.elf-concepts.v1`, validates saved codes,
  exports a local JSON explicitly marked `appliedToApp:false`, and can be cleared.
  It does not change account decoration preferences, permissions or the catalog.

## Skills and Plugin Research

Before artwork generation, installed these development-only skills using the
official skill-installer helper, then verified their local SKILL.md and references:

- [LottieFiles motion-design](https://github.com/LottieFiles/motion-design-skill):
  `C:/Users/PCD/.codex/skills/motion-design`, motion layers/material timing.
- [mblode ui-animation](https://github.com/mblode/agent-skills/tree/main/skills/ui-animation):
  `C:/Users/PCD/.codex/skills/ui-animation`, independent lead/lag and measurement.

Read choreography references from both. Future motion proposals use fixed
structures plus independent primary pivots, secondary jewelry/cloth follow-through
and restrained ambient accents; no whole-image wobble. Existing owner motion
preferences take precedence over generic skill defaults. Skills are guidance,
not dependencies shipped into Lorefy; automatic skill discovery is next-turn.

Plugin search for animation/Lottie/Rive returned Runway, Higgsfield and installed
Figma. Suggested only Runway for optional animated concept-video generation. A
later fresh directory check confirmed Runway installed and ENABLED. No Runway
generation, credit expenditure or private asset upload was performed.

## Initial-Round Verification and Limits

- New manifest isolation test failed first because the feature was absent, then
  passed. Focused elf/rig/Atelier/frame/shop suite:52 passed,0 failed.
- Gallery JavaScript passes `node --check`.
- Browser: all12 zooms load1536px sources with no modal horizontal overflow.
  Selection replacement/persistence, download JSON and reset/reload were exercised.
  Test selections were cleared before handoff; no options are preapproved.
- Desktop1280 and mobile320 views were checked. All12 images loaded, no document
  horizontal overflow; light/dark render against actual alpha transparency.
- Narrow-screen sticky header initially obscured anchor titles; mobile toolbar
  is now non-sticky. Temporary viewport overrides must be reset after final check.
- Full application suite not rerun: only an isolated QA gallery, artwork and note
  were added. Existing52 targeted checks pass, not a new device certification.
- At the initial selection round, no elf animation was implemented. The later
  three-ear QA study above supersedes only that statement, not device readiness.
  Before app adoption:
  redraw/separate proper animation layers and pivots, calibrate apertures, then
  implement and validate in all three profile layouts without obscuring controls.

[[systems/Appearance-Bundles]] | [[13-Project-Story]] | [[14-Feature-Coverage]]
