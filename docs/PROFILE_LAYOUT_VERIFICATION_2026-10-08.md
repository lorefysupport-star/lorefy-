# Profile Layout Verification - 2026-10-08

## Delivered

- Edit Profile offers Normal and Panoramic layouts with native radio controls and visual previews.
- Normal remains the default. Cancel discards the draft; successful Save commits the selection.
- Panoramic changes only the upper profile: fading cover, side avatar, identity and follower counts. Existing lower sections are retained.
- The account-scoped layout key participates in existing cloud synchronization. Public profiles use the owner's projected choice, not the viewer's local choice.
- The deployed public-profile RPC preserves authentication, private-account and block guards; unsupported layout values fall back to Normal.
- Final favorite layout fits all four works in one equal-width row, retaining the 2:3 cover ratio and subtle binding/page-edge shadows. The heading is right-aligned, and the row's former 24px top margin is removed. Empty favorites and favorite characters retain their layouts.
- `phone-preview.html` keeps the application in a real 430x932 iframe viewport. The frame scales to the available desktop window without changing application breakpoints; this is a generic iPhone-style preview, not a verified iPhone 18 specification.

## Evidence

- Final `npm test`: 897 passed, 0 failed; exit 0; duration 60.97 seconds.
- Targeted profile-layout, shelf and favorite tests: 15 passed, 0 failed.
- Browser: save, cancel, reopen, reload, avatar editor access and follower dialog tested. Arabic and English, Light, Dark and Pink inspected.
- Small/mobile viewports: 320x740, 390x844 and 412x886; no document-level horizontal overflow.
- Final phone preview: four equal 91x136.5px covers, all fully visible and loaded. Title alignment checked in the rendered DOM; editing the fourth favorite opened the correct slot.
- Desktop windows 1440x1000 and 800x600 retained an internal 430x932 app viewport. Navigation and reload retained the phone wrapper.
- Switching Covers -> Bookshelf -> Covers preserved spine heights and restored cover dimensions without reload.
- Supabase migration `20261008123812_profile_layout_projection.sql` applied successfully. Transactional rollback checks verified Panoramic, Normal, invalid-value fallback and anonymous rejection without retaining fixture changes.
- `npm run ios:prepare` and `npx cap copy ios` succeeded; full tests include native asset parity.
- Screenshots: `qa/profile-layout-mobile-20261008.png`, `qa/profile-layout-picker-20261008.png`.
- Latest screenshot: `qa/favorite-books-phone-20261008.png`.

## Limits

- No physical-iPhone or two-account/two-device end-to-end run was performed. Public rendering and server projection were checked separately.
- Existing security-advisor warnings remain; this is not a clean security-audit claim. The authenticated security-definer projection retains its explicit guards and fixed search path.
- No new iOS build was uploaded in this task.

## Shelf Visibility Follow-Up

- The shelf base was obscured by the fixed navigation: the favorite section ended at 846.66px, while navigation began at 828px.
- Shelf-only spacing now reduces the metric bottom margin from 20px to 8px and the favorite heading's minimum height from 44px to 28px. Books retain their existing heights; no negative-margin overlap was introduced.
- After the fix, the section ends at 819.47px and the shelf base ends at 813.47px, leaving approximately 14.5px before navigation.
- Browser switching back to Covers restored the 20px metric margin and four unchanged 91x136.5px covers. Returning to Bookshelf restored the visible base.
- Targeted tests: 16 passed, 0 failed. Screenshot: `qa/visible-profile-shelf-20261008.png`.
- Full suite after the shelf fix and native asset synchronization: 898 passed, 0 failed; exit 0; 59.95 seconds.

## Curved Spine Design Follow-Up

- Library and favorite shelves now share arched book crowns, clearer original artwork, bold single-line vertical titles and subtle edge lighting. Existing varied heights remain.
- The library paints one continuous base per row instead of separate underlines. Empty search results omit the shelf background; scrolling remains enabled without a visible scrollbar.
- Browser checks verified opening Hunter x Hunter, empty search, restoring results and switching between Covers, List and Bookshelf. The phone preview shows all 14 library works across two shelf rows.
- Targeted tests: 19 passed, 0 failed. Final full suite: 901 passed, 0 failed; exit 0; 63.24 seconds.
- Native assets synchronized with `npm run ios:prepare` and `npx cap copy ios`. No native build uploaded or physical-phone test performed.
- Screenshots: `qa/curved-library-shelf-20261008.png`, `qa/curved-favorite-shelf-20261008.png`.
