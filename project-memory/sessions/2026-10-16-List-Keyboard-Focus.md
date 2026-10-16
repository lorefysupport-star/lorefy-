---
kind: session
status: verified-source
date: 2026-10-16
reviewed_on: 2026-10-16
---
# Ranked List Keyboard Continuity

Reference: the accessible-list and durable-draft gates in
[[17-Extended-Review-Plan]]. Source parent: `fea486a`.

Root cause: `selectedRows()` replaces every ranked row after move/removal without
restoring focus. The browser accessibility tree returned focus to the web area
after one move. Action labels also omitted the entry name.

Changed `modules/lorefy-profile-sections.js` only for this behavior: focus moves
with the entry, chooses an enabled action at the boundary, and has a defined
removal fallback. The existing status region announces localized position and
the original name. No text field recreation, automatic save or storage schema
change. Entry HTML is not interpreted. Entry names remain untranslated.

Evidence: `node --test tests/profile-list-keyboard.test.js` first failed three
behavioral cases (focus loss and ambiguous labels), while the existing draft
save paths passed. After repair, six new cases and 19 related cases pass.
The AR/dark 320px browser preview moved Killua from first to second with Enter,
then to third with another Enter on the currently focused control. Focus stayed
on that entry's move-down action, and the status read position 3 / 10.

Full verification: `npm test`, 1289 passed, 0 failed. The first full run caught
a missing work-control link in the new bug note; the link was corrected and the
complete suite rerun successfully. No application test was bypassed.

Screenshots are local outside Git/vault. A separate existing layout defect was
found: a toolbar allocated 84px contains three actual 44px buttons, clipping the
remove button. Do not treat this behavioral repair as resolving that geometry.
No VoiceOver, cloud-service or installed Build 35 verification was performed.

Selective copies: existing `ios-web` and `ios/App/App/public` module, entry and
service worker. Cache `lorefy-v471-list-keyboard`; no native build or sync.

[[bugs/LF-021-List-Keyboard-Focus]] | [[systems/Profiles-Lists]] |
[[05-Verification]] | [[15-Work-Control]]
