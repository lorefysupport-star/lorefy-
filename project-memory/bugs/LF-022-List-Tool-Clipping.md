---
{"kind":"bug","id":"LF-022","status":"closed","priority":"P1","area":"profiles","date":"2026-10-16","reviewed_on":"2026-10-16","source_commit":"eccb592","source_verified":true,"device_verified":false,"service_verified":false,"requires_device":false,"requires_service":false,"verified_on":"2026-10-16","resolution_evidence":"[[sessions/2026-10-16-List-Tool-Clipping]]","next_action":"Verify the repaired source on a future authorized device version; installed Build 35 remains unchanged"}
---
# LF-022: Ranked List Remove Button Is Clipped

The editor allocates only 84px for three toolbar buttons. The shared touch-target
minimum makes each button 44px, so the actual 132px group overflows its track.
In the AR/dark source preview at 320px the remove button spans x=-32 to 12.
The installed iPhone editor also visually omits the remove action. The native
check opened the editor and cancelled without changing or saving any entry.

The source repair gives the toolbar intrinsic grid width, three 44px tracks and
4px gaps. Names keep the flexible shrinking/wrapping column. No hide, scale-down
or reduced touch target is used to mask the overflow. Separate from keyboard
focus repair [[bugs/LF-021-List-Keyboard-Focus]].

All 30 controls are within their rows and at least 44px square in the AR/EN
320/440px source browser matrix. Two CSS regression contracts failed before and
passed after the repair. The visible remove button was exercised only in an
isolated demo draft and cancelled; the saved list still contained ten entries.
[[sessions/2026-10-16-List-Tool-Clipping]] records the evidence boundary.

[[15-Work-Control]] | [[12-Device-Repairs]] | [[17-Extended-Review-Plan]] |
[[systems/Profiles-Lists]]
