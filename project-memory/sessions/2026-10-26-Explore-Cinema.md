---
kind: session
status: local-browser-verified
date: 2026-10-26
aliases: ["Explore cinema", "plain Library", "glassy discovery"]
---
# Explore Cinema and Library Background Removal

Selected-image follow-up: [[2026-10-26-Explore-Immersive-Reference]] supersedes
the separated hero with full-bleed artwork behind the header, a real cover and
Add action. Library background removal and prior source evidence remain valid.

Owner requested removing the book photograph behind Library controls, then
implementing the already approved glass/cinematic style in Explore. Local only:
no GitHub push, native build, Apple upload, service deployment or billing change.

The automatic Library backdrop component, CSS and legacy renderer hook were
removed. Its four modes and all account data remain. This supersedes only the
background decision in [[2026-10-26-Library-Cinema]], not the rest of that design.

Explore's React component now has a dedicated presentation scope and stylesheet.
Existing Home artwork selection supplies correct-work art and respects rights-
safe media. Actual titles/authors, controls, search, filter sheets and nav use the
same dark/mint system typography. No catalog, stored score, banner or cover edits.

Browser testing exposed stale values transferred from controlled format search
to uncontrolled global search. Distinct React keys isolate them. Explore sheets
are viewport-anchored and hide the nav while open, preventing action obstruction.

Final2537 source tests pass, zero failures. Explore30 responsive/bilingual cases
and Library24 cases pass; isolated demo fixture entries were removed afterward.
See [QA scope and evidence](../../docs/EXPLORE_CINEMA_QA.md), including a discarded
host-memory-limited run and external-image/service limitations. Seven runtime
files match both web mirrors. No native or real-account certification claimed.

[[systems/Catalog-Search]] | [[systems/Reading-Library]] | [[13-Project-Story]]
