---
kind: session
status: source-browser-verified-device-pending
date: 2026-10-29
---
# Home Continue reading cover and backdrop states

Continuation of [[sessions/2026-10-29-UI-Foundation-Phase-Fourteen]]. Plugin
Management selected existing tools; no installation needed. UI/UX Pro Max
error-recovery/image-scaling guidance, test-first/debugging and Playwright used.
Local only; no GitHub, native build, Apple or production-service mutation.

## Reproduced and changed

The controlled legacy Home fixture returned404 for its cover/artwork. All four
native images were replaced with a generated data SVG by the existing error
path. There was no explicit cover/background recovery action. Baseline geometry
was recorded before changes in8 AR/EN,320/390,pink/dark configurations.

- `modules/lorefy-home-cinema.js`: Continue reading backdrop, main poster and
  work-selection thumbnails adopt the existing managed media lifecycle. Main
  poster uses `LorefyLibraryMedia.card`; background uses a decorative wrapper
  with a separately named Retry background control. Original URLs, exact-work
  commissioned-art binding, rights-safe branch and progress callbacks remain.
- Thumbnails retain their native selection button, title and aria-pressed state
  even when art fails. Their compact error/missing presentation is an icon, not
  a nested retry button or a generated cover. Recovery is offered on the selected
  large poster; an already-failed thumbnail does not automatically retry when a
  different image instance succeeds. This avoids new automatic request loops.
- `modules/lorefy-library-media.js` accepts optional loading priority, defaulting
  to lazy for unchanged consumers. Home's large poster opts into eager loading.
- `modules/lorefy-cover-media.js` forwards optional fetchPriority to the actual
  image. Home backdrop retains high priority. Source/attempt keys, bounded wait,
  single-flight explicit retry and stale-event cleanup remain shared behavior.
- `styles/lorefy-cover-media.css`: Home-only rules retain main2:3 art geometry,
 28x40 thumbnail art and the existing sharp backdrop crop/mask. Decorative status
  text is hidden inside aria-hidden art, while its44px recovery control remains
  accessible and opposite the reading switcher. No backdrop blur introduced.
- Six assets, including index/sw, selectively mirrored to both web runtime
  copies. Cache `lorefy-v626-home-media`, changed asset key
  `20261029-home-media-v1`. No native prepare/sync or new artwork.

## Verification

- Five initial adoption/material tests failed before implementation; six source
  regressions added in total, including forwarding actual image fetch priority.
  Full source suite2893 passed,0 failed. Earlier cache-version assertions updated
  without weakening their matching entry/offline asset checks.
-14 Home browser cases:8 AR/EN x pink/dark x320/390 controlled failures/retries;
  delayed old-source failures after selecting another work; empty and missing
  source cases; rights-safe art suppression; and2 actual Home-to-work opens.
- Background keyboard retry and poster pointer retry each add exactly one
  request. Retry does not open work; separate Open passes the right work ID.
  Failed thumbnail selection works. Sampled library/progress/favorite values
  stay unchanged. Artwork decodes on success; errors do not replace source URLs.
-8 before/after geometry comparisons preserve scene/poster/switch/backdrop size
  and placement within1px. Ready/error dimensions also remain stable in Home QA.
-26 fresh Library/owner-profile regression cases pass after the shared optional
  loading/fetch-priority extension. Total40 browser cases,0 uncaught page errors;
  all contexts isolated and closed. Representative screenshots inspected.
- External evidence: `artifacts/ui-execution-phase15-20261029/` includes browser
  scripts/JSON, source test logs, before/after geometry and byte-parity checks.
  Provider-shaped URLs are intercepted fixtures, not provider-availability proof.
- The local server had stopped between continuations. Restarted the existing
  Node API preview on8796 in a hidden process; no new public/network service.

## Remaining

This is the Home Continue reading consumer batch, not every Home image or all
F07. Friend-review/feed covers, Explore feature/format art, Work hero, profile
banners/avatars, character images and picker internals retain their separate
owners. Real image providers, physical iPhone/performance/accessibility and F08
edition grouping remain open. No user image, reading state or catalog was saved.

[[13-Project-Story]] | [[14-Feature-Coverage]] | [[systems/Language-Media]] |
[[systems/Reading-Library]] | [[systems/Community-Notifications]]
