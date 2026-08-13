# Lorefy App Store Submission Gate

This repository can prepare the iOS shell, but it must not be submitted until the strict preflight is green.

## Build the native shell

1. Copy `config/lorefy-release.example.json` to `config/lorefy-release.json` and replace every placeholder with a production value.
2. Run `npm install`, `npm run ios:add`, and `npm run ios:sync` on a Mac with the current Xcode installed.
3. Open `ios/App/App.xcodeproj` in Xcode, set the Apple Developer team, and set the release signing profile for `com.lorefy.app`.
4. Copy `apple/PrivacyInfo.xcprivacy` into the Xcode target as a bundled resource and enable the Sign in with Apple entitlement.
5. Run `npm run apple:audit:strict`. A non-zero result blocks submission by design.

## Required production setup

- Publish the app, privacy policy, terms, and support pages over HTTPS on real public URLs.
- Set `apiUrl` to the public HTTPS API origin. Native Lorefy builds call `${apiUrl}/api/catalog`; they must never depend on the local development server.
- Create an active Supabase project, apply the migrations, deploy `delete-account`, and store the real public configuration outside source control.
- Enable Sign in with Apple for the real bundle ID in Apple Developer and configure the same provider in Supabase.
- Add `com.lorefy.app://auth/callback` to Supabase Auth redirect URLs and Google OAuth's authorised redirect flow. The native build opens Google in the system browser and returns the completed session through this URL scheme.
- Test in-app account deletion with a real Apple-authenticated account. Apple token revocation must be implemented and verified before submission.
- Keep Premium turned off for this beta unless StoreKit products, purchase restoration, and server-side entitlement verification are complete. Digital subscriptions shown for sale in iOS must use In-App Purchase.
- Do not open the public community until reporting, blocking, moderation operations, and a support contact are live.
- Verify licences and redistribution rights for all catalogue metadata, covers, character images, and externally sourced artwork.

## App Store Connect checklist

- Use a final build with no placeholder flows, crashes, or local-only dependencies.
- Provide a review account or full review instructions in App Store Connect.
- Complete App Privacy using the data actually collected by Lorefy and every third-party SDK.
- Add a public privacy-policy URL and support URL.
- Prepare accurate screenshots from the released build only; never use mock screens as product screenshots.
- Complete content rating, age rating, export compliance, pricing, availability, and contact information in App Store Connect.

## Privacy data map to validate before declaring it in App Store Connect

Potential categories from the present product design: account name and email, user ID, reading state/lists/reviews, optional profile or review images, and diagnostics only when monitoring is enabled. This is a review worksheet, not a completed App Privacy declaration. Re-check every production SDK and server log before answering Apple.
