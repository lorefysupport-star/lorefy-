---
kind: verification
status: maintained
---
# Verification Recipes and Evidence

Latest completed source follow-up: [[sessions/2026-10-17-Notification-Backend-Session]],
**1566/1566 passing tests**, zero failures, 2026-10-17. Isolated AR/EN demo
home opened without pageerrors; backend/index/sw hashes match both native web
copies. Live RLS/APNs/installed-device evidence remains separate.

Latest profile follow-up: [[sessions/2026-10-17-Profile-Mutation-Owner]],
1374/1374 tests passed. Profile/privacy/onboarding results are bound to their
opening account. Supabase project inspection was denied by the connector;
no live profile, RLS or installed-device certification is claimed.


Latest backend follow-up: [[sessions/2026-10-17-Backend-Review-Owner]],
1357/1357 passing source tests. Storage token/owner and review request stages
are guarded; no live Storage/RLS certification or request rollback is claimed.


Latest source follow-up: [[sessions/2026-10-17-Review-Library-Lifecycle]],
1343/1343 tests passed; no implicit completion from review-only state. Deletion
preserves all five statuses and exact checkpoints. Isolated browser reload
retained the review with empty library/progress. No device/cloud certification.


Latest review editor/image receipts (2026-10-17):
[[sessions/2026-10-17-Review-Editor-Owner]] and
[[sessions/2026-10-17-Review-Image-Owner]], 1335 source tests passed, 0 failed.
The current handoff and its fresh verification are in [[18-Progress-Handoff]].
No new installed-device or service certification follows from these results.

Earlier review-mutation receipts: [[sessions/2026-10-16-Review-Progress-Independence]]
and [[sessions/2026-10-17-Review-Response-Owner]]. Final source suite: 1318 passed,
0 failed; deferred mutation tests cover account/session changes. An isolated
demo publication/reload retained Reading and 90 pages. No live request, native
installation or authorization certification follows from these source results.

Latest calendar/activity receipt: [[sessions/2026-10-16-Statistics-Activity-Dates]],
base `47a3861` plus LF-020: 1,283 passing full-suite tests and 15 focused
memory/activity tests. EN 440px and AR 320px source previews expose matching
Gregorian dates. Timezone/non-Friday cases are unit evidence; no phone update.

Latest statistics-locale receipt: [[sessions/2026-10-16-Statistics-Locale]],
base `9f972ae` plus LF-019: 1,272 passing tests; AR/EN 320px light and EN
440px dark source previews. No installed-device update; calendar-day mapping
remains [[bugs/LF-020-Statistics-Activity-Dates]].

Latest estimate-copy receipt: [[sessions/2026-10-16-Reading-Estimate-Labels]],
base `5c07689` plus LF-018: 1,265 passing source tests; owner/statistics at
320px AR/EN and independent visitor fixture at 440px. No device update;
remaining statistics localization is [[bugs/LF-019-Statistics-Locale]].

Latest installed-device receipt: [[sessions/2026-10-16-Native-Touch-Audit]],
existing Build 35. Actual mirror taps and swipes navigated profile, library,
work/list details and import entry/exit; 13 local control/guard tests passed.
No native build, installation, full source-suite rerun or live-data edit occurred.
This does not close LF-002 or all-frame device QA.

Latest source/browser receipt: [[sessions/2026-10-16-Review-Timestamp]], base
`3451cc2` plus LF-017: 1,256 passing tests and AR/EN review date/time verified
in isolated Chromium at 390x844. This does not certify a new installed iPhone app.

Latest source/browser receipt: [[sessions/2026-10-16-Review-Reply-Direction]],
base `7907d05` plus LF-016: 1,250/1,250 passing tests; EN/440px and AR/320px
reply input direction verified without submitting replies. Native keyboard,
VoiceOver and review-date localization are not certified by this receipt.

Latest source/browser receipt: [[sessions/2026-10-16-Import-UI]], base `80ba6b5`
plus LF-015: 1,249/1,249 passing source tests, AR/EN import UI evidence at
320px/440px across light/dark samples. No actual import or native update;
physical connection was unavailable during this check.

Latest source/browser receipt: [[sessions/2026-10-16-Diary-Position-Defaults]],
base 6708c2a plus LF-014: 1,246/1,246 passing tests. LF-013 also passed
80 browser layout cases; Arabic/English diary page save, reload and spoiler
reveal/hide passed in isolated demo contexts. No native build or device update.


Latest source/browser receipt: [[sessions/2026-10-16-Character-Editor-Locale]],
base `ac2285f` plus patch: 1,236 passing tests. Separately, the authorized single
push has correlated APNs acceptance plus owner-confirmed outside-app receipt and
correct inbox tap target: [[sessions/2026-10-16-Authorized-Push-Check]].
This does not certify every notification event or deploy the transport patch.

Latest source/browser receipt: [[sessions/2026-10-15-Character-Editor-Hydration]],
base `c2da5fd` plus its patch: 1,231 passing tests. Arabic 320px recovery and
English 390px recovery/save used synthetic in-memory data, not a live account.

Latest source receipt: [[sessions/2026-10-15-Character-Editor-Owner]], based on
`fee2dc6` plus its patch: 1,225 passing tests and eight new owner/async regression
cases. No native build, installation, Apple upload or service deployment.

Latest repair receipts: [[sessions/2026-10-15-Gallery-Hydration-Repair]] (1,213
passing tests) and [[sessions/2026-10-15-Push-Transport-Repair]] (1,217 passing
tests). The latter is based on `ae66e5b` plus the source-only transport patch.
No new native binary or Edge Function deployment was performed. The source tests
and isolated browser fixture do not close physical-device/APNs display checks.

Latest local-memory workflow receipt: [[sessions/2026-10-15-Obsidian-Research]].
On source base `1950599` plus that workflow change, `npm test` passed 1,204 tests
with no failures, skips or cancellations; focused memory/workflow tests passed
23 cases. Audit: 65 connected notes, 498 source files, fresh, no issues. Obsidian
1.14.4 CLI queried all three native Bases successfully. This did not create a
native build or verify production-service delivery.

Current source sync: GitHub main `64e4e63`, followed by saved-character-count
repair `628c701`, cache regression alignment `57db5ed`, and generated catalog
metadata synchronization `a76afff`. [[sessions/2026-10-15-Source-Reorganization]] owns the current
verification receipt. [[sessions/2026-10-15-GitHub-Sync]] describes an earlier
integration, not the current test run. No new native build is authorized.

## Earlier source integration verification, 2026-10-15

On `a76afff` with the documentation reorganization and preserved local Build 35
settings, `npm test` exited 0: 1,198 passed, 0 failed, skipped or cancelled.
This includes the shipped-web-asset synchronization contract, not a native build.
The final receipt and earlier failures resolved in this run are recorded in
[[sessions/2026-10-15-Source-Reorganization]]. Memory audit: 59 notes, 497 indexed
source files, fresh snapshot, no broken links, orphan notes or duplicate groups.
Physical-device delivery, permissions, performance and deployment remain separate
checks; see [[10-Open-Questions]] and [[14-Feature-Coverage]].

## Core commands

```text
npm test
node --test tests/frame-motion.test.js tests/profile-decoration.test.js
node --test tests/reading-metrics-stability.test.js tests/paid-collections.test.js
node --test tests/project-memory.test.js
node qa/all-profile-banner-browser.cjs
node qa/frame-chrome-browser.cjs
node qa/original-frame-fit-browser.cjs
node qa/public-profile-layout-browser.cjs
npm run memory:check
npm run memory:audit
git diff --check
```

Browser scripts require the established local server at port 8795. Use isolated
headless contexts for applying/removing test decorations; never change the
user's saved appearance to exercise a fixture matrix.

## Historical baseline, not a live test result

At source commit `716da602995a3130ba9eec6e2efc8b055658f3a0`, the frame handoff
recorded 1,076 passing unit tests, 39 supported collections, 468 owner/visitor
layouts and 234 searches, plus 340 frame-fit, 144 chrome and 80 public-profile
layout cases. See [frame evidence](../docs/FRAME_GEOMETRY_20261012.md).

These counts are a dated baseline. After a pull or change, run the relevant
tests again; do not present this note or the generated snapshot as fresh proof.

## Historical memory verification

On 2026-10-14, source `524203c` plus preserved local Build 35 and memory changes
passed 1,119 tests, including 17 focused memory tests. Memory audit reported
47 connected notes and 478 indexed source files with no link/freshness/duplicate
issues. See [[sessions/2026-10-14-Project-Brain]] for commands and limitations.
This becomes historical as soon as the source or environment changes.

## Completion gate

2026-10-17 source repairs: [[sessions/2026-10-17-Review-Editor-Owner]] records
1328 passing tests; [[sessions/2026-10-17-Review-Image-Owner]] records the later
1335-test run (0 failures), matching selective web copies and local demo checks.
These are source results, not installed-device or live-backend certification.

Record the command, exit code, date, source commit and working-tree changes,
actual result, evidence path and remaining limitations. Synchronize any changed
runtime assets and compare source/generated hashes. A memory-only change does
not require shipping this vault in the application.

[[00-Home]] | [[04-Current-State]] | [[06-Known-Risks]]

## Session read owner verification — 2026-10-17

LF-031 source on d803865 plus patch passed **1384/1384**, zero failures, exit 0.
Evidence: `D:/LorefyDevelopment/QA/remaining-repairs-20261017/session-owner-full-tests.txt`.
[[sessions/2026-10-17-Session-Read-Owner]] records scope and limits.
Backend/index/sw copies match ios-web and native public; this is source validation,
not device or production RLS certification.

## Editorial description batch — 2026-10-17

On 8d75726 plus LF-032 patch, full rerun passed **1387/1387**, zero failures,
exit 0. Initial 1386/1387 run found missing work-board links in the new note;
links corrected, workflow 4/4 and full rerun passed. Evidence: `D:/LorefyDevelopment/QA/remaining-repairs-20261017/editorial-detail-final-tests.txt`.
[[sessions/2026-10-17-Editorial-Detail-Synopsis]] records publisher sources and
local browser results. Four repaired web files match both native web copies
by SHA-256. This does not certify installed native UI, live service or all metadata.

## Storage operation ownership — 2026-10-17

LF-033 on e02ef95 plus patch: **1411/1411 passed**, zero failures, exit 0.
24 regressions (23 failed before patch), 67/67 related cases. Evidence: `D:/LorefyDevelopment/QA/remaining-repairs-20261017/storage-owner-full-tests.txt`.
[[sessions/2026-10-17-Storage-Operation-Owner]] documents scope and limits; no live service/device certification.

## Review mutation session ownership — 2026-10-17

LF-034 on 20fca00 plus patch: **1431/1431 passed**, zero failures, exit 0.
20 regressions (18 failed before patch); 75/75 related cases. Evidence: `D:/LorefyDevelopment/QA/remaining-repairs-20261017/review-mutation-full-tests.txt`.
Isolated demo home 390px had no pageerrors. No live account mutations/device certification.
[[sessions/2026-10-17-Review-Mutation-Session]] records the remaining cleanup atomicity and service boundary.

## Profile relationship ownership — 2026-10-17

LF-035 on 73447e3 plus patch: **1476/1476 passed**, zero failures, exit 0.
45 regressions (36 failed before patch), 84/84 related cases. Evidence: `D:/LorefyDevelopment/QA/remaining-repairs-20261017/profile-relationship-full-tests.txt`.
backend/index/sw SHA-256 match both native web copies. No live follow/block writes,
RLS/visibility certification or new native binary. [[sessions/2026-10-17-Profile-Relationship-Session]].

## Community request ownership — 2026-10-17

LF-036 on d801080 plus patch: **1503/1503 passed**, zero failures, exit 0.
27 regressions (25 failed before), 80/80 related. Actual Chrome with isolated
localStorage/auth/RPC rejected an old request before RPC and retained current reply parent.
Evidence: `D:/LorefyDevelopment/QA/remaining-repairs-20261017/community-mutation-full-tests.txt`
and community-mutation-browser.json. [[sessions/2026-10-17-Community-Mutation-Session]].
No production operation or installed-device certification.

## Chapter review request ownership — 2026-10-17

LF-037 on e629e43 plus patch: **1526/1526 passed**, zero failures, exit 0.
23 regressions (18 failed before), 56/56 related. Exact quarters, zero for
comment-only, spoiler flag and owner-scoped deletion remain verified.
Evidence: `D:/LorefyDevelopment/QA/remaining-repairs-20261017/chapter-session-full-tests.txt`.
[[sessions/2026-10-17-Chapter-Review-Session]]. No live writes, RLS or installed-device certification.

## Notification Backend and channel ownership — 2026-10-17

LF-038 on 271f6ad plus patch: **1566/1566 passed**, zero failures, exit 0.
First 37 new cases had 34 failures; final 40 cases and related 64/64 passed.
Evidence: `D:/LorefyDevelopment/QA/remaining-repairs-20261017/notification-backend-full-tests.txt`.
Isolated home AR/EN and matching source/native web assets are recorded in
[[sessions/2026-10-17-Notification-Backend-Session]]. No live push send, service deployment or native build.

## Account deletion request isolation — 2026-10-17

LF-039 on c4b07e7 plus patch: **1579/1579 passed**, zero failures, exit 0.
First 12 cases had 11 failures; final 13 and related 22/22 passed.
Evidence: `D:/LorefyDevelopment/QA/remaining-repairs-20261017/account-deletion-session-full-tests.txt`.
[[sessions/2026-10-17-Account-Deletion-Session]]. All deletion/sign-out calls mocked; no live account deletion,
SDK-internal teardown or installed-device certification.

## Local teardown ownership — 2026-10-17

LF-040 on 5e0c700 plus patch: **1610/1610 passed**, zero failures, exit 0.
First 28 new cases had 26 failures; final 31 and related 109/109 passed.
Actual Chrome isolated localStorage retained the new account after an old logout,
then current logout cleared it. Evidence: `D:/LorefyDevelopment/QA/remaining-repairs-20261017/session-teardown-full-tests.txt`
and session-teardown-browser.json. [[sessions/2026-10-17-Session-Teardown-Owner]].
SDK transport mocked; live SDK/auth storage and physical device remain separate.

## Profile requester reads — 2026-10-17

LF-041 on 05cfd24 plus patch: **1645/1645 passed**, zero failures, exit 0.
35 new cases (32 failed before); focused 77/77. Isolated Chrome rejected old
profile reads before another RPC and accepted current search. Evidence in
D:/LorefyDevelopment/QA/remaining-repairs-20261017/profile-read-full-tests.txt
and profile-read-browser.json. [[sessions/2026-10-17-Profile-Read-Session]]. No live RLS/device claim.

## Feed requester reads — 2026-10-17

LF-042 on 539b15d plus patch: **1695/1695 passed**, zero failures, exit 0.
50 new cases (initial 49: 38 failed), related 171/171; isolated Chrome rejects
old review results before a profile fetch and current posts work.
Evidence: D:/LorefyDevelopment/QA/remaining-repairs-20261017/feed-read-full-tests.txt
and feed-read-browser.json. [[sessions/2026-10-17-Feed-Read-Session]]. No production/device claim.

## Search alias refresh — 2026-10-17

LF-043 on 38bc374 plus patch: 15 new cases (14 failed before), **74/74 focused passed**.
Chrome isolated Arabic alias replacement and stable ID/index reuse passed; six
canonical/ios-web/native public assets SHA-256 matched. Evidence in
D:/LorefyDevelopment/QA/remaining-repairs-20261017/search-alias-focused.txt
and search-alias-browser.json. [[sessions/2026-10-17-Search-Alias-Refresh]]. This patch has
focused evidence; prior full 1695/1695 belongs to the LF-042 source.

## Import preview scope — 2026-10-17

LF-044 on e10f3d5 plus patch: **118/118 focused passed**, with 20 new cases
(initial 17: 16 failures). Chrome isolated real DOM/localStorage blocked stale
confirmation and retained a valid retry and fractional score. Evidence:
D:/LorefyDevelopment/QA/remaining-repairs-20261017/import-session-focused.txt
and import-session-browser.json. Full first run 1728/1730, second 1730/1731:
cache integration and obsolete version assertions were corrected and their
focused tests passed; these runs are not relabeled as a full pass.
[[sessions/2026-10-17-Import-Request-Session]]. No live service/device claim.

## Import save failure — 2026-10-17

LF-045 on 8001097 plus patch: **86/86 focused passed**, 7 unit cases (6 failed before)
and 2 UI cases. Chrome isolated actual Web Storage retained previous raw values
after a forced write failure, then explicit retry succeeded. Evidence in
D:/LorefyDevelopment/QA/remaining-repairs-20261017/import-save-focused.txt
and import-save-browser.json. [[sessions/2026-10-17-Import-Save-Failure]]. A failed rollback
is distinctly reported; no atomic multi-key/cloud/device guarantee.
