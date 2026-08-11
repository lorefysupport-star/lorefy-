# Lorefy Native

Native Expo / React Native foundation for Lorefy. It replaces the old browser shell with native screens and components for iOS and Android.

## Run locally

```powershell
npm install
npm test
npx expo start
```

For a browser preview:

```powershell
npm run web
```

Scan the QR code from Expo Go on an iPhone or Android device to test the native UI. A development build is recommended once device-only integrations are added.

## Current scope

- Native tabs: home, unified work/reader search, library, and profile.
- Native work and reader-detail modals.
- Local, persistent library using AsyncStorage.
- Dark Lorefy visual system and the new feather icon.
- EAS profiles for development, TestFlight preview, and production.

## Before TestFlight

1. Configure the production Supabase URL and public key through Expo environment variables.
2. Migrate the web catalog loader to a paginated API or local database; do not bundle the full catalog into the app binary.
3. Register `com.lorefy.app` in Apple Developer, create the App Store Connect record, then run `eas build --platform ios --profile preview`.
4. Replace demo reader/work data with authenticated profiles, the production catalog, image proxying, and server-side access policies.

## Checks

```powershell
npm test
npx tsc --noEmit
npx expo-doctor
npx expo export --platform web
```
