# Profile Decoration Audit

Date: 2026-10-09

## Changes

- Full-page frame sides now use `clamp(24px, 7vw, 32px)` instead of a fixed 18px. Top/bottom edges use `clamp(40px, 10.5vw, 46px)`. Older engines have a 40px/26px fallback.
- Catalog and detail-preview frames have proportionately wider sides.
- Decorated immersive owner and visitor headers reserve additional space below the avatar artwork. Undecorated headers retain their existing spacing.
- Wishlist buttons have 44px touch targets.
- Switching accounts or signing out closes the previous account's decoration dialog. Unmounted callbacks cannot update its state.
- Selecting another bundle or component clears the preceding success/error message.
- Cache versions were updated for the changed module and stylesheet. Native web assets were regenerated and copied.

Free application, original uploaded avatar/banner preservation, owner-scoped decoration IDs, finite effects and noninteractive page borders remain unchanged. This audit did not change the database, payment behavior or access permissions.

## Browser Verification

Three bundles x two layouts x twelve viewports were checked separately for the owner profile and visitor renderer: 144 geometry cases.

| CSS Viewport | Cases |
| --- | --- |
| 320 x 740 | 12 |
| 360 x 780 | 12 |
| 375 x 812 | 12 |
| 375 x 667 | 12 |
| 390 x 844 | 12 |
| 393 x 852 | 12 |
| 402 x 874 | 12 |
| 414 x 896 | 12 |
| 420 x 912 | 12 |
| 428 x 926 | 12 |
| 430 x 932 | 12 |
| 440 x 956 | 12 |

All final records matched the requested actual DOM width and height. No horizontal overflow, avatar artwork clipping or avatar/name overlap was detected. Page borders remained inside the viewport and matched its height minus the existing 12px inset. Owner border pointer events were `none`.

The initial owner matrix was discarded after discovering that resizing had targeted another tab. It was rerun with explicit width/height assertions; the JSON contains only the corrected owner results.

Visitor geometry uses the actual public-profile React component with synthetic owner/viewer data in `qa/profile-decoration-fixture.html`. It does not prove a live authenticated RPC response or cross-device synchronization.

Additional actual demo UI checks: remove/reapply a bundle, reload persistence, switching preview component clears success, Escape closes the dialog and restores focus to its launcher, and library/profile navigation remains usable. Moon framing was visually checked in dark and light appearances; the original dark appearance and Moon bundle were restored. No profile-shop console errors were captured.

Evidence: `qa/profile-frame-audit-20261009.json`, `qa/profile-frame-final-20261009.png`, `qa/profile-frame-light-20261009.png`.

## Automated Verification

- Focused decoration/shop/public-profile tests: 38 passed, zero failures.
- Full `npm test`: 928 passed, zero failures, zero skipped.
- `npm run ios:prepare`: completed.
- `npx cap copy ios`: completed.
- Full suite includes native asset synchronization checks. This is not an Xcode build or a TestFlight deployment.

## Scope And Follow-Ups

These are representative portrait CSS sizes spanning the requested small-to-large iPhone range, not physical-device certification. Pixel resolution and browser viewport are different measurements; device names in the JSON are grouping labels, not proof of every model's exact Safari viewport. References: [Apple comparison](https://www.apple.com/iphone/compare/) and [Apple UIKit display reference](https://developer.apple.com/library/archive/documentation/DeviceInformation/Reference/iOSDeviceCompatibility/Displays/Displays.html).

Before release, verify on physical iOS/Safari devices with safe areas, changing browser chrome, larger accessibility text and live account switching/synchronization. Landscape and browser zoom were not part of this geometry matrix.

Recommended next improvement: independent removal of avatar frame, page frame and effect. The current clear-all action is functional, while applying a single component preserves the others. Wishlist remains intentionally session-only; do not present it as a synchronized collection. Existing database advisory findings from the prior feature report remain outside this UI-only audit.

## Files

Source changes: `styles/lorefy-profile-shop.css`, `modules/lorefy-profile-shop.js`, `tests/profile-decoration.test.js`, `index.html`, `sw.js`.

New audit artifacts: this report, the synthetic public-profile fixture and QA result/screenshot files. Derived native assets under `ios-web` and `ios/App/App/public` were refreshed through the existing preparation/copy tools. Preexisting unrelated work was preserved.
