# Durable Custom Artwork Repair

Date: 2026-10-08

## Cause

Work-cover selections previously relied on a React effect to write localStorage.
Quota failures could be swallowed while the picker still displayed success.
Uploaded images were embedded as large data URLs in account state and its sync
journal. Portrait pickers reported success before their delayed cloud sync.
The existing private custom-covers bucket allowed only the uploader to read it.

## Changes

- New `backend/lorefy-custom-artwork.js` handles both work covers and character
  portraits. Local writes happen synchronously; live success waits for cloud
  confirmation. Failed sync keeps the local choice available and reports failure.
- Live uploads use immutable, owner-scoped Storage paths. Account state stores
  `lorefy-artwork:<owner>/<kind>/<file>`, not binary data or expiring signed URLs.
- Display URLs are signed on demand and renewed after cold startup or resume.
- Uploads are restricted to JPEG, PNG and WebP, at most 5 MB after resizing.
- Both character-image pickers and the compiled work-cover picker await saving.
- Alternative covers and resetting to the default use the same durable save path.
- Account changes during an upload cannot write an old owner's image into the
  next account. Concurrent artwork saves are serialized.
- Public-profile rendering resolves the profile owner's artwork maps, not the
  viewer's choices. New community attachment references are resolved for display.
- The custom-covers bucket remains private. Its added read policy permits an
  authenticated visitor to sign only artwork projected by the owner's public
  profile, or referenced by that owner's visible community attachment. Private
  and blocked accounts remain protected. Owner-only write policies are unchanged.
- Existing inline/remote choices remain compatible. The global catalog is not
  changed by a user's personal artwork.
- Bootstrap and service-worker versions were updated; iOS web and Xcode assets
  were regenerated with `npm run ios:prepare` and `npx cap copy ios`.

## Verification

- Full `npm test`: 819 passed, 0 failed, 0 skipped.
- Twelve dedicated artwork regression tests cover persistence, signing after
  reopen, sync failure, local quota failure, account switching, concurrent saves,
  picker wiring, owner-specific public profiles, community references, upload
  paths/MIME and the size limit.
- Browser QA in the demo account: a non-personal fixture was uploaded as a work
  cover, the page was reloaded, and the exact image remained. The same test passed
  for a Makima portrait. Both fixtures were reset to the original images afterward.
  No console errors were recorded during the final portrait check.
- Live SQL access checks passed for owner, visitor, portrait, unpublished image,
  malformed path, private account, blocked viewer and anonymous viewer. All
  fixture state/privacy/block changes were enclosed in a transaction and rolled
  back. Only the new Storage policy/helper migration remains deployed.
- Supabase security advisors reported no finding for the new private helper.
  Existing notices remain for exposed security-definer RPCs, pg_net in public,
  leaked-password protection and RLS tables without policies. This repair does
  not claim a complete security audit of those unrelated existing surfaces.
  Reference: https://supabase.com/docs/guides/database/database-linter

## Evidence

- `qa/custom-artwork-test-results.txt`
- `qa/custom-artwork-rls.sql`
- `qa/custom-cover-after-reload.png`
- `qa/custom-portrait-after-reload.png`
- `supabase/migrations/20261008103000_durable_custom_artwork_read.sql`

## Remaining Device Verification

The browser test used the local demo account, not a live binary-upload session.
Cloud persistence and viewer signing were covered by backend regression tests
and the live SQL authorization checks, not two physical devices end to end.
No real iPhone force-quit/relaunch was performed. Release acceptance must upload
a cover and portrait on an iPhone, wait for save confirmation, force-quit/reopen,
then inspect that owner's profile from a second account/device.

The installed TestFlight build is unchanged. A new iOS build containing these
assets is required before testers receive the client-side repair. Previously
lost choices that never reached local or cloud storage cannot be recovered.
