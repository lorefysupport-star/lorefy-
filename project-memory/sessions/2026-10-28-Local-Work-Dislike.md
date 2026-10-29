---
kind: session
status: local-source-browser-verified-service-pending
date: 2026-10-28
---
# Explicit Work Dislike as Zero

Owner answered the pending database question with local preparation only. No
production reads/writes, schema changes, Git commit/push, native build or Apple
upload occurred in this pass. Work Dislike is distinct from reacting negatively
to somebody else's review; existing review-reaction behavior is unchanged.

## Data Contract

- An intentional work dislike is rating0 together with recommendationfalse
  (`r:0,recVal:'no'` in the owned local review). Zero without that explicit
  choice remains unrated and cannot publish. Null is never coerced to a dislike.
- Existing positive scores with an old negative recommendation are preserved,
  not migrated to zero. A new explicit Dislike chooses zero; a positive slider
  or detailed-score edit clears the current Dislike selection.
- Successful publication uses the same unique owner/work review and existing
  `publish_review` RPC, not a new counter record. Re-publishing never adds a
  second vote. Failure retains the current draft; session/editor guards remain.
- Library status/checkpoints remain independent, preserving the27 October
  review-credit policy. Source ratings from catalog providers are not changed.

## Source Implementation

`modules/lorefy-review-editor.js` provides explicit validation, restored-draft
handling, Lucide ThumbsDown, selected feedback and a zero caption. Work detail
shows a separate public-dislike count below its existing provider rating.

`backend/lorefy-backend.js::countWorkDislikes` uses an exact HEAD count on the
existing reviews table, scoped to one work, public rows, rating0 and recommend
false. It relies on caller RLS; it does not bypass private-account/block rules,
return review bodies, or count only a capped loaded feed. Missing count/transport
failure is unknown, not zero. Request scope rejects account/client/epoch/mode/
local-owner transitions. Demo mode never queries the service.

The count component resets on work/owner changes, refreshes for current work
review changes or the existing refresh event, supports Retry, and ignores stale
work/session results and updates after unmount. Local demo counts deduplicate
owners. No DDL is needed for the selected API design. Existing zero-compatible
RPC behavior was inspected in the previous session, not re-certified live here.

Home's review score displays explicit0 with the negative icon; unrated values
remain a dash. Cloud mapping preserves null. Sharing preserves an explicit zero
instead of falling back to another displayed score. The guarded main-app patch
is in `tools/patch-work-dislike.mjs`; cachev607 and eight web files are selectively
mirrored by `tools/patch-work-dislike-runtime.mjs`, without native prepare.

## Verification

- Initial15 feature tests failed before implementation. Later regression checks
  exposed null-with-negative-recommendation restoration and zero-share fallback;
  both were observed failing, then fixed.
-25 dedicated count/editor/share tests cover exact metadata requests, deliberate
  zero RPC payload, deduplication, invalid values, failed publication and stale
  session/work/unmount results. Two main publication integration tests cover
  explicit zero and unchanged status/progress.
- Eight isolated demo browser cases: Arabic/English,Dark/Pink,320/430px. Empty-
  text Dislike publishes, positive edits clear selection, deselected zero cannot
  publish, repeated publication/reload retains one vote, and status/checkpoint
  stay unchanged. Count layout stayed in bounds; no page JavaScript errors.
- Additional mounted React fixture confirmed unknown-on-error, Retry recovery,
  review-change refresh, and rejection of a late old-work count. All backend
  methods in that fixture were substituted; zero real service requests/writes.
- Final `npm test`:2647 passed,0 failed,exit0;55.3 seconds. The initial full
  run caught a stale cache-key assertion, updated before the final run.
  Raw logs/captures remain in external task artifacts.

## Open Gates

Actual authenticated count/RLS visibility, cross-account publication, physical
iPhone behavior and release distribution require separate authorized testing.
No live service verification is claimed. The earlier written-review import,
public review-credit projection and remaining character-photo entry points are
still open; this authorization did not cover those features.

Reference checked: [Supabase exact HEAD count](https://supabase.com/docs/reference/javascript/select).
The28 October changelog check showed no relevant count-query API breaking change.

[[systems/Community-Notifications]] | [[09-Data-Contracts]] |
[[13-Project-Story]] | [[14-Feature-Coverage]]
