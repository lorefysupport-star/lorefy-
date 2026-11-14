---
kind: repair-session
status: source-browser-verified-device-pending
date: 2026-11-14
---
# Library formats and controls

Owner requested another Lootd Library UI/mechanism pass and a Novel/Manga/etc
selector. [Report](../../docs/LIBRARY_FORMAT_V719.md) separates fresh reference
observations from implementation and device/provider limits.

Library Collection now keeps a type-keyed metadata snapshot and scopes status
totals/cards before query/sort/paging. Format state is local, owner-scoped and
restored on detail return; old callbacks cannot affect a different context.
Changing type does not resolve catalog records or add network searches again.
Positive reading checkpoints, saved membership and all four views stay intact.

Header/Add, type/order fields, horizontal status controls and the relocated
layout switch share existing glass tokens. Empty queries show short saved status
labels rather than repeated missing-progress copy. Small-screen fields stack.

Fifteen added tests first failed;88 focused cases pass. Actual local browser
checks include all eight formats plus All, work return, reset/clear and96 cases
across AR/EN, three widths, four modes and four themes. No page errors/overflow,
44px targets retained. Final full suite:3609 passed,0 failed,119666ms, exit0;
log in parent workspace `output/library-v719-tests-final.log`. Twelve mirrored
native-web files match source byte-for-byte. Memory audit:383 notes,887 source
files, fresh snapshot, no orphan notes or issues.

v719 changed web assets are selectively mirrored, not compiled. No live data,
service configuration or Apple upload. [[systems/Reading-Library]],
[[13-Project-Story]] and [[14-Feature-Coverage]] preserve source/device boundaries.
