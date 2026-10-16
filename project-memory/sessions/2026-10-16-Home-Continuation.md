---
kind: session
status: verified-source
date: 2026-10-16
reviewed_on: 2026-10-16
---
# Reconnect Saved Reading to Current Home

Source parent `e116b58`. [[17-Extended-Review-Plan]] calls for continuation from
a real saved stop point. Investigation found two distinct facts: the old `ir`
selector used a status string instead of its entry id, and current social Home
never calls that old catalog renderer at all. Fixing only the selector passed
unit tests but did not display anything in the actual current Home.

The repaired source reconnects a compact continuation section before the existing
social feed, using the already owner-derived `Hn` work set and at most four
entries. For You/Following and the catalog/discovery architecture remain intact.
The older selector also uses its work id correctly. An obsolete static regex
which explicitly asserted the defective selector was corrected, not removed.

Cards are native buttons, name the work and open its existing detail flow. They
show the original saved chapter/page/volume summary. The old percentage renderer
showed 0% for an ongoing work with a saved checkpoint; the reconnected section
therefore shows the stop point without inventing a total or percentage. No
completion, history, review, checkpoint or storage-schema mutation is added.

Evidence: five selection behaviors failed before the selector repair; the
current-Home binding test then failed even with that repaired selector. Nine new
regressions now cover all saved units, status exclusion, status-key poisoning,
zero, account-map isolation, bounds, real renderer activation, native-button
opening, empty state and absence of invented percentages.

Current-source EN/dark browser: an isolated demo work was changed from Completed
to Reading with its existing 420-chapter checkpoint unchanged. After reload,
the current social Home showed the continuation card and the two community tabs.
Enter on the card opened the correct detail page, still with the same checkpoint.
No live account was edited. Native Build 35 was not updated or certified.

Additional browser checks: AR/dark and EN/dark at 320x900; document and scroll
widths both 320, one card, correct localized checkpoint. Returning the fictional
work to its original Completed status removes the section and preserves 420
chapters. The demo's language was restored to Arabic. Screenshots stay outside
Git/vault. The current Home work-set selector and fallback are both executed
against identical status/progress fixtures; neither borrows another map's data.

Final full suite: `npm test`, 1300 passed, 0 failed. An initial full run caught
the new note's unsupported temporary status value; it was replaced with the
verified source result and the entire suite was rerun. No runtime test was skipped.

Existing web copies only: main app, entry and service worker. Cache
`lorefy-v473-home-checkpoint`, app asset `20261016-home-checkpoint-v1`.
No native build, installation, Apple upload, production migration or deployment.

[[bugs/LF-023-Home-Continuation]] | [[systems/Reading-Library]] |
[[05-Verification]] | [[15-Work-Control]] | [[17-Extended-Review-Plan]]
