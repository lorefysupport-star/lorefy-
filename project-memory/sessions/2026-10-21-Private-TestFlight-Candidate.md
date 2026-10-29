---
kind: session
status: apple-uploaded-testing-disabled
date: 2026-10-21
---
# Private TestFlight Candidate 36

Owner explicitly authorized a new build/upload from GitHub, overriding the earlier
no-build direction for this request only, and explicitly prohibited tester access,
invitations and distribution. GitHub main was freshly fetched at 3894356.

An isolated detached worktree named Lorefy-testflight-20261021-3894356 preserves
the active checkout's unrelated changes. Build number 36 was set in app.json and
both Xcode configurations. Native preparation/sync completed there. Baseline and
prepared source suites both passed **2411/2411**, no failures/skips/cancellations.
Only release numbering, archive exclusions and generated packaging changed.

The inspected EAS archive has no key/env/private-release-config files and no vault,
QA or frozen-archive files; the ignored directory names survive as empty folders.
Native release credentials were reused with freeze-credentials; no Apple key or
certificate was intentionally created/revoked. EAS build, without auto-submit:
https://expo.dev/accounts/lorefy/projects/lorefy/builds/21ee1d8f-711a-427d-9214-e6da0b8548bb

The strict audit still reports unverified App Privacy and content rights. Owner
said to upload without rights review for private testing. Neither verification
flag was marked true; this is not public-release approval or a legal attestation.

Apple's latest existing build was 35. Its sole internal group has automatic build
distribution and one invited tester. Owner explicitly said not to make this new
build available to that account either. Membership/group changes have not been
authorized, and none were made. No App Store Connect submission, external review,
group assignment, new public link or invitation was performed before the hold.
Skipping EAS's setup does not itself disable Apple's pre-existing automatic group.

## Final Artifact and Upload-Only Path

EAS build finished successfully. Downloaded IPA inspection confirms version
1.0 (36), com.lorefy.app, 115754778 bytes, and matching SHA256 for index plus
the main app, explore, community and character-system modules against 3894356.
No vault/QA/private-release-config files are embedded. Physical-device behavior
and complete native-resource acceptance are not claimed by these five hash checks.

Unlike the app.json hint, the actual native IPA has no
ITSAppUsesNonExemptEncryption key. No encryption declaration was removed or
altered. This preserves Apple's manual export-compliance gate; it is not a
false encryption declaration. The hold was superseded by an upload-only path
that leaves export compliance unresolved and therefore does not enable testing.
Do not complete compliance while automatic internal access remains unless the
owner explicitly approves the resulting distribution scope.

Submitted the exact build ID above using --no-auto-testflight-setup, without
groups/what-to-test/auto-submit. Existing ascAppId was supplied by the profile;
existing submission credentials were reused, not the APNs-only key.
Submission: https://expo.dev/accounts/lorefy/projects/lorefy/submissions/2956c323-4591-4137-92e2-88b00d3d211b
Submission finished successfully at 2026-10-21 20:48:59 UTC. App Store Connect
visibly lists version 1.0 build 36 as Processing, uploaded Oct 21 at 11:48 PM
Riyadh. Upload/build resource ID: 1b98e030-620a-4b1c-a87c-a72afbb041f7.
At 2026-10-21 20:53 UTC the processed Apple build row showed Missing Compliance,
with empty groups/invites/installs metrics. Its loaded detail page confirms
Groups (0), Individual Testers (0), and "No testers have been added for this build."
No compliance answer, group assignment, tester invitation or beta review was
submitted. Existing memberships remain untouched. This build is uploaded but
not enabled for testing; it is not yet installable through TestFlight.

Owner receipt:
https://appstoreconnect.apple.com/teams/2d66854e-cdbb-4e6a-8531-7d6bd1e0485b/apps/6799704077/testflight/ios/1b98e030-620a-4b1c-a87c-a72afbb041f7
UI screenshot saved outside Git as artifacts/testflight-36-no-testers.png in the
task workspace. Before resolving compliance, review the existing automatic
internal group so activation cannot silently violate the owner's distribution
constraint. This session does not certify privacy, rights or physical-device QA.

Local IPA SHA256:
80C3371EB59B143365B1C7177EE507325DCBED7309C003A2808A7A6BDB53713C.
The approximately 30-minute EAS submission queue was followed by successful
submission; no duplicate job, paid upgrade, membership change or invitation.

[[systems/Native-Release]] | [[13-Project-Story]] | [[18-Progress-Handoff]]
