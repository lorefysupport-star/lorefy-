---
kind: session
status: source-browser-verified-live-provider-pending
date: 2026-10-30
source_commit: ebbf2aa
---
# Complete Kitsu library pagination before offering import

Owner requested continuing the remaining source repairs and pushing each
verified fix independently. No native build, production write or paid resource.

## Reproduced and repaired

`imFetchKitsu` stopped after six pages (`n < 5`), silently resolving a partial
library. It also followed unvalidated next URLs and counted overlapping entries
again. New21 provider regressions initially had19 failures; the primary case
returned6 of9 pages. The existing fractional-rating regression was retained.

- Follow JSON:API links.next until absent/null, including relative links and
  href link objects. Preserve the existing requested page size500 and title,
  status/progress and quarter-star mappings; no new provider or dependency.
- Validate HTTPS provider hosts kitsu.io/kitsu.app, default port, no credentials
  and the library-entries path before following next. Canonical query ordering
  detects repeated page URLs across host aliases. Entry IDs deduplicate both
  matched rows and unmatched counts. No account library write during fetching.
- Reject malformed data/included arrays, invalid/repeated links, failed later
  requests and the1000-page safety ceiling explicitly, never as partial success.
  The ceiling is a defensive client bound, not a claimed provider limit.
- Localized AR/EN failure retains username and retry control, focuses the alert
  and creates no confirmation preview. A fresh attempt starts from page one;
  this is not durable checkpoint resume or a server import job.
- Cachev643, growth asset20261030-kitsu-pages-v1. Three changed web assets
  selectively mirrored to both runtime folders, not compiled or installed.

## Evidence

-120 focused tests passed; final full source suite **3057/3057**, zero failures,
  exit0,62,125ms. JS syntax and diff whitespace checked.
- **192/192** real local-app browser checks, AR/EN x dark/pink x320/390/768.
  Fixture fails page7 after6 successes, then retry fetches all9 pages. Checked
  actual document theme/language, error/no-write/no-partial-preview, focus,
  retry draft, preview-before-write, nine explicit imports, private fractional
  ratings/progress and untouched existing reading state. No page errors or
  publication requests. External calls intercepted; no real Kitsu user accessed.
- Rechecked preceding CSV repair on current source: **180/180** browser checks,
  including actual theme/language assertions, full text/opt-out, rollback/retry
  and idempotent missing-text merge. The earlier fixture set theme before demo
  bootstrap, which reset it to dark; theme setup now occurs after bootstrap and
  is asserted before every scenario. This supersedes the initial168 theme claim.
- First Kitsu browser attempt had a nested-scoped locator timeout; test locator
  corrected without changing product code. All contexts close in finally.
- Workspace evidence outside Git: artifacts/import-kitsu-20261030-browser.js,
  -browser.json, -full.log and kitsu-{error,preview}-*.png; preceding CSV browser
  script/report/screenshots rerun. No raw account data or credentials committed.

## Sources and limits

[Official Kitsu pagination docs](https://kitsu.docs.apiary.io/reference/posts)
describe following links.next with offset/limit. This fix removes our six-page
cutoff, not a documented service restriction. No live provider completeness,
native network policy, server acknowledgment, public review retrieval, automatic
tweeting, queue resume or two-device acceptance claim. Existing catalog title
matching can still leave unmatched works; matching coverage is a separate task.

[[systems/Reading-Library]] | [[14-Feature-Coverage]] |
[[15-Work-Control]] | [[10-Open-Questions]]
