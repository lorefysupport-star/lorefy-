---
kind: session
status: local-review
date: 2026-10-21
---
# Pinned Home feed filters

Owner requested For You/Following at the top and visible while scrolling.
Moved the existing React filter row inside the Home header, above Continue
reading. Header stays sticky with safe-area padding. Community enhancement
finds the external row, preserves AR/EN tab labels and selection/keyboard
semantics, and keeps the post feed anchored inside its own community page.
No cloned row, scroll listener, extra request or new persisted preference.

35 related community/scroll/refresh/UI tests pass. Browser demo switched
Following and back, preserving selected state and feed. At scrollTop 801.25,
tab-row top remained 123.994px (same as at scrollTop 0). Equal-width styling
is scoped to the moved row. Local change only; no commit or push. Existing
profile, Explore and framing changes retained. Native web assets synchronized
for Device Hub; no native build or Apple upload.

[[systems/Community-Notifications]] | [[13-Project-Story]] | [[14-Feature-Coverage]]

Removed the legacy first-child tab inference in growth enhancement and scoped
old first-child tab CSS to actual tab rows, preserving the friend rail layout.
