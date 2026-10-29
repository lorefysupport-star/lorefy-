---
kind: session
status: local-browser-verified
date: 2026-10-26
aliases: ["immersive Explore", "selected Explore image", "full bleed discovery"]
---
# Selected Explore Reference

The owner supplied a new explicit visual target after rejecting the separated
featured-artwork composition. This supersedes the hero composition described in
[[2026-10-26-Explore-Cinema]], not Library's plain background or its four modes.
Current scope remains local only: no GitHub push, build, deployment or billing
change. Ambient Supabase billing tabs are not authorization to modify billing.

## Changes

- One actual-work backdrop starts at the top of Explore, behind the header,
  search and segments. It is absent in Search and Types, and never in Library.
- Featured content has a separate actual cover, open action, title, sourced
  rating/type and Add button. Add calls the existing reading-state editor; it
  does not silently write a library entry.
- Initial featured artwork is stable. Native details on the featured badge
  retain previous/next/manual selection and explicit opt-in slideshow controls.
  Reduced-motion behavior, account-derived ranking and rights-safe art remain.
- The first recommended preview renders three works. The six-item recommendation
  data and full See all collection are preserved. Covers have equal tracks;
  offscreen longer captions no longer inflate this preview's height.
- Runtime cache is `lorefy-v595-explore-immersive`. Four changed web files match
  both existing mirrors. Native preparation was not run.

## Verification

Final full suite:2541 passed,0 failed, exit0. Tests cover target identity, Add/open
callbacks, stable initial artwork and opt-in autoplay, scoped background cleanup,
three previews, unchanged full shelf data and fresh cache URLs. New regressions
failed before their changes.

Playwright checked Arabic/English at320/390/768px: no page horizontal overflow,
poster/title overlap or offscreen Add; three recommendations; backdrop at top;
removal of backdrop in local search and Types. Manual featured selection kept
background/poster/title/actions bound to the same work. Actual Add opened the
existing Berserk state editor while the isolated demo library stayed empty.

Source reference and implementation were normalized together to390x843 for
side-by-side visual QA, including iteration captures. [Latest design QA](../../design-qa.md)
records intentional real-catalog content and safe-area differences. Raw captures
and the derived comparison are outside the repository. The original supplied
image was not edited or bundled. No user account data was changed.

Live Supabase access, native performance and VoiceOver remain separate checks;
the earlier quota incident was not fixed by this presentation work.

[[systems/Catalog-Search]] | [[13-Project-Story]] | [[14-Feature-Coverage]]
