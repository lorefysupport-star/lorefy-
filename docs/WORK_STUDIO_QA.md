# Work Editors: Structural Redesign

Date: 2026-10-26. Local source only. No commit, push, native build, Apple upload,
production deployment, billing or database changes.

## Decision

The owner's follow-up screenshots rejected the old form composition under the
new glass colors. This revision supersedes the connected-editor presentation
in [Work Cinema](WORK_CINEMA_QA.md), not its data/eligibility/Escape repairs.
The main work page and original cover artwork remain intact.

## Sequential Changes

1. Reading status: genuine work identity, controlled icon/radio cards, progress
   checkpoint fields, pinned Save and a separate red removal command. The
   existing removal confirmation, canonical statuses and progress save own data.
2. Review: persistent work/rating identity, quarter-step slider and +/- controls,
   three views for thoughts, detailed ratings and extras. Hidden views remain
   mounted; text, moments, attachments and character picks retain existing refs.
3. Characters: actual portraits in a two-column gallery; four columns only when
   the gallery's own container is wide enough. Search, filters, scores, edit
   images, source pagination and account boundaries retain their existing logic.
   Loading artwork no longer shows the global purple avatar backdrop here.
4. Covers: large preview, real alternative URLs, explicit Apply, original-cover
   restore and existing photo upload. Unchanged/unready/failed images cannot be
   saved. The existing image-guard opt-out preserves explicit failure states
   instead of turning a failed cover into selectable replacement artwork.
5. Overflow: named glass action palette, icon tools, keyboard navigation and
   focus return. Placement is bounded to the visible host on open/resize/scroll;
   the reproduced desktop bottom overflow was fixed before acceptance.

`modules/lorefy-work-panels.js` has no new storage or network path. Guarded hooks
in the canonical application delegate to original save/upload/removal handlers.
The old renderers remain fallback paths if the new module is unavailable.

## Verification

- New layout/behavior regressions were observed red before their implementation.
- Complete source suite: **2573 passed, 0 failed**, exit 0, 81.2 seconds.
- Fifteen new tests cover canonical status values, controlled progress, stale
  ownership, review views/quarter steps, gallery contracts, URL deduplication,
  cover preview-only selection, double-tap locking, retry/draft preservation,
  stale async completion, image recovery and generic-fallback exclusion.
- Isolated local demo browser: AR/EN at 320/390/430/1024px. Stable status, review
  and cover sheets have no horizontal overflow and remain within the viewport.
  All three review views were checked across those widths in Arabic. Arabic
  sheets also fit a 500px-tall viewport, keeping the action footer visible.
- Local reading checkpoint 12 saved and reopened as 12. Removal stays red and
  delegates to the existing confirmation. Escape restores focus/inert state.
- Review text survives changing views; a 4.25 rating enables Publish. No review
  or post was published. Character provider data loaded; Guts search matched.
  Gallery sliders/edit controls stayed within cards across the tested widths.
- Injected cover image failure disables the tile, shows an explicit unavailable
  state and leaves its actual URL unchanged. Unit tests cover retry and recovery.
- Overflow ArrowDown/Escape/focus return passed; the desktop menu bottom is now
  831px in an 843px viewport, rather than the reproduced 861px overflow.
- The phone-preview iframe mounted the genuine new status component.
- Eight runtime assets match both existing web mirrors: 16/16 hashes. This is
  selective web-source copying, not native preparation or compilation.
- Fresh cache: `lorefy-v598-work-studio`; changed runtime asset URLs are pinned
  to `20261026-work-studio-v1` in both entry and service-worker cache.

Screenshots and full-suite logs remain in the parent task's artifacts folder,
outside the repository/vault. External image/catalog failures were observed and
are not called service success. Production Supabase traffic was blocked in the
isolated browser; installed iPhone keyboard, VoiceOver, performance, actual
account publishing/upload and quota/auth availability remain unverified.

Visual approval remains with the owner. No new dependency/plugin was necessary;
the available UI, Apple interaction and testing skills were used with the
existing React/Lucide/CSS application, not a framework migration.
