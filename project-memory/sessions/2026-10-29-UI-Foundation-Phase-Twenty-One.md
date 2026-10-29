---
kind: session
status: source-browser-verified-device-pending
date: 2026-10-29
---
# Modern profile list image recovery

Continuation of [[sessions/2026-10-29-UI-Foundation-Phase-Twenty]]. Existing
Plugin Management, UI/UX Pro Max, Apple guidance, test-first debugging and
Playwright used. No new dependency, installation, GitHub, native build or live
service change. This batch covers modern profile Lists, not all profile media.

## Cause and changes

- Modern list image() removed failed native images permanently. It now adopts
  the existing DOM portrait owner for envelope previews, intro artwork, ranked
  detail, editor rows and work/character search candidates. Only the projected
  item URL is used; visitor media never consults the viewer's custom portraits.
  Existing http(s) sanitation, storage schema, limits and permissions retained.
- Decorative images inside the native Open folder button remain read-only;
  recovery is available after opening the ranked list. Replaced map(image)
  callbacks with explicit callbacks so an array index cannot become retryHost.
- Detail and candidate images contain centered44px Retry. Editor art remains
  36x48; its external44px Retry sits over the art without covering rank tools.
  Add/choose-work is a separate native selector, never the Retry parent. A
  selected result disables only Add; its image can still be recovered. Keyboard
  recovery returns to an enabled selector/rank action or named image group.
- Retained draft rows keep their media on reorder. Rank keyboard navigation now
  queries the tool group rather than all row buttons, so image Retry does not
  change move/remove focus indexes. Candidate selection updates in place.
- Scoped disposal releases only list-owned media on panel replacement, search
  filtering, draft row removal, Overview, account replacement and detached page.
  Timers/listeners/observers and external Retry are released. Already-started
  native transport is not cancelled; late completion cannot repaint a disposed
  owner. No automatic retry or substitute artwork was added.

## Verification

- Eight regressions failed before implementation and pass afterward. Existing
  extracted editor harnesses now supply scoped replacement/disposal; stable
  result identity tests use the independent native selector. Focused22/22;
  complete source suite2940/2940,0 failures.
-120 browser cases: owner and synthetic visitor, AR/EN,320/390/768, pink/dark.
  Detail/editor/candidate recovery, original-source isolation, native independent
  actions, keyboard focus, stable reorder/add/remove, filter cleanup, cancelled
  persistence, Overview and page teardown. No nested buttons or uncaught errors.
- Six extra boundary cases: held visible request reaches error; no automatic
  retry; repeated keyboard activation creates exactly one pending native image;
  Overview releases pending media; late load cannot repaint; account replacement
  removes the old draft. Browser can coalesce identical pending URLs, so the
  pending test counts native image insertions as well as transport requests.
  Initial request-count-only assertion was corrected after observing coalescing;
  production source was not changed to force duplicate network traffic.
-12 before/after configurations preserve42 intro/row/image/editor dimensions
  within1px. Narrow Arabic envelope, detail, pending Retry and editor screenshots
  reviewed.4 changed web/entry files mirrored to both runtime copies; matching
  SHA256 and JavaScript parse verified. Cache lorefy-v632-profile-list-media;
  changed asset key20261029-profile-list-media-v1. No Capacitor prepare/sync.
- External evidence: `artifacts/ui-execution-phase21-20261029/` holds scripts,
  browser JSON, screenshots, geometry and full-source log/verification. Initial
  failure: `artifacts/profile-list-media-red.log`. Isolated contexts closed.
  Fixture draft add/remove was cancelled, never saved to a real account.

## Remaining

F07 remains partial: public/rated/profile character tiles outside modern Lists,
other picker choices, character-page work cover, avatars/banners and published
review/quote images are distinct owners. Legacy share-poster images retain a
separate export lifecycle. F08 edition grouping and real service/two-account/
iPhone accessibility/performance acceptance are still open. Synthetic visitor
coverage is not two-account validation; nothing was pushed or deployed.

[[13-Project-Story]] | [[14-Feature-Coverage]] | [[systems/Language-Media]] |
[[systems/Profiles-Lists]]
