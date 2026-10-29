---
{"kind":"bug","id":"LF-015","status":"needs-device","priority":"P2","area":"import-ui","date":"2026-10-16","reviewed_on":"2026-10-16","source_commit":"80ba6b5","source_verified":true,"device_verified":false,"service_verified":false,"requires_device":true,"requires_service":false,"verified_on":null,"resolution_evidence":"[[sessions/2026-10-16-Import-UI]]","next_action":"Recheck contrast and field names on a future authorized native version; do not build now"}
---
# LF-015: Readable Import Actions and Named Fields

2026-10-28 follow-up: [[sessions/2026-10-28-UI-Foundation-Phase-Three]] adopts the
current glass/semantic material, visible field labels, direct AR/EN chrome and
announced loading/error/review states. Source/browser evidence is updated there;
this issue still requires native-device confirmation. Earlier evidence below is
historical, not a claim that the old visual treatment is current.

Dark-theme import buttons used white text on `#f0f0f3`. The overlay is attached
beside `.lf-app`, so `.lf-app.is-dark .lf-im-go` never matched. The legacy action
background resolved to the new theme action while its hard-coded foreground did
not. AniList/Kitsu username fields and pasted titles also lacked explicit names.

The scoped `.lf-im-page` rule now uses `--ui-action` with `--ui-on-action` for
primary, confirmation, return and selected-status controls, independent of app
ancestry. Status chips have 44px minimum height; input flex children can shrink.
Three fields receive bilingual accessible names. Import parsing, preview,
confirmation and live account data are not changed.

Regression: [import UI tests](../../tests/import-ui.test.js); all three failed for
the intended missing rule/names before the repair. Browser evidence and remaining
limits: [[sessions/2026-10-16-Import-UI]].

[[17-Extended-Review-Plan]] | [[15-Work-Control]] | [[05-Verification]] |
[[12-Device-Repairs|Device evidence is separate from a source repair]]
