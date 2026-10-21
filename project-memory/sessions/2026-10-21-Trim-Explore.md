---
kind: session
status: local-review
date: 2026-10-21
---
# Trim Explore rows, retain short reads

Owner approved retaining Picked for you, favorite genres, Popular with friends
and short reads. Removed themed editorial preview rows, Complete stories,
New voices and Beyond your usual shelf from Explore construction. Editorial
catalog records remain available in search/type browse. Bilingual duplicate
genre preferences merge into one row (up to three unique genres), preserving
stored choices and original genre indices for on-demand full lists. Existing
canonical work exclusion across previews remains. Explore hides New from friends;
Home retains it, while Popular with friends remains only in Explore.

Short reads retains its normal preview when enough eligible works exist. If the
initial recommendations lack matches, it remains a labeled on-demand entry;
no extra shards are fetched just to fill that preview. Existing full-list
paging remains bounded and click-driven. No change to the featured carousel.

45 related tests pass. Browser demo verified the retained headings and removal
of redundant themed/social rows. No benchmark claim, commit or GitHub push.
Prior local UI/banner/framing changes retained; simulator assets updated.

[[systems/Explore-Works]] | [[13-Project-Story]] | [[14-Feature-Coverage]]
