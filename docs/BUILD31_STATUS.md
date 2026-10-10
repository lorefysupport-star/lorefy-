# Build 31 preparation

Updated: 2026-10-01 (Asia/Riyadh).

## Completed

- app.json and both native Xcode configurations use build 31.
- Missing imported ratings now stay zero/unavailable instead of a fabricated score. MangaDex no longer receives 3.9 or fabricated popularity. Import defaults no longer derive review/read/list counts from popularity.
- The catalog quality pass clears legacy MangaDex synthetic values without modifying personal progress. Dynamic ingestion runs the same pass.
- Updated catalog cache keys and prepared/copied the native web assets.
- Full Node suite: 423 passed, 0 failed. Subsequent targeted catalog/community/release checks: 20 passed, 0 failed.
- Restored Supabase project qsroxmltioxqozmykens from INACTIVE to ACTIVE_HEALTHY. SQL connectivity restored.
- Auth settings endpoint returned HTTP 200: Apple and Google enabled, email disabled.
- Live normalized username duplicate groups: 0.
- Deployed previously missing community_posts and community_post_reactions migration, including authenticated-only access and privacy/block checks in reply/reaction RPCs.
- Both new tables have RLS; anon cannot SELECT and authenticated clients cannot INSERT directly. Unauthenticated publish/reaction RPC checks rejected the requests inside a rolled-back transaction.

## Build attempt

EAS authenticated successfully, found existing distribution credentials, and uploaded the 16.9 MB source archive. It then refused the build because the account's monthly free iOS build quota was exhausted. The service reported a reset on 2026-10-01. No paid upgrade was purchased, no IPA was produced by that attempt, and nothing was submitted to App Store Connect or invited testers.

### Earlier upload attempt: 2026-10-01

- Retried the production build with existing frozen signing credentials and build number 31.
- Fixed the cloud archive rules to retain all nine required catalog JSON inputs while excluding reports, caches, private release configuration, and environment files. Verified the actual EAS archive and successfully ran native web preparation from that archive.
- Full Node suite: 472 passed, 0 failed; archive hygiene checks passed after the final Windows directory rule adjustment. `git diff --check` passed.
- EAS accepted the 18.0 MB source upload, then rejected the build because the monthly free iOS build quota was still exhausted. The service reported reset in 1 hour on Thu Oct 01 2026.
- No new build ID or IPA was produced, so no App Store Connect submission was attempted. No paid upgrade, tester distribution, or App Review submission occurred.

## Successful build and upload: 2026-10-01

- The free build quota reset. Production build `45aca04b-ea53-4762-a29c-ff8cc3f7089c` finished successfully at 01:04:53 UTC without a paid upgrade.
- Downloaded the signed IPA and parsed its actual app Info.plist: bundle `com.lorefy.app`, version `1.0`, build `31`, minimum iOS `15.0`, platform `iphoneos`. Local artifact: `artifacts/Lorefy-build31.ipa`.
- Uploaded this exact fresh build, not build 30, using `eas submit --platform ios --profile production --id 45aca04b-ea53-4762-a29c-ff8cc3f7089c --non-interactive --no-auto-testflight-setup --wait`.
- Submission `f65700d6-2933-4c2f-afd9-bfccf55dc8ba` finished successfully at 01:10:19 UTC. EAS confirmed the binary was uploaded to Apple App Store Connect and entered Apple processing. Processing completion is not yet confirmed; the first Apple API lookup did not yet expose build 31.
- Build receipt: https://expo.dev/accounts/lorefy/projects/lorefy/builds/45aca04b-ea53-4762-a29c-ff8cc3f7089c
- Upload receipt: https://expo.dev/accounts/lorefy/projects/lorefy/submissions/f65700d6-2933-4c2f-afd9-bfccf55dc8ba
- Upload only: no tester invitations, new groups, external group assignment, beta review request, or App Review submission was performed.
- Apple API preflight found the existing internal group `lorefy Testera 1` has automatic access to all builds, but contains **zero testers**, verified before and after upload. Apple rejected changing `hasAccessToAllBuilds` with HTTP 409 (`ENTITY_ERROR.ATTRIBUTE.NOT_ALLOWED`), so the setting was not changed. Do not add testers to this automatic group unless access to all eligible builds is intended. The external group has no automatic-all-builds flag.
- Latest full Node suite rerun after building: **483 passed, 0 failed**. The fresh build includes the chapter catalog fixes, preview fixture cleanup, and share artwork fixes.

## Individual tester invitation: 2026-10-01

- Apple finished processing build 31. Its App Store Connect build ID is `a266a610-3c37-4aff-90bc-5b67dbb22972`.
- The owner explicitly approved saving the encryption answer `None of the algorithms mentioned above`; it was saved in App Store Connect and the compliance prompt cleared.
- At the owner's request, added only `fahada5066@gmail.com` directly to build `1.0 (31)`, without assigning any tester group.
- Submitted the required TestFlight beta review through the individual invitation flow, with `Automatically notify testers` checked and concrete testing instructions. This was not an App Store production release submission.
- App Store Connect confirmed `1 tester has been added`, `Individual Tester (1)`, the exact requested email with status `Invited`, and `Groups (0)`. Inbox delivery, acceptance, and installation have not been verified.
- Screenshot receipt: `artifacts/testflight-build31-fahada5066.jpg`.

## Previous build retirement and existing tester access: 2026-10-01

- At the owner's request, expired build `1.0 (29)` (`31836b72-9f8e-4e7a-9ced-fd9d0bb26e50`). Apple confirmed `Build 1.0 (29) has been expired`; the build table shows `Expired`, while build 31 shows `Testing`.
- Reused the existing tester `fahada5099@gmail.com` via `Add Existing Testers` on build 31. Selected exactly one tester; Apple confirmed `1 tester has been added`. Both requested addresses are now listed as individual testers for build 31.
- The existing tester's `Installed 1.0 (29)` label records the last installed version (September 15), not a new installation of build 31. Device upgrade remains unverified.
- No other existing testers were selected and no external tester group was assigned. Apple's pre-existing automatic internal group now appears on build 31; no members were added to it.
- Existing testers can be assigned subsequent builds using their existing identity. Do not create duplicate invitations at a different email for an Apple Account already associated with Lorefy.
- Screenshot receipts: `artifacts/testflight-build29-expired.jpg` and `artifacts/testflight-build31-existing-fahada5099.jpg`.

## Existing tester distribution and public link: 2026-10-01

- Assigned build 31 directly to all 31 active existing email testers except `alanaziibasel@gmail.com` (Basel Alanazi). Added `eid.shabeeb@me.com`; reused the existing `al3nzu55@gmail.com` identity. Apple now lists 32 individual testers on build 31, with no eligible previous testers missing.
- Preserved the revoked/deleted support tester and the record without an email; neither was restored or invited. Basel is not assigned build 31 individually, and the legacy external group containing him was not assigned this build.
- Re-sent all 19 pending invitations through Apple's betaTesterInvitations API; every request returned HTTP 201. The 13 accepted testers retain their existing identity and have access to build 31. `autoNotifyEnabled` is true. Email inbox delivery is not independently verified.
- Fresh device records confirmed existing tester `fahada5099@gmail.com` installed `1.0 (31)`. The owner's subsequent screenshot also shows `josephthedoc@gmail.com` and `lobnou2@gmail.com` installed 31. `Installed 1.0 (29)` for other testers reports their last device installation, not their current build entitlement.
- Created external group `Lorefy Public Beta - 200` (`3ad92bad-1e06-46d2-9923-fc3f2f0ed0fc`) at the owner's request. It contains only build `1.0 (31)`, with status `Testing`.
- Enabled its public link with `Open to Anyone`, `Set Limit` checked, and limit **200**. App Store Connect confirms `0 of 200` and the link https://testflight.apple.com/join/kj7FQReT . This limit is for public-link enrollment in this new group; the existing 32 email testers are separate.
- Opened the exact public URL in a separate browser tab. Apple returned `Join the Lorefy beta` and instructions to open the link on iPhone, iPad, or Mac with TestFlight. Enrollment/install was not performed on behalf of a tester. Public links do not collect tester email addresses in App Store Connect.
- Build 29 remains expired. Screenshot receipt: `artifacts/testflight-public200-20261001.jpg`.

## Remaining acceptance gates

- Apple shows build 31 as `Testing`, and initial tester installations are confirmed. Installation alone does not verify the signed-device functional acceptance checks below.
- Actual signed-device Apple/Google login, account switching, deletion, push delivery and crash checks remain unverified.
- App Store privacy answers still require verification; the local flag was not falsely changed to true. Content rights remain deferred by the owner.
- Supabase advisory review is not a clean security certification: it reports intentional RPC/security-definer exposure and deny-by-default tables, plus pg_net in public and disabled leaked-password checking (email login is disabled). No unrelated grant changes were made just to silence advisories. References: https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable and https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public.

This supersedes the server-outage and missing-community-schema portions of BETA_READINESS_2026-09-29.md, not its physical-device acceptance requirements.
