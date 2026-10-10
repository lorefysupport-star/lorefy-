# Lorefy Profile Shop Preview

Date: 2026-10-08

Historical prototype report. Superseded by [Free Profile Decorations](FREE_PROFILE_DECORATIONS_2026-10-08.md). The current implementation is free, durable and available to signed-in live accounts; it uses a full-page frame instead of replacing the owner's banner. The prototype restrictions below describe the earlier version only.

## Scope

An interactive local design prototype, not a payment integration. The user selected complete bundles containing an avatar frame, profile effect and cover. The core application remains separate from cosmetic monetization. No Discord artwork, brand characters or prices were copied.

Open the existing phone preview at:

http://localhost:8795/phone-preview.html?fresh=favorite-books-v3&preview=demo&demo=ready&route=profile

The shopping-bag button in the own-profile toolbar and the Profile shop settings entry open the store. Entries are gated to localhost with preview=demo and backend demo mode. Live accounts, public profiles, remote sites and native releases do not expose this prototype.

## Implemented

- Three original collections: Observatory, Spring Letters and Manuscript.
- Each collection contains an illustrated avatar frame, generated cover and finite profile effect.
- Preview uses the user's own avatar, name, handle and bio in a dedicated sample layout. It does not replicate every saved profile-header layout.
- Preview the full bundle or its frame, effect or cover independently; replay supported.
- Closing the preview leaves the saved profile, artwork and account ownership unchanged.
- Account-scoped wishlist in sessionStorage only. It persists through reload in the same tab, not across devices or new sessions.
- Arabic/English, light/dark theme tokens, responsive layout, labelled dialog, focus trap, Escape dismissal and focus restoration.
- Reduced-motion preference and operating-system reduced motion suppress animations. Normal effects run once for four seconds with no continuous timer.
- Detail and catalog navigation reset scroll position so lower catalog items cannot hide the cover on entry.
- Explicitly disabled purchase controls. Prices are unset; checkout rejects with LOREFY_COSMETICS_PREVIEW_ONLY. No fake purchase or entitlement is recorded.

## Artwork And Runtime

Generated original artwork is stored in launch/shop:

- lorefy-collection-atlas.jpg: 546,899 bytes.
- lorefy-avatar-frames.png: 705,178 bytes, transparent sprite.

Approximately 1.25 MB of artwork is loaded only when relevant previews render. Artwork is not in the service worker's startup precache. Native runtime files were regenerated and copied, but the prototype remains disabled in native release mode. No TestFlight upload or physical-device verification was performed.

## Verification

- Test-first regressions cover the first-click controller race and retained catalog scroll position; both failed before their corresponding fixes.
- Focused tests: 18 passed, 0 failed.
- Final npm test: 912 passed, 0 failed, 0 skipped.
- npm run ios:prepare and npx cap copy ios: exit 0. Full-suite asset parity checks passed.
- Browser: profile and settings entrances, all three collections, wishlist toggle/filter/reopen, per-part previews, replay and Escape focus restoration.
- Browser layout: fixed 430x932 phone preview and temporary 320x740 viewport; no horizontal overflow in tested store/detail surfaces. Temporary viewport, language, theme and motion changes were restored.
- English/light and Arabic/dark previews checked visually. Normal motion computed as four seconds/one iteration; reduced-motion computed as disabled.
- Images loaded; frame transparency and component alignment checked visually.
- One historical MutationObserver error was present in accumulated browser logs. It was not attributed or reproduced after the final reload; fresh Runtime.exceptionThrown monitoring reported no exceptions during reload/open/detail. Do not treat this as proof that every application-wide console issue is resolved.

Screenshots:

- ../qa/profile-shop-catalog-20261008.png
- ../qa/profile-shop-bundle-20261008.png
- ../qa/profile-shop-observatory-20261008.png

## Before Real Sales

1. Agree permanent bundle pricing and supported storefronts; render actual localized prices from the store provider, not hardcoded fake discounts.
2. Configure appropriate non-consumable in-app products and StoreKit purchase/restore flows for iOS. Review the applicable storefront rules before adding other payment methods.
3. Verify transactions server-side. Use an idempotent entitlement ledger tied to the authenticated user, not localStorage or a client-supplied ownership flag.
4. Handle pending/cancelled/failed transactions, restoration, refunds, revocations, account switching and offline recovery. Never equip a paid item based on an unverified receipt.
5. Add owner-controlled equipped frame/effect/cover records and a public-profile projection respecting account privacy. Viewers should see the owner's equipped cosmetics, not overwrite their own preferences or covers.
6. Implement public-profile rendering, effect performance budgets and moderation of any user-uploaded media. Paid assets and purchase recovery remain available independently of unrelated content-provider failures.
7. Review licenses for every artwork and catalog/API source before commercialization. The earlier free/no-ad assumption does not establish that an app selling optional cosmetics qualifies for noncommercial-only data-source terms. Obtain permission or replace restricted sources where required.
8. Validate StoreKit sandbox purchases and restores on real devices, purchase accessibility and launch/scroll performance before release. This prototype does not claim those checks are complete.

## Primary References

- Discord Shop FAQ: https://support.discord.com/hc/en-us/articles/17162747936663-Shop-FAQ
- Discord Custom Profiles: https://support.discord.com/hc/en-us/articles/4403147417623-Custom-Profiles
- Apple In-App Purchase: https://developer.apple.com/in-app-purchase/
- Apple App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/

The live Discord shop was inspected read-only, including bundle component selection and profile/chat preview. No purchase was made.
