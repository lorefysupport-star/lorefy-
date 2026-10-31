# Lorefy Logic Audit - 2026-11-01

Status: staged source audit and repairs, not whole-app certification.

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

### L-002: Public Profile Drops Review Semantics - Source Finding, Pending Repair

`modules/lorefy-public-profile.js::reviewRow` coerces rating:null into0 and omits
dislikeCount/myDislike although the shared card consumes them. The main cloud
mapper already preserves null and both negative reaction fields. Reproduce at
the visitor collection/render boundary before changing it; retain owner scope.

### L-003: Editing Legacy Negative Recommendations - Source Finding, Pending Repair

`modules/lorefy-review-editor.js::savedDraft` preserves legacy positive numeric
scores but restores rec:false only for zero. A positive score with an older
negative recommendation can reopen with the recommendation cleared. Reproduce
the round trip and canonical null-vs-legacy-false count distinction first.

## Other Reviewed Contracts And Remaining Coverage

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
