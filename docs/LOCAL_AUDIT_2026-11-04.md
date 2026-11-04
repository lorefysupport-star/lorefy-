# Lorefy Local Audit - 4 November 2026

## Scope

Source-only continuation on main at c670040 with pre-existing uncommitted
changes preserved. No GitHub push, native build, Apple upload, production
mutation, paid service setup or device-control action was performed.
Installed UI/UX Pro Max and Apple-like UI guidance informed interaction
recovery, touch targets and focus; this was not a visual redesign.

## Fixed

| Issue | Reproduced consequence | Repair |
| --- | --- | --- |
| Optional export preview invalidates a valid PNG | Journal has six valid images; another template requires an unavailable seventh image. The selected PNG becomes unavailable too. | Unlock the selected file immediately and isolate optional thumbnail failures. Selecting an unavailable design still reports an error. |
| Save loses keyboard focus | Disabling Save drops focus to the document; Escape no longer reaches the dialog after saving. | Restore the initiating action only when focus was lost to the document. Preserve deliberate focus changes, owner checks, cancellation and error handling. |
| Favorite editor target is too short | The interactive Favorites heading is only 32px tall due to the profile sections rule. | Keep compact/shelf heading minimums at 44px. Book art, shelf texture, banner and frame assets unchanged. |

## Verification

- Fresh full source suite: **3379 passed, 0 failed**, no skipped tests.
- Initial browser audit: **44 screen/state observations** across Arabic/dark/390,
  English/light/320, Arabic/pink/320 and English/dark/768.
  Routes: Home, Explore, Library, Profile, Work, Reading Status, Review,
  deliberate zero review, Cover picker, Characters and Settings.
  No page JavaScript exceptions or horizontal document overflow in this sample.
- Additional browser acceptance: **196 passed**. Includes keyboard activation
  of Favorites in Normal/Panoramic/Reader; optional thumbnail failure;
  unavailable selected art; recovery; and real PNG encoding/saving for Work,
  Review, Ranking and List in three templates and three output ratios.
- PNGs were decoded and dimensions checked at 1080x1080, 1080x1350 and
  1080x1920. File delivery uses a local stub, not iPhone Photos/Files/share.
- Failure-first tests precede each repair in share-render-lifecycle.test.js and
  profile-refinement.test.js. Cache assertions updated for v692; exact
  entry/offline versions and source/native-web copies pass the full suite.
- Five runtime assets selectively copied into ios-web and ios/App/App/public.
  This is not a native build.

Local browser artifacts and scripts are outside the repository:
output/playwright/audit-20261104, lorefy-current-audit.cjs and
lorefy-export-audit.cjs, relative to the shared workspace.

## Still Unverified

These are acceptance gaps, not new claims of confirmed production faults.

1. **Real iPhone auth/resume.** Previously deferred Apple web OAuth owner
   configuration was not revisited. Native login, keyboard, photo permissions
   and background resume were not exercised.
2. **Two-account services.** Reactions, visitor privacy, notifications,
   reconnect and cloud write acknowledgment need live two-account acceptance.
3. **Physical export delivery.** Local files pass; native Files/Photos/X share
   targets and cancellation still need a device run.
4. **Provider coverage.** This does not prove every novel/comic, character
   portrait, chapter picture or public written-review import is complete.
5. **Device performance.** All frame collections, long feed scrolling,
   memory growth and low-bandwidth behavior need device profiling.
   No FPS or lag-free claim is made from source tests.
6. **Distribution gates.** Current artwork rights and privacy declarations
   were not reassessed. No App Store readiness claim is made.

## Next Acceptance Work

Continue with a real two-account social/inbox journey and physical export
delivery when available. Keep source fixes distinct from device/service
acceptance; do not repeatedly redesign accepted layouts.
