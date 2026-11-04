# Source Checkpoint - 2026-11-04

Owner request: publish the remaining local Lorefy repairs after notification
checkpoint `86c2d19`. This publishes source, not a new application build.

## Included

- Share composer: valid selected PNGs remain available when an optional thumbnail
  fails; selected-art errors remain explicit; focus recovers after saving.
- Visitor profiles: remove obsolete Top 10 works display without deleting saved
  rankings; retain real favorites, localized empty states and Reader labels.
- Shared sheet header dragging for review, status, cover and customization,
  including current-panel and pending-save guards.
- Consistent themed glass, library filters, 44px Favorites controls, Home compose
  placement and Explore search cancellation behavior.
- Six selected Halloween packs (H1/H2/H3/W2/W3/G2), artwork, catalog entries,
  animations and guarded database migration history.
- Curated project-memory notes and refreshed source indexes.

## Fresh Verification

- Full `npm test`: **3396 passed, 0 failed**, after cache identifier changed to
  `lorefy-v694-remaining-repairs`.
- Playwright: **192 passed, 0 failed**. Actual PNG encoding/saving for
  work/review/ranking/list, three templates and three aspect ratios, optional-art
  recovery, three profile layouts, AR/EN, dark/light/pink, 320/390/768px viewports.
- Changed canonical web files and artwork are synchronized to both tracked web
  trees. New ignored mirror resources are added explicitly, not by adding whole
  ignored directories.
- Animated-frame matrix: **546 passed, 0 failed**, 72 owner combinations and
  18 public-profile fixtures. Six packs across Normal/Immersive/Reader,
  dark/pink, 320/440px: nonblank changing pixels, increasing frame counters,
  name clearance, clickable controls, persistence and removal cleanup.

Browser evidence is outside the repository in
`output/playwright/remaining-repairs-publish/`. Raw screenshots, recordings,
credentials and local tool configuration are not publication content.

## Boundaries And Remaining Gates

- No native build, EAS job, Apple upload, tester invitation or production SQL
  replay is part of this publication.
- Earlier "no GitHub push" notes describe historical sessions; this checkpoint
  records the later explicit publication request.
- Sign in with Apple server credentials still require the owning Apple team.
- Device FPS, native share targets and live two-account/provider acceptance are
  separate gates; passing local tests does not certify them.

See [local audit](LOCAL_AUDIT_2026-11-04.md),
[Halloween integration](HALLOWEEN_INTEGRATION_2026-11-02.md) and
[memory checkpoint](../project-memory/sessions/2026-11-04-Remaining-Repairs-Publication.md).
