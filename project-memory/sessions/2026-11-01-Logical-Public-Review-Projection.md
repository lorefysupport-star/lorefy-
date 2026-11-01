---
kind: session
status: source-browser-verified-service-device-pending
date: 2026-11-01
source_commit: 20766af
---
# Keep visitor review projections faithful to shared card semantics

L-002 follows [[2026-11-01-Logical-Friend-Ratings]] under the installed logic
audit guidance. PublicProfile's cloud review mapper converted null ratings to
zero and dropped dislikeCount/myDislike. The existing main mapper already
preserved those distinctions. Two real effect/collection-to-render regressions
reproduced0 instead of null and missing negative count.

Keep unrated null and explicit zero distinct; project negative reaction count,
viewer selection and is_public metadata. Strict reaction booleans match the
main mapper. No review mutation, request/follow/owner lifecycle or artwork/theme
change. Cachev652 and six touched web mirrors synchronized, without native build.

Fresh evidence: focused38/38, final full3158/3158, exit0 (62019ms). First full
run caught an older explicit public-profile asset version in reading-terminology;
updated expectation and reran the full suite successfully.16/16 AR/EN browser
checks use actual PublicProfile in a mounted isolated iframe with controlled
backend rows and actual Home rating component. Null/zero, negative selection/
count, hiding old reader data, obsolete response suppression and cleanup pass.
The negative-action button is a card-prop adapter, not the production action
handler; no real reaction/profile/account request was made. No page errors.

Outside-Git receipts: artifacts/logic-profile-20261101-red.log/verified.log;
output/playwright/logic-profile.js and results. Remaining logical coverage and
L-003 round-trip restoration are tracked in docs/LOGIC_AUDIT_2026-11-01.md.

[[systems/Profiles-Lists]] | [[13-Project-Story]] |
[[14-Feature-Coverage]] | [[15-Work-Control]]
