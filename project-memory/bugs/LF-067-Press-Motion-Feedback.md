---
{"kind":"bug","id":"LF-067","status":"closed","priority":"P2","area":"appearance","date":"2026-10-18","reviewed_on":"2026-10-18","source_commit":"094636d","source_verified":true,"device_verified":false,"service_verified":false,"requires_device":false,"requires_service":false,"verified_on":"2026-10-18","resolution_evidence":"[[sessions/2026-10-18-Apple-Interaction-Quality]]","next_action":"Check the changed web assets on a future installed release separately; no native build requested"}
---
# LF-067: Press feedback ignores reduced-motion displacement

Browser reproduction at 375x812: forcing the Settings button's active state
showed a 90ms transition and a scale transform. Reduced motion shortened the
duration but left the scale in place. Older UI/system rules caused this; the
shared reduced-motion rule only changed duration, not the active transform.

The authoritative stylesheet now gives core profile, navigation, primary,
review, rating and switch controls immediate opacity/scale press feedback.
Reduced motion removes their scale and keeps the opacity cue. Disabled and
aria-disabled controls are excluded from the new effect. Actions still use
their original activation handlers, not pointer-down side effects.

This deliberately does not reset all transforms: shelves, portraits and frame
art retain their existing geometry. It is not a whole-app gesture audit.
Evidence: three red-then-green tests, 57 focused tests and 2110 full-suite passes;
AR/light and EN/dark browser checks. No installed-device or live-service claim.

[[15-Work-Control]] | [[12-Device-Repairs]] | [[systems/Appearance-Bundles]] |
[[playbooks/Apple-Interaction-Quality]]
