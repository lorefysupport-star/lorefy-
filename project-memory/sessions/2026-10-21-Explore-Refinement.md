---
kind: session
status: local-review
date: 2026-10-21
---
# Explore centering, independent section pages and compact filters

Owner reported off-center type labels, only the personal shelf expanding,
and overlong filter panels. Keep all changes uncommitted for review.

The type cover's obsolete two-row grid span created an implicit second row after
counts were removed; cover and label now share one row with centered text.
Section pages now select the full matching catalog directly by section key;
they no longer rebuild the disjoint short preview shelves and fall back to six
items when that shelf is absent. Type/genre/editorial/library/safety constraints
remain. A separate collection pager owns its catalog cursor. No pager request
runs before opening; each explicit open/Load more loads at most three missing
shards, renders 60 more cards, and yields between loads. Closing/account change
invalidates pending page results; failures retain a retry path. Actual finite
friend-rating lists are not padded with invented works.

Main preference options collapse into Formats/Genres with selections preserved.
Type filter uses three selects (Genre, Status, Sort), Apply and Reset. Removed
minimum-rating control from that panel. Expanded preference choices have a bounded
scroll area, rather than an unbounded list of checkboxes.

63 related tests pass, including independent pager cursors, no eager loading,
closed-page cancellation, long matching lists for eight section kinds, and
library/format/safety constraints. Browser demo: two non-personal themed sections
showed 60 cards; Load more reached 120. Main preferences measured 306px high,
type filter 405px (three selects, zero checkboxes); genre/status apply worked.
All eight type labels aligned to cover center within 0.01px in the 440px preview.
This is not a physical-device performance benchmark. Preserve earlier banner
and direct photo-framing work; no native build, Git commit or push.

[[systems/Explore-Works]] | [[13-Project-Story]] | [[14-Feature-Coverage]]
