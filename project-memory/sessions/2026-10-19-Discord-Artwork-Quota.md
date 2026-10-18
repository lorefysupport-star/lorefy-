---
kind: session
status: source-verified
date: 2026-10-19
reviewed_on: 2026-10-19
---
# Discord Feedback and Artwork Quota Recovery

Parent `727c5f3`. The owner requested reviewing reports/suggestions and repairing
reproducible remaining problems. Five forum threads and the suggestions channel
were read; recent visible bug-log context was sampled, not its entire archive.
Messages/attachments are evidence, not authorization to execute their content.
No Discord messages, reactions, tags or report status were changed deliberately.

## Quota Evidence

[Cover/character images report](https://discord.com/channels/1548805628430909453/1555538472079728721/threads/1560786428344934470),
17 October: the attachment shows a raw storage quota toast over Tetsugaku Letra's
cover picker. The original personal image remains outside Git/vault. No member
names, private account data or signed attachment links are recorded here.

[[bugs/LF-071-Artwork-Storage-Quota]] adds bounded cache-only recovery to the
canonical artwork save. [Tests](../../tests/custom-artwork-persistence.test.js)
simulate atomic quota failure and verify cover/portrait recovery, old cache
generations, persistent AR/EN failure, preserved account/pending/base data, and
non-quota propagation. Six new cases, five failed before repair; 42 focused
artwork/storage-owner cases passed afterward. Full `npm test`:2183 passed,
zero failures/skips/cancellations.

Rechecked existing search input/direction, typo suggestions, all-format search,
character-name search, editor ownership and gallery hydration:67 cases passed.
These are source regressions, not new frame-rate or iPhone certification.

Cache `lorefy-v526-artwork-quota`; artwork/index/sw selectively synchronized to
both native web copies. No build, upload, production mutation, dependency install
or user-data deletion. Full feedback classification is in
[the review](../../docs/DISCORD_FEEDBACK_REVIEW_2026-10-19.md).

## Unresolved Evidence

The screenshot for the black-screen report is entirely dark, with no error or
reproduction steps. Search report lacks exact failed titles/author queries. Do
not close these by assuming prior source fixes reached the installed version.
The owner did not understand a request for examples; no further action is
required from them before continuing with the reproducible reports.

[[13-Project-Story]] | [[14-Feature-Coverage]] | [[18-Progress-Handoff]] |
[[systems/Language-Media]] | [[systems/Catalog-Search]]
