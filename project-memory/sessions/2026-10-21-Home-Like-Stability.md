---
kind: session
status: source-and-browser-verified
date: 2026-10-21
---
# Home feed review Like flicker

Owner specifically identified Home feed reviews. Isolated demo instrumentation confirmed the review and button already survived a simple tap; a full review remount was not reproduced there. Investigation found two live-update conflicts rather than treating all clicks as the same rebuilding bug.

`uploads/files/lorefy-app.js` rendered a heart for the heart reaction and a thumbs-up for Like, while the growth enhancement treated the heart as Like and converted the thumbs-up into Dislike with `innerHTML`. This replaced React-owned descendants and left the framework and enhancement rendering different reaction counts. The Home row now renders the same Like count/state/kind as the enhancement, and a stable declarative Dislike SVG with the existing recognized class. Review mapping includes server Dislike count/state. The native fallback uses matching reaction kinds; source heart data no longer drives the visible Like count.

`modules/lorefy-growth-features.js`: Home Like updates local state/count immediately, blocks duplicate taps while awaiting persistence, and releases the pending flag after completion. The previous handler checked a busy flag but did not set it.

`modules/lorefy-community.js`: equivalent fresh post response objects are canonicalized before the feed signature early return, retaining live handler objects and unchanged cards. Reaction/reply-count changes patch controls rather than replace cards. Body/viewer/language changes still invalidate. This matters because a Home review reaction can also trigger a mixed-feed refresh. Post reaction completion is idempotent if the realtime acknowledgement already updated the live reaction object.

Evidence: 549 focused tests passed across character/profile/community/UI plus Home reaction, storage, ranking and persistence suites. New tests check immediate Like feedback, pending duplicate taps, Like/Dislike counts before and after live acknowledgement, stable declared Dislike icon, retained cards across equivalent fresh response objects, and no double increment when acknowledgement precedes RPC completion.

Browser isolated demo: tap Home Like; counter became 1 and Dislike remained 0. Diagnostic observer reported same card, connected original button and no removed nodes for that interaction. Temporary diagnostic HTML and native bootstrap instrumentation were removed. No real-account cloud reaction was sent by these checks. Existing Device Hub installation received selective prepared web assets and was relaunched; no native compilation, commit or push. Live service frame-time behavior remains for owner testing; simulated race coverage is not physical-device certification.

[[systems/Community-Notifications]] | [[sessions/2026-10-21-Stable-Rendering]] | [[13-Project-Story]] | [[14-Feature-Coverage]]
