---
kind: session
status: verified-source
date: 2026-10-16
reviewed_on: 2026-10-16
---
# Ranked List Tool Containment

Source parent `eccb592`. The prior keyboard repair exposed a separate geometry
bug: 84px reserved for three actual 44px hit targets. The AR 320px source preview
measured the remove control at x=-32..12, outside its row. On installed Build 35,
native HID opened the owner's list editor; only the two arrow actions were
visible. The editor was cancelled without changing or saving real data.

`styles/lorefy-profile-sections.css` now allocates `max-content` to the toolbar,
with three fixed 44px grid tracks and 4px gaps. Icon width and minimum width
agree with the shared 44px target. The title column retains `minmax(0,1fr)` and
existing wrapping. No changes to frames, profile imagery, list storage or sync.

Evidence: two layout-contract tests failed before the CSS repair; afterward the
22 focused list tests passed. Full `npm test`: 1291 passed, 0 failed.
Browser source matrix: Arabic/dark and English/dark,
each at 320x900 and 440x956. Each case has 30 buttons, all within their own rows,
at least 44x44; document client and scroll widths agree (320 or 440). Screenshots
were checked after resizing settled; they remain outside Git/vault.

The English 320px demo remove control removed the first item from the draft and
focused the next entry's remove control. Cancel returned to the original saved
ten-entry list. No live account or cloud mutation was involved. Source geometry
passing is not proof the fix is installed, nor a VoiceOver/large-text certificate.

Only existing affected web copies were synchronized. Entry stylesheet cache:
`20261016-list-tools-v1`; service worker `lorefy-v472-list-tools`. No native
build, install, EAS command, Apple upload or production deployment was run.

[[bugs/LF-022-List-Tool-Clipping]] | [[systems/Profiles-Lists]] |
[[17-Extended-Review-Plan]] | [[05-Verification]] | [[15-Work-Control]]
