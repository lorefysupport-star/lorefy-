# Work Cinema and Glass Post Composer

Follow-up: [Work Studio](WORK_STUDIO_QA.md) supersedes the connected editors'
composition below after owner feedback. This historical evidence remains intact.

Date: 2026-10-26. Local source only. No GitHub push, native build, Apple upload,
production deployment or database changes.

## Sequential Scope

The owner requested the post-plus composer first, followed by a comprehensive
work-page redesign in the approved dark Apple/glass identity. The composer was
implemented and checked before work-page changes began.

- Post composer: independent author row, full-width writing canvas, compact
  glass icon dock, existing 500-character meter and readable submit states.
  Existing account-owned in-memory drafts and attachment callbacks are retained.
  Empty attachment pickers have matching glass, initial focus, a focus loop,
  Escape dismissal and focus restoration to the selected tool.
- Work: sharp original cover artwork, larger poster/title, glass hero tools,
  clear reading/review commands and icon-only secondary tools with tooltips.
  Facts, Story/Reviews/Related navigation and reader filters share the identity.
- Connected workflows: chapter reading controls/rows, review editor, reading
  state, cover chooser and character search/rating page use consistent surfaces,
  system typography, mint selection and stable responsive dimensions. Native
  safe areas and data owners remain in their existing contracts.
- Navigation hides only while these editors are open. Review text has one focus
  ring and the publishing footer reserves the simulated/native bottom safe area.
  Non-draggable decorative sheet handles are hidden in the redesigned editors.

## Reproduced Functional Findings

1. Escape in reading-status/cover sheets called an overlay whose click was
   swallowed by the React sheet. It now activates the existing React-owned close
   control, respects a disabled control and retains the previous fallback for
   unrelated dialogs. Nodes are not removed behind React's back.
2. Work quick actions were gated by chapter context. They are now enhanced
   before chapter eligibility, so a nonserialized book still gets its genuine
   reading, review and cover controls.
3. Chapter eligibility inspected all header text. A book's Open Library Comics
   source label could trigger an irrelevant chapter section. Eligibility now
   reads canonical work type, falling back only to the explicit format label.
   The observed nonserialized book retains its actions and has no chapter block.

No reading totals, catalog types, progress, reviews or user artwork are invented
or rewritten by this presentation layer. Existing publication and persistence
callbacks remain authoritative.

## Evidence

New source regressions were observed failing before the corresponding changes.
Focused composer, work, chapter and review ownership/lifecycle tests passed.
Final complete suite: **2558 passed, 0 failed**, exit 0, 66.3 seconds. The first
full run had two outdated static expectations (exact composer class string and
old asset cache version). Those expectations were updated while retaining their
feature checks; the version contract now covers all newly changed assets. The
entire suite was rerun successfully, not only the failed files.

Authorized alternative Playwright used isolated local demo storage with
production Supabase traffic blocked. Forty-four viewport cases passed:

- Composer: AR/EN x 320/430/1024px plus AR/EN 390x500 short viewport (8).
- Work, status, review, cover and Reviews tab: AR/EN x 320/430/1024px (30).
- Character page/search/filters: AR/EN x 320/430/1024px (6).

No horizontal overflow was found in those views. Stable sheets remained inside
the viewport, and valid 4.25 ratings enabled the existing publish action. No
post or review was published. Draft close/reopen, Guts cast search, actual cast
loading, modal Escape, attachment focus/Tab/Escape/return and the phone-preview
iframe were checked. No pageerror events occurred in the tested flows.

Screenshots and logs are in the parent task's artifacts directory, not this
repository or the vault. External catalog/image requests can still fail; browser
network console failures are not relabeled as successful service validation.

Eight changed runtime files are selectively copied to both existing web mirrors
(16 hash comparisons), not native preparation or compilation. Cache:
`lorefy-v597-work-cinema`.

## Remaining Gates

Visual acceptance remains with the owner. Physical iPhone keyboard/motion and
performance, real-account publish/upload, external provider availability and
Supabase quota/auth recovery are not certified by these local checks.
