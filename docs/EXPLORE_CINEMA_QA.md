# Explore Cinema and Plain Library

Types/Search follow-up: `docs/EXPLORE_SEARCH_QA.md` documents the subsequent
format-card and functional search redesign. The historical results below remain
evidence for their original scope, not the latest full-suite total.

Selected-image follow-up: see `project-memory/sessions/2026-10-26-Explore-Immersive-Reference.md`
and the latest section of `design-qa.md`. That iteration replaces only the
separated hero composition below; the Library backdrop remains removed.

Date: 2026-10-26. Local source only; no push, native build, upload, migration,
subscription change, or production deployment.

## Scope

- Removed Library's automatic decorative background at its renderer hook and
  component, rather than hiding a still-downloaded image. Covers, search,
  checkpoints, counts, sorting and all four library modes remain unchanged.
- Explore now uses the approved Home/Library dark glass identity, system font,
  mint selection, glass search/segments/navigation and an unframed sharp featured
  artwork area. Actual work titles/authors appear under covers.
- Featured artwork uses the existing work-ID-bound Home artwork helper, including
  its rights-safe behavior and actual-cover fallback. No stored artwork changed.
- Existing search (media/people/lists), formats, sorting, recommendations,
  preference/filter dialogs, collection paging and work-open callbacks remain.
- Global and format search fields now have distinct React keys: a format query
  can no longer remain in the uncontrolled global field after Back.
- Dialog overlays anchor to the viewport. Navigation is hidden while an Explore
  dialog is open, so it cannot cover the sheet's Save/Apply buttons.

## Source Verification

Five initial regressions failed before implementation; source changes made them
pass. Additional failing regressions preceded the stale-input and modal/nav
fixes. The existing cache-key contract was updated for the changed assets.

Final full suite: **2537 passed, 0 failed**, exit 0. An earlier run suffered
host-memory allocation failures and the old expected cache-key assertion; it is
not counted as a pass. The final rerun completed after closing only the isolated
test browser. Source syntax checks passed.

Seven changed web runtime assets match both existing native web mirrors byte
for byte (14 comparisons). This is selective web copying, not native preparation
or compilation. Offline shell cache: `lorefy-v594-explore-cinema`.

## Browser Evidence

Alternative Playwright was previously authorized. Tests used isolated local demo
storage only. Production Supabase requests were blocked in that test browser;
real-account service access, sign-in and remote search are not certified here.

- Explore: 30 layout cases, Arabic/English x 320/390/768 px x Browse, Types,
  Format, Filters and Search. No document/page horizontal overflow. Dark base,
  readable headings and matching glass navigation were checked.
- Library: 24 cases, Arabic/English x 320/390/768 px x Covers, Bookshelf,
  Showcase and List. Two actual catalog IDs with synthetic local checkpoints;
  two cards retained, one selected view, no backdrop element or background image,
  and no document overflow. The fixtures were cleared afterward.
- Local format/global Berserk searches returned matching works. Returning from
  format search left the global input empty; People mode and Cancel worked.
- See all opened 60 catalog works. Escape closed it. Opening Hunter x Hunter
  showed the matching detail and removed the Explore styling scope.
- Sheet testing checked the actual element at navigation coordinates, not just
  z-index values. Navigation is hidden and the foreground element is the dialog.
- Featured artwork decoded successfully with no blur; AR/EN captures recorded.
  External cover availability is not guaranteed by layout checks. A stalled
  early capture was discarded and later checks use explicit bounded waits.

Raw screenshots and test logs are outside the repository under the task's
`artifacts/` folder. No user screenshots, tokens or private account data are
included in source documentation. iPhone performance, native keyboard/safe areas,
backend account synchronization and restoration of the Supabase quota restriction
remain separate verification tasks.
