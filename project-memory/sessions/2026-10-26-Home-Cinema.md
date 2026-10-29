---
kind: session
status: local-verified
date: 2026-10-26
aliases: ["Home cinema", "glassy home", "review dislike"]
---
# Cinematic Home Only

Owner approved the second Apple/Glassy image direction, then authorized Home
implementation first, section by section. Library, Explore, Profile and their
saved appearance choices remain outside this redesign. Local only: no commit,
push, native build, Apple upload, database change or production deployment.

## Implementation

- `modules/lorefy-home-cinema.js` renders the actual account-derived Continue
  reading works, capped at four, with selected-work controls and existing
  progress summaries/open callbacks. Unknown totals produce no invented meter.
  Empty accounts get an Explore action, never a fabricated reading entry.
- The commissioned Berserk background is bound to its exact canonical work ID.
  Other works use their actual banner or an ambient cover treatment. Rights-safe
  configuration suppresses the commissioned background. No account cover changed.
- Home-only CSS adds dark full-bleed artwork, system typography, glass filters,
  a three-cover friend rail, unframed reviews and glass navigation. Important
  layered rules isolate it from legacy styles; leaving Home removes this scope.
- Existing Dislike persistence is retained. Dislike now paints immediately,
  removes Like when necessary and ignores duplicate taps while pending. Save is
  independent; labels/counts and existing offline feedback are preserved.
- A repeatable guarded patch tool hooks the renderer into the large legacy app;
  the previous renderer remains the module-missing fallback.
- Runtime JS/CSS/HTML/SW/artwork selectively copied to both shipped web folders.
  `assets` is included in future web preparation. No native preparation was run.

## Evidence And Limits

Full JavaScript suite: 2523 passed, zero failures. Focused coverage includes real
checkpoint selection, missing totals, empty reading, artwork binding, cache URLs,
optimistic reactions, realtime acknowledgement and duplicate pending taps.

Browser demo: Continue opened the same work and retained its saved stop point;
Following/For You selection worked. Like -> Dislike cleared Like, incremented
Dislike once, and Save stayed selected independently. Test reactions were restored.
Small-screen layouts have no document horizontal overflow, and visible work images
loaded. Library route retained its existing layout with no Home scope present.

The fixed-width live harness is `qa/home-cinema.html`; it changes viewport/route
only and does not seed, clear or alter account content. Raw captures and logs are
outside the repository/vault in the task artifacts folder. See
[Home design QA](../../docs/HOME_CINEMA_QA.md).

Physical iPhone performance, real-account backend reaction synchronization and
native safe-area certification are not certified by this browser-only pass.

[[systems/Community-Notifications]] | [[13-Project-Story]]

## Owner Follow-Up: Tweet Reference And Library

The owner rejected the softened background and requested the compact reference
tweet geometry plus a matching composer. The cover backdrop is now sharp; dark
contrast shading is not a blur. Home reviews retain their React-owned children,
but use a left avatar/name/time, exact numeric score with a single Star, full-width
copy and compact cover/author attachment. Like/Comment/Dislike/Save/Share remain.
Original recommendation information is retained in the rating's accessible name.
No stored scores or review contents are rewritten. Other review contexts retain
their original rating display.

The composer now uses a bounded dark/glass sheet and mint publish state; its
existing account drafts, input counter, picker, focus trap and viewport cleanup
remain unchanged. A legacy full-width reaction-button rule was caught in the live
browser and explicitly bounded. Source/focused checks pass. The last composer
flex-space correction still needs a fresh visual pass.

Owner then authorized Library as the next separate section. See
[[sessions/2026-10-26-Library-Cinema]]. Combined full suite:2530 passed. Browser
control subsequently failed while writing its own kernel assets. Alternative
Playwright permission was requested; do not mark the remaining visual checks
complete from source tests alone. Local only, no push/build/deploy.

### Follow-Up Visual Acceptance

The owner approved Playwright and the final visual checks are complete locally.
Sharp Berserk artwork, exact fractional numeric-Star ratings, five compact
review actions and the text-post renderer were inspected. Like -> Dislike clears
Like; Save remains independent. Reaction test toggles were restored. Composer
draft text survives cancel/reopen and was cleared after inspection. At320px and
a constrained450px viewport, its footer stays inside the sheet (1px bottom inset).
This validates constrained browser geometry, not a physical iPhone keyboard.

Library's separate24-case matrix and final2531-test suite are recorded in its
session. Screenshot fixtures use synthetic local checkpoints, not user data.
