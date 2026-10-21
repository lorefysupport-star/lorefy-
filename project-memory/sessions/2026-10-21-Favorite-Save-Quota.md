---
kind: session
status: source-browser-and-simulator-verified
date: 2026-10-21
---
# Favorite slot save and storage pressure

Owner reports slot 2 choices do not remain after Save. The previous stable-rendering tests verified node identity but did not verify actual storage failure or a save/reopen round trip.

Read-only simulator LocalStorage inspection found 5,251,571 bytes used; the downloaded API catalog cache accounted for 4,132,878 bytes. The shared growth `write()` helper hid storage exceptions, the favorite setter discarded its success flag, and Save always closed with a success toast. This explains how a quota-blocked favorite choice could appear saved while the persisted slot remained unchanged. No auth/session values were read or retained.

Repairs:
- `modules/lorefy-storage-budget.js`: an early-loaded write helper retries quota-blocked saves after evicting only an exact allowlist of reproducible catalog/cast/relation caches. It never evicts account, pending-sync, identity or session data. Other errors propagate; unrecoverable quota returns false.
- `modules/lorefy-growth-features.js`: shared writes use the helper; favorite serialization returns success, and Save keeps the draft open with a failure message when it cannot persist. Existing owner guards and slot positions remain intact.
- `modules/lorefy-api-catalog.js`: downloaded cache is bounded to 512K UTF-16 code units (up to 1 MiB), with bounded batch metadata and references pruned to retained works. Existing oversized caches are trimmed through their normal read path. Source catalogs and runtime catalog records are not removed.
- `index.html` and `sw.js`: early helper and fresh affected asset versions.

Evidence: 82 focused tests passed, including quota retry while preserving account data, non-quota errors, exhausted storage failure, real favorite serialization/save/reopen with slot 2, byte-bounded cache, account sync/recovery, catalog demand loading and UI contracts. Browser isolated demo placed Guts into slot 2, saved, reopened, reloaded the page and reopened again; slot 2 remained Guts. No real account favorite was chosen/removed during this verification.

Selective web assets synchronized to the existing Device Hub installation. After launch the native catalog cache fell to 789,848 bytes and total storage to 1,908,541 bytes. Hash comparison of the native favorite selection confirmed it was unchanged by the update. This confirms freed storage and preserved choices, not a cloud round-trip or physical-device save certification. No commit, push, native compilation or production migration.

[[sessions/2026-10-21-Stable-Rendering]] | [[systems/Profiles-Lists]] | [[systems/Accounts-Sync]]
