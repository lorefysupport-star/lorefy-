# Community UI QA

## Reference

- Requested reference: `C:\Users\PCD\Pictures\Screenshots\Screenshot 2026-07-16 070336.png`
- Implemented view: `artifacts/community-unify-v3.png`
- Side-by-side comparison: `artifacts/community-unify-v3-comparison.png`

## Tested state

- Route: `community`, Manga type, All filter.
- Viewport: desktop preview with the app's simulated mobile frame.
- Content: review card with author, rating, text, top-character chips, work context, media, and actions.

## Result

- Full view: PASS. Community cards retain the feed controls while adopting the review-detail hierarchy from the reference.
- Focused card: PASS. The author, review text, chips, media, work context, and action controls have clear visual order and no collapsed vertical layout.
- Overlap check: PASS. The options control and avatar occupy separate corners; neither overlaps the content or media.
- Consistency check: PASS. The former coloured side accent and second card style are removed. Actions are Comment, Dislike, Like, and Share.

## Comparison-driven adjustments

- Stopped the review options menu from being mistaken for an action control, which had been collapsing the whole card.
- Kept a single review image large and full-width instead of rendering it as a small tile.
- Added the final spacing and anchoring pass for the avatar and options menu after visual comparison.

The community header and feed filters remain intentionally different from the reference because this is still the community feed; the review card itself now follows the requested visual language.
