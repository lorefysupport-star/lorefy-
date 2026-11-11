# Profile Flow and Interaction Pass

Personal and visited profiles, continuing the Explore/Library comparison.
Source/browser acceptance only. No native build, production mutation,
account-content export, dependency or permission change.

## Reference and Identity

Read-only study of [Lootd](https://www.lootd.app/) after owner-assisted sign-in:
identity, quiet metrics, favorites and separate library/reviews/lists/social
navigation. This informs hierarchy and work budgets, not a replacement skin.
No private reference-account contents are included here.

Lorefy retains Normal, Panoramic and Reader, custom palettes, animated frames,
original media, all four library views and existing privacy/block rules. UI/UX
Pro Max search/empty-state and Apple interaction guidance were used. No extra
plugin was needed.

## Confirmed Problems and Repairs

1. A visited library mounted all1000 fixture cards on opening. It now starts42
   and grows by42 without truncating the underlying library. Title/author/type
   search covers all records, including the last. Empty search has local recovery;
   the overview preview remains four works.
2. Dialog/follow state rescanned every saved work. A component-local reference
   cache keys owner, library, favorites, progress, review-completion inputs,
   resolver and catalog revision. Catalog/metadata events invalidate it. There
   is no global cross-reader data cache.
3. Visited followers/following stopped after200. They now request50 at a time,
   advance raw offsets, deduplicate IDs and preserve rows/offset after failure.
   Retry, duplicate taps, close/reopen, actor changes and late receipts are guarded.
   The backend's existing offset ceiling10000 is unchanged.
4. Shared owner/visitor Posts mounted every locally loaded mixed entry. It now
   starts24 and reveals local entries before fetching older remote posts.
   Author filtering, chronology and review/post deduplication remain.
5. A cached library could open before remote reader verification. The control is
   disabled and handler-gated until ready, matching follow/connections.
6. Legacy input CSS painted white over the dark search field. Scoped input and
   placeholder styling retain visited-palette ink. Modal close targets44px,
   content wrapping and local no-results recovery complete this dialog pass.
7. The editable owner avatar and later identity sibling shared z-index4, allowing
   the identity to intercept its center. Avatar z5 restores the hit target without
   disabling text/identity pointer access or changing artwork/frame geometry.

## Verification

- Regressions were run failing before implementation. Final full suite:
  **3501 passed,0 failed/skipped/cancelled**,138.885s.
- Renderer tests reach all1000 works, find the last, reveal42 ->84, retry failed
  offset50 without clearing rows and reject stale connection pages. Mixed80-entry
  Posts fixture mounts24 ->48 ->72 ->80 before asking for older remote data.
- Browser24-case library matrix:3 layouts x2 languages x2 themes, at desktop1422px
  and mobile320px. Every case starts42, reveals84, finds0999, closes via Escape,
  retains themed ink and has no horizontal modal overflow.
- Browser connections:each layout reaches50 ->100 ->125, then removes More.
- Actual demo navigation:owner followers -> visited reader, public lists, library
  search/no-results recovery and connections. Owner390px layout cycling restores
  original Reader/custom-light/Showcase preferences. Avatar center hit-tests pass
  all3; pointer opening verified Reader/Panoramic, plus keyboard opening.
- Changed web assets are mirrored to both native web directories. Offline cache:
  `lorefy-v707-profile-flow`. No native build or service changes.

Raw screenshots, matrix JSON and test logs remain outside Git in workspace
`artifacts/profile-flow-20261111`. Stress records are synthetic and enabled only
by `qa/profile-header.html?stress=1`; they never enter saved app data.

## Remaining Acceptance

Physical iPhone keyboard/safe-area behavior, real-account paging, provider-media
restoration and long-session frame timing remain separate. Batch counts show less
mounted work, not a measured end-to-end speedup. The owner's distinct cached
social-graph loading path remains separate; its200-record preview is not certified
as an exhaustive graph by this pass.
