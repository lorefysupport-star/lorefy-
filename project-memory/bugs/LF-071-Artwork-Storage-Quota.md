---
{"kind":"bug","id":"LF-071","status":"closed","priority":"P1","area":"media","date":"2026-10-19","reviewed_on":"2026-10-19","source_commit":"727c5f3","source_verified":true,"device_verified":false,"service_verified":false,"requires_device":false,"requires_service":false,"verified_on":"2026-10-19","resolution_evidence":"[[sessions/2026-10-19-Discord-Artwork-Quota]]","next_action":"Verify quota recovery on an authorized matching iPhone release; no build requested"}
---
# LF-071: Artwork choice fails with a raw Web Storage quota error

The Discord image in the linked receipt shows `The quota has been exceeded`
above the cover picker. This is distinct from network/permission/image-decoding
failure. [Custom artwork](../../backend/lorefy-custom-artwork.js) performed one
Web Storage write with no quota recovery. The failed atomic write preserved the
old map, but choosing a small remote image could remain blocked by cast caches.

On a recognized quota exception only, the save reclaims strictly named
`lorefy.characterCastCache.vN` downloaded caches one at a time, retrying after
each removal. These contain provider cast data and are recreated by
[the character system](../../modules/lorefy-character-system.js); account
ratings, custom images, library, identity, pending journal and state base are
never removed. No broad `clear`, prefix pruning or backend write bypass.

If it still cannot fit, a localized error explicitly says no image choice was
saved and previous data is unchanged. No stored-state event or cloud push occurs
on failure. The exact size/cause of the reporter's device storage is unknown;
this reproduces the failure class, not the original device contents.

Six added regressions, five initially failing, and 42 focused cases passed.
Full suite:2183 passed. [[sessions/2026-10-19-Discord-Artwork-Quota]] |
[[systems/Language-Media]] | [[12-Device-Repairs]] | [[15-Work-Control]]
