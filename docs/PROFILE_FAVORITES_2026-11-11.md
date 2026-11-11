# Profile Favorites Acceptance

## Scope

Remove persistent image-edit overlays from profile favorites and enlarge the
three-work Showcase. Retain Normal, Panoramic and Reader; all four book views;
seven saved favorite slots; custom covers, portraits, palettes and animated frames.
UI/UX Pro Max and Apple interaction guidance informed the scoped editor controls.
No new dependency, production mutation or native build.

## Repairs

- The owner media adapter removes direct edit buttons from favorite work cards
  before creating managed media. Open/retry targets remain; missing media-service
  fallback also stays free of edit badges. Generic non-profile cards are unchanged.
- Favorite character tiles keep their accessible full-card editor trigger but no
  longer mount a separate image-edit badge. The selected character inside the
  editor retains its image action; rated-character/gallery tools are unchanged.
- The favorite-work editor exposes a 44px selected-cover action. Selecting a slot
  updates its accessible work name; empty slots disable it. It closes that editor
  before opening the existing cover picker, avoiding nested overlay interception.
  Account/lifetime and known-work checks reject obsolete commands. Existing cover
  persistence remains the authority; editor thumbnails prefer saved custom covers.
- Showcase width no longer depends on the remaining vertical header budget. It
  fills its available section up to560px, retaining the center-led three-book
  composition and responsive captions rather than deleting remaining saved items.
- Fresh asset URLs and cache `lorefy-v708-profile-favorites` are mirrored selectively
  into both native web directories. These are source assets, not an installed build.

## Evidence

- Red tests preceded implementation; focused media, command, caption, stable-picker
  and placement tests pass. Final whole suite:3505 passed,0 failed/skipped/cancelled,
  105.878s. Syntax validation and six-asset hashes across both mirrors also pass.
- Actual demo owner:12 combinations (3 layouts x4 views), zero cover-edit overlays,
  all five filled favorite records retained and their open controls present.
  Original Reader/custom-light-peach/Showcase preferences restored.
- Actual owner Showcase440px section: center178.14px versus153.92px before repair;
  three books visible, no edit badges. Cover command opens the selected third work
  in the existing picker. Character editor exposes the selected portrait action.
- Visitor fixture:24 combinations,3 layouts x2 languages x2 themes x320/440px.
  No horizontal overflow or owner edit controls; exactly three Showcase works.
  Fixture artwork is only for geometry, not a claimed real catalog cover test.
- Actual demo Explore search -> People -> test_noura opens the intended reader,
  retaining that reader's custom-dark-green/spine appearance and favorite works.
  No owner editor controls or horizontal overflow. Followers also open this reader.
- Raw screenshots, dimensions and logs are outside Git in workspace
  `artifacts/profile-favorites-20261111` and `artifacts/profile-favorites-tests-20261111-final.log`.

## Boundaries

This verifies browser/source behavior, not the installed iPhone binary. Physical
device safe areas, real-account network/media failures and long-running frame
performance still need device acceptance. No content, privacy or block policy was
changed. Earlier profile collection acceptance is in PROFILE_FLOW_2026-11-11.md.
