# Lorefy: Physical-Device Audit

Started 9 November, continued 10 November 2026, Asia/Riyadh.

## Scope And Boundaries

- A connected iPhone (iPhone17,2, iOS 27.2) ran installed `com.lorefy.app`, version 1.0 build 37. Its source commit was not established. It is not assumed identical to current Git HEAD.
- USB screen mirroring and native taps/swipes were visible on the PC. No reinstall, build, signing change, Apple upload or tester distribution was performed.
- All real-account operations were read-only: no posts, reactions, follows, ratings, reading-state changes, list edits/deletes or notification read-all commands.
- Screenshots, device identifiers, account content and the loopback mirror stay outside the repository. The mirror is local to `127.0.0.1`, not published.
- Release Web Inspector exposed no Lorefy targets. There are no live JavaScript/network traces or native frame-time measurements. A mirror stall is not classified as an application freeze.

## Proven Findings

| ID | Priority | Observation / Cause | Current Status |
| --- | --- | --- | --- |
| D-001 | High | Opening a saved list aligned its toolbar under native status chrome; Back did not respond at its displayed location. The shared panel uses start-aligned scrolling without safe-area margin. | Source repaired. The greater of native/browser top inset plus 8px is reserved. Local open/back checks pass across AR/EN and all three saved profile layouts. Installed-phone delivery is pending. |
| D-002 | Medium | Timeline and conversation actions change position. Home has LTR ordering; shared post actions inherited direction and wrapped independently. | Source repaired. Shared five-action geometry/order now matches Home. Controlled CSS/DOM checks pass in both directions. Handlers/counts/receipts are unchanged; no real reaction was sent. |

## Findings Requiring More Evidence

| ID | Observation | Required Next Check |
| --- | --- | --- |
| D-003 | Work search returned an exact requested result plus a partial-provider failure message. | Identify the failing provider and response/deadline, verify retry and slow/offline recovery. Do not replace exact identity matching with arbitrary title matches. |
| D-004 | The real notification inbox was empty. | Authorized two-account Like/comment/reply event, receiver persistence after reopen, target navigation and deduplication. Empty UI alone proves neither deletion nor delivery failure. |
| D-005 | Reader-layout favorite captions appeared vertically clipped. | Reproduce populated cards with actual saved Reader composition, two-line Arabic/English titles and the complete CSS cascade before changing geometry. |
| D-006 | Review editor showed existing content with a publish-style command label. | Establish whether the same save path updates the existing record before changing wording. No review was edited or submitted. |

## Physical Read-Only Coverage

“Opened” means the sampled view rendered and its observed navigation worked unless a finding says otherwise. It does not certify all data, every control or persistence.

| Section | Performed On Phone | Still Unverified |
| --- | --- | --- |
| Home / For You | Resume hero/progress and friend-rating rail rendered; switched feed tabs. | All ranking scenarios, cold cache, slow-network deadlines and long-session behavior. |
| Following | Scrolled posts, opened a conversation, returned to the same feed position. | Full pagination, concurrent realtime insertion and refresh during writes. |
| Conversation | Existing content opened; reply keyboard kept input visible; closed without typing/sending. | Post/reply/edit/delete, duplicate-submit and late network receipts on real accounts. |
| Explore | Browse hero, recommended media and type tiles opened. | Every category/provider, all language combinations, provider isolation and offline recovery. |
| Search | Exact English work lookup returned the requested work. | Arabic aliases, people/lists, rate limits and the observed partial-provider failure. |
| Work | Detail, story, review editor and reading-state chooser opened; current state prefilled. | Saving ratings/zero-dislike/completion, totals after restart and cross-account public projection. |
| Characters | Roster, portraits and existing rating controls rendered. | Image upload/crop/permission denial, rating save and cache invalidation on real accounts. |
| Covers | Current and alternative covers rendered; chooser closed without applying. | Upload/apply, failure/retry, restart durability and edition metadata completeness. |
| Library | Grid, covers, progress and status totals rendered; sampled completed total agreed with owner profile. | Other three modes, sorting/search, large libraries and writes. |
| Owner profile | Saved media/frame, metrics, favorites, followers and lists opened. | Every frame/layout/palette and all editing paths. Reader caption clipping remains open. |
| Visitor profile | Follower profile opened, public view/list tab rendered, return restored owner theme. | Real private/block policy matrix, following writes, all populated public-list cases. |
| Lists | Envelopes and a populated ranked list opened; Home navigation escaped the unsafe toolbar. | Real edit/reorder/share/delete and all list types. D-001 source repair needs new-binary verification. |
| Notifications | Inbox opened and returned to Home; empty state displayed. | Real delivery, read persistence, older events and targets. |

## Remaining Audit Queue

1. Community: real two-account receipts and notification delivery, partial refresh, pagination and reconnect, one section at a time.
2. Search: source-specific failures, real provider timeouts, Arabic aliases and images without stale results.
3. Profile: populated Reader caption geometry, remaining formats/layouts, frame hit areas and visitor contrast.
4. Settings/account/import/share: navigation and recovery first; destructive or privacy-changing operations require separate authorization.
5. Native acceptance: authentication, background/resume, keyboard variants, cold launch, network loss and measured CPU/memory/frame time. Access limitations are not a passing result.

Further phone touches stopped when an incoming call appeared. No call was accepted or declined. Source/browser verification continues independently of personal phone activity.

## Reproduction

Final source suite: **3431 passed, 0 failed**. Dedicated browser regression:
**14 cases passed** (12 actual saved-layout list open/back cases, 2 controlled
action-order direction cases). No installed-binary or service-delivery claim.

From the repository root, run the local demo server, then the dedicated regression:

```sh
node tools/lorefy-api-server.js 8796
node qa/device-ui-regressions.cjs
npm test
```

The browser fixture uses disposable local demo storage only. It does not sign in to a real account. `LOREFY_QA_URL` and `LOREFY_PLAYWRIGHT_MODULE` can select the local server and installed Playwright runtime.
