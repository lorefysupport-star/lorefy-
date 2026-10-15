---
kind: verification
status: maintained
---
# Verification Recipes and Evidence

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

Record the command, exit code, date, source commit and working-tree changes,
actual result, evidence path and remaining limitations. Synchronize any changed
runtime assets and compare source/generated hashes. A memory-only change does
not require shipping this vault in the application.

[[00-Home]] | [[04-Current-State]] | [[06-Known-Risks]]
