---
{"kind":"bug","id":"LF-072","status":"closed","priority":"P2","area":"reading-ui","date":"2026-10-19","reviewed_on":"2026-10-19","source_commit":"157e5cb","source_verified":true,"device_verified":false,"service_verified":false,"requires_device":false,"requires_service":false,"verified_on":"2026-10-19","resolution_evidence":"[[sessions/2026-10-19-Reading-Intent-Label]]","next_action":"Check the picker on a future authorized matching device release; no build requested"}
---
# LF-072: Wish-state picker copy does not express reading intent clearly

The Discord suggestion's screenshot asks for a want-to-read label in the reading
status picker. [The application](../../uploads/files/lorefy-app.js) rendered the
raw persisted status as UI copy. Renaming that constant would break existing
library, import and statistics contracts.

The picker now calls a display-only helper: Arabic `أرغب بالقراءة`, English
`Want to read`. Selection callbacks/save values still use `STATUS_WISHLIST`,
whose exact historical value remains unchanged. No migration or automatic save.
Other states and user content are not rewritten. Existing library tab naming
and other Wishlist labels are outside this picker-only suggestion.

The accessibility enhancer recognizes both new labels and the old labels, so
the option remains a keyboard-operable radio after locale changes. I18n knows
the new copy. Seven regressions and the browser receipt verify the boundary;
no live account or installed-app change.

[[sessions/2026-10-19-Reading-Intent-Label]] | [[systems/Reading-Library]] |
[[12-Device-Repairs]] | [[15-Work-Control]]
