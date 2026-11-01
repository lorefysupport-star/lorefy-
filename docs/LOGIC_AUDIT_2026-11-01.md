# Lorefy Logic Audit - 2026-11-01

Status: four scoped source findings repaired and verified; not whole-app certification.

## Skill Setup

Installed `codebase-audit` from [Logical-codebase-audit-skill](https://github.com/LadsonDavid/Logical-codebase-audit-skill),
pinned commit `a0c4977ee01016039adbc912ac7188f530287684`, using the official
Codex skill installer. Installed SKILL.md matches reviewed remote bytes;
SHA256 `4F3EDAF946792205B40B335436AF2277553754D857A604E85727A039EDF4F81A`.
The downloaded folder contains SKILL.md, README.md and MIT LICENSE, no executable
payload. It is developer guidance outside the application, not a runtime engine.
Codex can discover the installed skill on the next turn; instructions were read
and applied manually in this audit. Existing systematic debugging and TDD apply.

The framework is adapted to Lorefy's contracts. Heuristics such as file age,
number of authors or lack of provider write APIs are not proof of bugs. A
deliberately read-only import is not a phantom bidirectional integration.

## Territory And Evidence

- Entry: index.html -> vendored React/ReactDOM -> uploads/files/lorefy-app.js
  plus modules. Capacitor/UIKit is the native shell, not React Native/SwiftUI.
- Model: owner-scoped Library/progress, authored reviews and separate review
  reactions, public projections, lists, inbox history and provider metadata.
- Services: Supabase Auth/data/RPC/Storage/Realtime, native APNs, external catalog
  and explicit import sources. Production deployment is a separate fact.
- Source boundaries: PROJECT_MAP.md and project-memory/09-Data-Contracts.md.
  Current indexed inventory is not semantic review of every source file.
- Fence check: explicit zero requires a negative recommendation; null is unrated.
  Older positive scores with negative recommendations remain positive. A review
  can earn a saved completion credit without overwriting explicit reading state.

## Findings And Repair Queue

### L-001: Friend Activity Contradicts Zero Dislike And Latest State - Fixed

`modules/lorefy-friend-activity.js::derive` rejected all ratings below0.25 before
selecting the latest owner/work row. An intentional zero disappeared, and a
newer unrated/private row could expose an older positive score from the input.
`backend/lorefy-backend.js::listFriendRatings` omitted recommend metadata, so
the client could not distinguish a deliberate zero from an unrated value.

Select the newest canonical owner/work state first, then eligibility. Include
only explicit negative zero, never null/blank/boolean/missing scores. A present
local r:null cannot borrow a stale raw rating. Add recommend to the existing
public metadata-only SELECT; retain RLS, followed readers, blocked/own filters,
request scope and bounded queries. No schema/RPC/production changes.

Evidence: three added tests and an expanded SELECT test reproduced four failures.
Final full3156/3156;40/40 mounted actual-app checks, AR/EN x320/390, pink/dark.
Zero visible, latest privacy/unrated suppresses old score, actual mean includes
zero, work/profile callbacks and cleanup work; no page errors. External requests
blocked in isolated demo; not a live-service/native certification.

### L-002: Public Profile Drops Review Semantics - Fixed

`modules/lorefy-public-profile.js::reviewRow` coerces rating:null into0 and omits
dislikeCount/myDislike although the shared card consumes them. The main cloud
mapper already preserves null and both negative reaction fields. Two executable
collection-to-card tests reproduced0 instead of null and missing dislikeCount.
Preserve null, explicit zero, dislikeCount/myDislike and visibility metadata;
current-viewer flags use strict booleans, matching the existing main mapper.
No server write, request scope, follow permission or theme changes.

Evidence: focused38/38, final full3158/3158;16/16 AR/EN browser component-boundary
checks. Mounted actual PublicProfile with controlled backend responses in an
isolated iframe; actual Home rating renderer distinguishes null/zero. Card-prop
adapter exposes negative count/selection. Old reader data hides immediately and
late replaced-reader response is ignored. This is a mapper/render contract test,
not proof of live review reaction writes or physical-device behavior.

### L-003: Editing Legacy Negative Recommendations - Fixed

`modules/lorefy-review-editor.js::savedDraft` preserves legacy positive numeric
scores but restores rec:false only for zero. A positive score with an older
negative recommendation reopened with the recommendation cleared. Canonical
recVal:null also fell through to legacy rec:false, misclassifying unknown zero
as a dislike. Five added regressions reproduced data and visible-state failures.

One local recommendation resolver now respects canonical null/yes/no before
legacy booleans. Preserve legacy positive negative-recommendation scores rather
than migrating them to zero. The selected legacy choice is shown as Not for me,
not falsely Dislike0. Deselect preserves the score; a subsequent new Dislike
deliberately chooses zero. Local counts use the same resolver and latest row.

Evidence: focused50/50, final full3163/3163;52/52 actual-app browser checks,
AR/EN x320/390 dark/pink. Open seeded legacy review, edit text, publish, reopen,
deselect, deliberately choose zero, republish: one review, correct choice/score,
unchanged explicit Library/progress. Unknown zero cannot publish. The publication
test asserts demo mode and uses an isolated synthetic owner; no real account or
service mutation. The initial browser attempt targeted the hidden legacy action;
the verified run uses the visible current quick-review control. Authentication
and intentional UI bridging were not removed to make fixtures pass.

## Audit Coverage, Not An Automatic Whole-App Score

| Framework area | This pass |
| --- | --- |
| Territory, execution/data boundaries | Mapped entry, main React source, feature modules, backend and mirrored runtimes |
| Business claims and edge cases | Three reproduced review/friend/visitor contradictions repaired |
| Test quality and historical fences | Executable data/effect/publication tests plus browser behavior; preserved intentional guards and explicit reading choices |
| Integrations and deployment | Code inspected and local adapters tested; no live-service certification |
| Architecture/ownership/debt | Scope mapped; large main/growth files and brittle repeated cache-version assertions remain maintenance risks, not new proven runtime bugs |
| Performance/deletion | Prior performance report retained; no new speed claim or deletion of reachable legacy UI |
| Enterprise requirements | B2B scoring is not applicable to this consumer reading audit |
| Chain-link bottleneck/global completeness | Not established by this scoped logic pass; remaining domains require their own evidence |

Final source suite3163/3163. Browser evidence is40 friend,16 profile contract and
52 full review-flow checks, all passing. See linked session notes for red/green
receipts and boundaries. No numerical correctness score for the entire app.

## Other Reviewed Contracts And Remaining Coverage

### L-004: Known Zero Review Count Replaced By Loaded Cache - Fixed

PublicProfile's review metric used Number(review_count) || ownReviews.length.
A valid server0 was therefore replaced by stale/cached loaded reviews. A new
regression reproduced1 instead of0. Use cached owner-filtered length only for
missing/null count, not a known0; keep other metrics and loading/error guards.

Two added tests preserve numeric/string0 and positive authoritative counts,
and owner-only fallback for missing/null. Focused24/24 and full3165/3165 pass.
42/42 mounted browser checks cover AR/EN and actual normal/reader/immersive
layout attributes: loading stays unknown, server0 wins before and after cached
rows arrive, refreshed5 replaces0, absent count falls back to two owner reviews
not a third reader's row. Controlled backend/iframe, not a live cloud query.
No new request, source data mutation, native build or production deployment.

- Reading metrics and current review publication tests distinguish completion
  credit, explicit status/checkpoint and non-duplicated unit-based time. Preserve
  those contracts; do not restore the historical forced-completion side effect.
- Local preparation, mock backend responses and code presence do not prove live
  notification delivery, database migrations or two-device synchronization.
- No B2B enterprise-readiness score, whole-app correctness score or exhaustive
  security finding is claimed. Large main/growth modules and implementation-
  coupled asset tests remain maintenance risks, not demonstrated runtime bugs.
- Continue other domains with executable invariants and staged evidence, not
  generic refactoring or a claim that all logic has been checked.
