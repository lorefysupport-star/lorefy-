# Known Gaps and Next Checks

Captured 2026-10-10. A source handoff is not a security clearance, device certification, new submission or public launch approval.

## Newly Observed Dependency Advisories

Fresh `npm ci --ignore-scripts` followed by `npm audit --json` on the copied application reported four affected dependency entries: two critical and two high. Exact details are retained in `docs/BUILD34_NPM_AUDIT.json`.

- `@capacitor/ios` is directly pinned to 8.4.2, in the advisory range 8.3.5 through versions before 8.4.3. The Swift package also references 8.4.2. The [maintainer advisory GHSA-rvm3-566m-v7fv](https://github.com/ionic-team/capacitor/security/advisories/GHSA-rvm3-566m-v7fv) describes an internal HTTP proxy path that can load remote content at the app origin, and directs affected applications to upgrade, rebuild and redistribute. The handoff does not demonstrate a working exploit against Lorefy or a specific delivery path in its UI.
- The fresh npm tree also reported `@capacitor/android` as a transitive/peer critical advisory entry; this does not establish that an Android app was built or shipped.
- `@xmldom/xmldom` and `brace-expansion` are high-severity transitive tooling entries in this audit. Review actual dependency paths and reachability before prioritizing changes.
- Do not run `npm audit fix --force` on the frozen Build 34 snapshot or call it patched. Preserve this exact version as evidence. Create a separate working copy for a deliberate compatible upgrade, run native sync and the full regression suite, verify the patched Swift resolution, then build a new version only with explicit user approval.

This is an important next-release follow-up; old feature test success is not proof that these dependency advisories are resolved.

## Existing Beta Release Gates

- Physical-device Apple and Google sign-in, upload permission/orientation, push delivery, background resume and memory behavior remain unverified by this packaging work.
- Latest Build 34 documentation reports missing Apple web OAuth secret. Native Apple token flow follows a different path and needs actual hardware testing; do not conflate website OAuth with native success.
- Earlier APNs checks recorded a server-side credential/configuration gap. Current server secret values and physical push delivery were not checked here; do not claim they work from UI toggles alone.
- `privacyNutritionLabelVerified=false` and `contentRightsVerified=false` remain in release configuration. Do not flip them without completing the respective review.
- Imported PFP Vibes artwork still has `releaseAllowed=false`. Explicit beta inclusion is not a verified distribution license or permission to resell its assets.
- TestFlight processing/availability is separate from the saved EAS submission FINISHED receipt. No new authenticated Apple availability check or upload was performed for this handoff.
- Monitoring wrapper files do not establish live crash telemetry. Confirm an authorized configured endpoint/project, scrub sensitive data, and verify delivery before relying on it.
- Local SQL files are not a complete reproduction of all 42 deployed migrations. Cloud function snapshots and the inventory help reconcile state; the handoff is not a full live database export or a tested disaster recovery restore.
- Expo/Apple/GitHub/Google/Supabase account login and connector credentials were not migrated. Owner must reconnect them securely on the new device.

## Device Regression Checklist

1. Fresh install and upgrade over previous build, then sign in/out with authorized Apple and Google accounts.
2. Kill/reopen, background/resume, expired session, temporary offline connection and OAuth cancellation.
3. Avatar/banner/character/work image selection from camera/gallery, permission denial, image rotation, cloud durability after restart, and appearance when visited by another account.
4. Apply/reload/remove each decoration collection; confirm no clipped ears/ornaments, no following-count overlap, no stolen touch targets, and owner cover unchanged.
5. Ordinary/panoramic layout, covers/shelf library and favorites; use small and large phone dimensions, both system brightness modes and custom colors.
6. Arabic/RTL and English/LTR followers, public profiles, library sheets, detail views, reviews and feed tabs. User-written content should remain original.
7. Search/discovery, adding/removing/changing status/progress, completed metrics, reviews, ratings, character preferences and account-specific persistence.
8. Community author/post navigation, comments, reactions, bookmarks, reports, blocking/privacy and sticky feed tabs.
9. Push opt-in/out and actual delivery; deletion with Apple revocation and no leftover visible private account data.
10. Long scroll, repeated modal navigation, many animated frames, rotation/safe areas, memory pressure and crash/error logs.

Record device, OS, build, exact steps and result. Do not promise zero crashes based on 985 passing JavaScript tests.

## GitHub sync verification — 2026-10-10

The imported source is Build 34. EAS build 29797ce0-a6f0-488b-afb8-7cb66c5b1f6d is finished, and App Store Connect currently shows Build 34 as Testing. EAS stores an active provisioning profile and a distribution certificate expiring on 2027-08-11 for team U4C4W59HMG. Live Apple Developer certificate validation still requires the individual membership holder. This source sync creates no build, submission, certificate, or database change.
