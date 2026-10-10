# Free Profile Decorations

Date: 2026-10-08

## Current Behavior

- Three original Lorefy collections: Observatory, Spring Letters and Manuscript.
- Free for demo and signed-in live accounts, including the native runtime. No checkout, subscription, entitlement or purchase is required.
- A bundle has an avatar frame, full-profile frame and finite decorative effect. Apply the complete bundle or one component; remove all decorations at any time.
- The owner's existing avatar and banner remain unchanged. No bundle cover is saved or substituted.
- Full-page artwork uses a transparent nine-slice border pinned to the visible profile viewport. It remains visible while scrolling and cannot intercept clicks.
- Individual avatar apertures have calibrated centers. Decorated immersive avatars are inset to avoid edge clipping; normal profiles reserve extra space above the name.
- Original page-frame PNG assets are in `launch/shop/lorefy-page-{observatory,blossom,manuscript}.png`. They are not Discord artwork.
- Existing four-second effects honor both operating-system and saved reduced-motion preferences. No continuous animation timer was introduced.

## Persistence And Public Profiles

`lorefy.user.profileDecoration.v1` stores an owner ID and whitelisted frame/page/effect IDs, not uploaded images or arbitrary URLs. It participates in existing account state hydration, cloud push and sign-out cleanup.

Local application succeeds only after storage accepts the write. Offline/cloud failure retains the local choice and explicitly reports pending synchronization, not a completed cloud save. Stale account dialogs cannot save, and an account switch during push cannot update the next account's UI.

Public profiles render the owner's RPC projection, never the visitor's decoration state. Migration `20261008180126_free_profile_decorations.sql` was applied to the existing Supabase project. It extends the existing guarded `get_public_profile_artwork` function, keeps its privacy/block checks and authenticated-only grant, and rejects decoration records belonging to another owner.

## Verified

- Browser: applying a full bundle, removing it, applying a page frame alone, reload persistence, library/profile navigation and full-page framing during scroll.
- Browser: original banner and avatar sources were compared before and after removal; both were unchanged.
- Browser: 430 x 932 phone iframe and 320 x 740 responsive viewport. Avatar frame remains inside the page; no horizontal overflow at 320 px. Both normal and immersive headers were checked, including a reproduced/fixed normal-layout name overlap.
- Browser: dark apply-button foreground/background are `rgb(11,11,12)` / `rgb(240,240,243)`.
- Unit coverage: durable cold reads, invalid IDs, storage failure, offline pending sync, account-switch isolation, component merging/removal, owner-only public decorations and preserved public avatar/banner URLs.
- Database: disposable transaction fixtures verified whitelisting, owner projection, private-profile and anonymous rejection. Fixtures were rolled back. Anonymous execute privilege is false; authenticated execute privilege is true.

Final post-polish verification: `npm run ios:prepare` and `npx cap copy ios` both completed successfully. `npm test` passed all 925 tests, with zero failures or skipped tests, including native asset synchronization checks. Screenshot: `qa/free-profile-decorations-20261008.png`.

## Existing Advisory Findings

Security advisors were checked after the migration. The project is not advisory-clean. Existing warnings include authenticated security-definer RPC exposure, the `pg_net` extension in `public`, disabled leaked-password protection and some RLS-enabled tables without policies. This feature retains the existing guarded public-artwork RPC architecture; it does not grant anonymous access or weaken profile privacy. Unrelated settings were not changed.

Remediation references:

- [Security-definer RPC review](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable)
- [Extension schema warning](https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public)
- [Password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)
- [RLS without policy](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy)

## Boundaries

No physical-device, multi-device live-account or TestFlight validation is claimed. Native web assets are prepared/copied locally; this is not a newly uploaded App Store build. Catalog wishlist remains account-scoped session storage, separate from the durable applied decoration choice. The earlier generated cover atlas is retained as historical prototype artwork but is not applied to a user's banner.
