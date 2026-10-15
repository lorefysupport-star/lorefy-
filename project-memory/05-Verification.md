---
kind: verification
status: maintained
---
# Verification Recipes and Evidence

Current integration: [[sessions/2026-10-15-GitHub-Sync]] records GitHub source
`542b39c` plus preserved local runtime repairs. Use its new verification receipt;
the earlier IPA and test counts do not establish this merged source was tested.

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

## Latest dated memory verification

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
