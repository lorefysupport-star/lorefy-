---
kind: session
status: local-review
date: 2026-10-21
---
# Six owner-requested UI changes, uncommitted

Owner explicitly requested local changes for review without GitHub commits.
Baseline main 79928a7; preserved all pre-existing local banner fixes and notes.

- Bottom navigation uses fixed physical left-to-right Home, Explore, Library,
  Profile order in AR and EN, with matching DOM/keyboard order.
- Type cards show larger type labels without catalog counts. Normal format-page
  totals also omitted; loading/errors/retry remain visible.
- Format-page top-right Filter works opens independent genre/status/minimum
  sourced rating/sort controls, applies locally and supports reset.
- Explore See all opens a full-screen dialog. Complete matching catalog candidates
  are separate from bounded previews, shown 60 at a time with Load more.
  Editorial topics expand with same-format related genre matches; actual friend
  ratings remain real available data, never fabricated to fill a long list.
- Imported profile photos require explicit framing before changing the draft.
  The owner rejected the initial slider design. Final photo framer shows the
  full image behind a fixed circle/banner outline. Drag pans; two-pointer pinch
  zooms; optional +/- and keyboard controls support desktop use. Reset/Cancel/
  Use this framing are explicit. Output is 512-square avatar or 1200x450 banner.
  Stale-account/editor guards, pending-save blocking, and cancellation remain.
- Home omits Popular with friends; Explore retains it.

130 related tests passed; the final small framing accessibility adjustment also
passed 63 focused tests. New tests cover full candidate lists, combined filters,
explicit crop confirmation/cancellation/stale account, crop bounds, drag and pinch.
Browser demo evidence: AR and EN type labels, filter action (Manga narrowed to
16 with completed/minimum 4), 60-card full-screen shelf and Load more, navigation
geometry/order, and absence of popular friend rail on Home. Imported generated
fixture in local demo only; applied banner and avatar dimensions verified. Actual
pointer drag visibly moved the full photo under the fixed circle. Raw screenshot
/tmp/lorefy-framing-review.png is outside Git. No live profile photo test writes.

No commit, GitHub push, native compilation, release upload, or production schema
change. Existing simulator app data retained. Physical pinch behavior remains
for owner testing; simulated two-pointer regression is not hardware certification.

[[systems/Explore-Works]] | [[systems/Profiles-Lists]] |
[[13-Project-Story]] | [[14-Feature-Coverage]]
