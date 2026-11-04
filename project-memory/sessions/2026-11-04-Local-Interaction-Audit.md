---
kind: session
status: source-browser-verified-device-pending
date: 2026-11-04
---
# Local interaction and image export audit

Continuation of [[19-UI-Execution-Control]], specifically P26 actual PNG
acceptance, not another F07 image-only pass. See [the local audit](../../docs/LOCAL_AUDIT_2026-11-04.md).

## Repairs

- [Share composer](../../modules/lorefy-share-composer.js): alternate thumbnails
  shared a catch path with selected PNG generation. An unavailable seventh
  image could disable a valid six-image Journal export. Unlock the main file
  before thumbnails; isolate thumbnail failures but retain selected-art errors.
- Disabling Save dropped focus to the document and broke Escape. Restore the
  initiating action only when focus was lost, without overriding deliberate
  focus movement, owner guards or cancellation.
- The profile sections selector forced the Favorites target to 32px. Related
  compact/shelf rules now agree on 44px. Banner/frame/book art unchanged.

## Evidence

Fresh full suite3379/3379; failure-first source tests;44 local screen/state
observations;196 additional browser checks with actual encoded PNGs.
AR/EN,320/390/768, dark/light/pink, Normal/Panoramic/Reader sampled.
Selective runtime sync, cache v692. No build, service mutation or GitHub push.
Physical share targets, providers and two-account service acceptance remain.

[[systems/Language-Media]] | [[systems/Profiles-Lists]] |
[[13-Project-Story]] | [[14-Feature-Coverage]]
