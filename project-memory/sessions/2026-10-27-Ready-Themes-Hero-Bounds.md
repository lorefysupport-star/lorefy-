---
kind: session
status: source-browser-verified-device-pending
date: 2026-10-27
---
# Ready Themes and Featured Title Bounds

Follow-up to [[2026-10-27-Profile-Custom-Glass]]. Owner screenshots exposed
incomplete coverage: actual theme was `pink`, not `custom-light-*`. The earlier
custom-only matrix missed this mode. Profile respected Pink while cinematic
screens stayed dark, leaving inherited pink-page ink unreadable on dark chrome.

## Changes

- `modules/lorefy-design-system.js`: literal alias tokens now cover ready-made
  Light/Pink as well as arbitrary custom palettes. Default Dark remains unchanged.
- `styles/lorefy-custom-glass.css`: exact Light/Pink/custom scopes bridge all
  cinematic roots, sheets and navigation. Header/Continue-reading materials,
  friend names/scores, review scores/reactions, composer FAB and type controls
  get readable semantic colors. Media remains sharp; original data are untouched.
- `styles/lorefy-explore-cinema.css`: featured copy uses a shrinking single grid
  track and explicit poster budget. Full-width bounded title button wraps within
  two lines. Shared poster width and20px gap replace independent overlapping
  widths; desktop content is bounded without the old conflicting inset rule.
- Fresh cachev602; theme assets20261027-theme-unity-v2 and Explore CSS
  20261027-hero-bounds-v2. Five runtime files match both mirrors (10 hashes).

## Evidence

New regressions failed before implementation. Browser reproduced actual Pink
plus a long title crossing into the cover; after repair the page background
matched Pink and the title-to-poster gap was20px.

Fresh browser matrix:36 Light/Pink profile cases across three layouts, AR/EN
and320/390/430px;40 main-route cases across five themes and two widths;36
English/Arabic long-title cases across Dark/Light/Pink and320/390/430/1280px.
Titles stayed inside their card with at least16px clearance, bounded two-line
height and no horizontal text spill. Screens retained expected theme background.

Existing IAB local-demo data confirmed actual `is-pink` Home uses the new v2
assets, pink background and readable heading, reading title and Continue action.
Original profile covers were decoded from their original provider URLs during
inspection; transient placeholder artwork is not claimed as a repaired network
or provider problem. No saved reading/profile data or theme was changed there.

Final `npm test`:2591 passed,0 failed,exit0,52.8 seconds. Screenshots,
logs and executable matrices stay outside Git/vault in task artifacts.
Local only: no commit, push, native build, release or backend write. Actual iPhone,
VoiceOver, image-provider availability and final owner visual acceptance remain
separate gates.

[[systems/Profiles-Lists]] | [[systems/Appearance-Bundles]] |
[[13-Project-Story]] | [[14-Feature-Coverage]]
