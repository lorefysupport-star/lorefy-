# Work Detail: Reading First

Date: 2026-11-11. Source/cache v709. Continues the Explore, Library and Profile
Lootd studies. This is an interface reorganization, not a native release or a
claim that production/provider latency has been eliminated.

## Reference Study

Observed the public [Lootd Elden Ring page](https://www.lootd.app/game/elden-ring)
in a desktop browser. Its work identity, factual metadata, personal log, rating,
friends/reviews and related content have distinct responsibilities. Opened its
log editor read-only and closed it without a save. No reference code, artwork,
private account information or screenshots were copied into Lorefy or Git.
Mobile Lootd behavior was not independently certified in this session.

Adopted the separation of personal activity from work metadata, not Lootd's game
model or branding. Lorefy retains chapters, reading states, characters, custom
covers, review recommendations, explicit zero ratings and custom colors.

## Implemented

- Compact artwork hero; poster, title, creator and attributed source score stay
  together. The source score is not presented as the current reader's score.
- A named reading-log tool contains the current reader's latest valid rating,
  status, saved progress and the existing action mount. Unrated and deliberate
  dislike-zero are distinct. Other readers' reviews cannot supply this score.
- Unknown catalog totals do not create a percentage meter. The saved textual
  progress remains visible, including existing completed-progress fallbacks.
- Status, review, cover and character controls reuse existing handlers/stores.
  Cover and character commands now have visible text. More remains an icon menu.
- Removed the redundant standalone status/progress card. Overview now orders the
  synopsis, reader/review controls, detailed scores, chapters and suggestions.
- Desktop has separate identity and reading-log columns. Mobile uses a compact
  single flow; narrow Arabic buttons retain complete labels and 44px targets.
- Work-review dislike controls receive a localized accessible name and count.
  No reaction mutation or notification behavior changed.

Canonical owners: `modules/lorefy-review-editor.js`,
`modules/lorefy-growth-features.js`, `uploads/files/lorefy-app.js`,
`styles/lorefy-work-cinema.css`. Updated `index.html`/`sw.js` versions and selected
six-asset copies in `ios-web` and `ios/App/App/public`; no native build.

## Acceptance

New regression file: `tests/work-reading-log.test.js` (five tests). Covers own
latest score/work isolation, explicit zero, AR/EN labels, responsive composition,
known/unknown progress and preservation of the existing action mount. Existing
work/language/reaction/cache regressions updated to the new contract.

Full suite: 3510 tests passed, zero failed. Final acceptance log and raw browser
evidence remain outside the repository at `artifacts/work-reading-20261111` and
`artifacts/work-reading-tests-20261111-final-acceptance.log` in the workspace.

Actual local browser checks:

| Work / Language | Theme | CSS Width | Result |
| --- | --- | --- | --- |
| Berserk / English | Custom light peach | 390 | No horizontal overflow; own score separate |
| Berserk / English | Custom light peach | 1280 | 300px reading-log column; no overflow |
| Berserk / Arabic | Dark | 320 | Cover/character labels fit after narrow-screen fix |
| Shadow Slave / Arabic | Light | 390 | Saved 5.00 personal score; no invented percentage |
| Berserk / Arabic | Custom light peach | 390 | No overflow; Escape closes cover and restores focus |

Status, review, cover and character tools opened for the correct work. Explicit
dislike-zero was previewed without publication. Overview/Reviews/Related switched
correctly; review reaction names were inspected in the rendered DOM. Preferences
were restored to Arabic, Reader/Showcase and custom light peach. No new reviews,
reading changes or cover changes were saved. Final phone preview loads the log.
Captured browser error log was empty at the end of these checks.

## Remaining Boundaries

- Physical iPhone scrolling, native safe areas, VoiceOver and live cross-account
  sync still require device/service acceptance. Browser evidence is not proof of
  TestFlight delivery or real-device latency.
- No production SQL, Edge function, provider configuration, Apple authentication
  configuration, signing setting or build was changed.
- Existing API artwork quality, unknown chapter totals and source-rating
  provenance remain dependent on their catalog/provider data.
