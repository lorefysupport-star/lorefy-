---
kind: session
status: source-browser-verified-device-pending
date: 2026-11-01
source_commit: 56f81fe
---
# Derive favorite format from reading evidence

Owner favorite format incorrectly weighted unread favorites, wishlist entries
and arbitrary review scores. The shared public appearance fallback counted the
same unread items and could prefer its stale stored favorite_type.

The owner now uses the shared canonical calculator, with library/progress and
owner reviews only. Count each completed or positive-progress work once; an
owned already-earned positive review completion is reading evidence as well.
No weights for favorite covers, wishlist, numeric rating or duplicates. Ties
retain the established canonical format order. Empty evidence displays a dash.
Arabic/English labels are explicit. A public projection lacking progress may
use its explicit Reading status, and a projection lacking library data entirely
may use its supplied favorite_type. No viewer storage enters public rendering.
Partial catalog sync retains the prior stored type only while an eligible
reading identity is unresolved; unrelated unread favorites no longer hold it.

Tests reproduce unread Comics winning over completed Shadow Slave. Focused30
passed; full3228 tests passed after replacing one obsolete implementation regex
with a shared-calculator/owner-only argument assertion. Actual demo AR/EN x
normal/panoramic/reader:6 checks passed, no page exceptions. No real user write,
native build or production change. Cachev666 and eight web mirrors synchronized.

[[systems/Profiles-Lists]] | [[systems/Reading-Library]] | [[15-Work-Control]]
