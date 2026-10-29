# Home Cinema Design QA

Date: 2026-10-26. Scope: Home only, local review.

## Approved Direction

The approved Home concept uses a dark full-bleed work illustration, right-aligned
Arabic title, glass For You/Following controls, a right-side reading cover,
mint progress, three friend covers, community reviews and glass bottom navigation.
Implementation retains actual account data rather than copying mock ratings,
names, progress or books. Dislike is an authorized addition to the reference.

## Checks

- Home composition and glass controls compared visually against the approved
  image, with live reading data. Account media is not replaced by mock content.
- System font stack, zero tracking, visible keyboard focus and 44px controls.
- Narrow and regular phone widths: copy/cover stay in bounds; three friend covers
  align; the navigation remains fully visible; no document horizontal overflow.
- Sticky feed tabs remain visible when scrolling into reviews.
- Continue opens the actual selected work, preserving its progress summary.
- Following/For You updates selection and the existing feed, not a cloned feed.
- Like and Dislike are mutually exclusive. Dislike paints immediately; Save is
  independently toggleable. Demo reaction changes were restored after testing.
- Library navigation removes the Home scope and retains the existing library.
- Known chapter/page totals have a bounded meter; unknown totals do not fake one.
- Both runtime mirrors match the changed canonical runtime files byte-for-byte.
- Full suite: 2523 passing, zero failing. No release/build/deployment performed.

## Deliberate Differences

The background follows the real active work; only actual Berserk receives the
commissioned cinematic Berserk art. Other works without banners use a softened
cover background. The current demo work therefore differs from the mock artwork.
Existing fractional feather ratings, user images and account privacy behavior
remain intact. Physical-device performance and authenticated backend delivery
still need separate device/account testing.

final result: passed (local Home implementation and browser review)

## Follow-Up: Sharp Artwork, Tweet Geometry And Composer

The owner superseded the softened-cover decision: Home cover art is now sharp.
Reviews use the supplied compact avatar/name/time/numeric-Star reference while
retaining all five actions including Dislike. The composer has a dark/glass sheet,
mint enabled-publish state and retained draft/focus/picker logic.

Live browser inspection verified the exact4.75 score and exposed a legacy action
width rule; corrected widths removed the large horizontal spill. The last menu
edge and composer flex corrections have focused/source coverage but still await
fresh final screenshots. Browser control then failed with missing kernel assets.
Combined Home/Library suite:2530 pass. Library live visual checks are pending.

follow-up result: source-tested; final visual acceptance pending

### Follow-Up Accepted Locally

Owner-approved Playwright completed the pending pass. Sharp artwork and compact
review/text-post geometry inspected; Like/Dislike mutual exclusion, independent
Save and composer draft/reopen verified. Footer fits320px and a constrained450px
viewport. Demo reactions/draft changes were cleared. Library's24-case matrix and
the final2531-test suite are recorded in [Library QA](LIBRARY_CINEMA_QA.md).

follow-up result: passed (local browser, not physical-device certification)
