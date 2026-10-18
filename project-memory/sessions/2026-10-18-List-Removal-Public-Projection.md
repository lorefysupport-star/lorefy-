---
kind: session
status: source-and-service-verified-device-pending
date: 2026-10-18
---
# List removal and public projection activation

Owner report: could not remove folders from Profile Lists, and public folders
were absent to other readers. The root service cause was confirmed read-only:
`get_public_profile_lists(uuid)` did not exist in the active database.

After explicit owner approval, applied only the existing reviewed migration
[profile_public_lists](../../supabase/migrations/20261011134708_profile_public_lists.sql).
Dependencies were confirmed first. No list content, visibility choice, account
or other service configuration was changed. The function is executable by
authenticated, not anon; null-auth execution returns an empty array. Aggregate
read-only verification across 159 profiles returned 14 public lists and confirmed
private profiles remain hidden and every projected list has isPublic true.
This is not a two-real-account UI or block-matrix certification.

## Source repair

[Profile sections](../../modules/lorefy-profile-sections.js) now places a named
44px trash control beside each owner folder, outside its navigation button.
The detail toolbar also exposes removal before the long ranked list. A named
confirmation defaults focus to Keep list; cancelling retains the folder.
Confirmed removal writes only the selected folder, awaits existing cloud push,
and reports pending when offline rather than falsely claiming cloud success.
Account changes are checked before mutation and after synchronization.

[Legacy lists](../../modules/lorefy-growth-features.js) has a narrow owner-checked
remove adapter for old work/character storage; neither collection is migrated
or implicitly published. Visitor list errors now offer retry tied to the same
viewer and profile, instead of a permanent database-setup message.

## Evidence and limits

- Seven new regression tests observed failing before implementation; 27 focused
  and 2140 full-suite tests passed, zero failures.
- Browser at 390x844 AR/dark: created a disposable local-demo folder, opened
  confirmation, removed it, reloaded and confirmed it remained absent while
  all five pre-existing folders remained. No real list was deleted.
- Source tests retain visitor/public filtering and old-editor compatibility.
- Only affected source entry/cache/modules/CSS copied to both native web trees;
  no native build, upload, provider sign-in or physical-device test.
- Screenshots/logs outside Git: conversation artifacts/list-removal-after.png
  and list-removal-full.log.

[[systems/Profiles-Lists]] | [[09-Data-Contracts]] | [[18-Progress-Handoff]]
