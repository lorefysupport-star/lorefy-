---
{"kind":"bug","id":"LF-016","status":"needs-device","priority":"P2","area":"language","date":"2026-10-16","reviewed_on":"2026-10-16","source_commit":"7907d05","source_verified":true,"device_verified":false,"service_verified":false,"requires_device":true,"requires_service":false,"verified_on":null,"resolution_evidence":"[[sessions/2026-10-16-Review-Reply-Direction]]","next_action":"Check input direction and native keyboard on a future authorized iPhone version; no build now"}
---
# LF-016: Review Reply Input Respects the Interface Direction

English review details had an LTR parent but `#rev-reply-input` retained an inline
`direction:rtl` declaration. The placeholder was translated while the editable
field stayed right-aligned. This was reproduced on source after LF-015.

The authoritative shared stylesheet now overrides only this input to inherit
the containing layout's direction and align at its logical start. It remains
RTL in Arabic. No user text, stored replies, send logic or date parsing changes.

Regression: [design system test](../../tests/design-system.test.js), failing
before the rule, then passing. Browser checks used EN at 440px and AR at 320px;
unsubmitted sample text was cleared. [[sessions/2026-10-16-Review-Reply-Direction]]
records results and the separate unresolved date-localization observation.

[[17-Extended-Review-Plan]] | [[15-Work-Control]] | [[05-Verification]] |
[[12-Device-Repairs|Installed-device verification is still separate]]
