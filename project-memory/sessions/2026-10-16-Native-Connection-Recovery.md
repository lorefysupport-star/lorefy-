---
kind: session
status: partial-device-verification
date: 2026-10-16
---
# Native iPhone Connection Recovery Without the iTunes UI

## Authorization and Scope

The owner asked to continue without using iTunes, then explicitly authorized
repair of the background Apple connection component only. No device sync,
restore, new app build, app installation or release submission was performed.

## Verified Connection Results

- Initial failure: Apple usbmux was unavailable and no Apple Mobile Device
  Service was installed. Windows could see the USB hardware but the tool could
  not open the transport.
- Downloaded the official Apple Windows package, verified its valid Apple Inc.
  Authenticode signature, extracted only `AppleMobileDeviceSupport64.msi`, and
  verified that MSI's Apple signature. Installed Apple Mobile Device Support
  20.0.0.35 alone. Installer exit code 0; background service Running; USB device
  enumeration and paired developer service access succeeded.
- Read-only device metadata reports iOS 27.0.1, Lorefy 1.0 Build **35**. Earlier
  receipts described Build 34; those remain historical, not current-device facts.
  No hash match between this installed app and the current source is established.
- Developer Mode was already enabled and the personalized developer image was
  already mounted. This session did not enable either one or change security
  settings. The installed application was brought forward with kill-existing
  disabled, preserving its process.
- Web Inspector saw Lorefy as an application but returned no inspectable page.
  The prior JavaScript/DOM command path is therefore not verified on this build.

## Physical Screen and Privacy

The local mirror now falls back to native DVT screenshots over a userspace USB
tunnel, using existing pairing rather than a privileged network interface.
Before and after each capture it checks the exact Lorefy PID's
`foregroundRunning` flag. A background or switched-away frame is discarded;
none is published to the loopback mirror. Three local guard tests cover these
states. The native screen is 440x956 logical points.

One initial one-off capture unexpectedly showed another app. No interaction was
performed there; that local image was deleted and its content is not retained
in this vault. A later OS notification banner showed the additional privacy
boundary of full-device capture. The native preview initially masked the top 160
logical points. The owner subsequently explicitly requested removal of that mask
for the local live preview. It was removed; the Lorefy foreground guard remains.
Neither state is an application UI change, and removal does not retroactively
certify the previously hidden header. Permission to push source repairs is not
treated as permission to publish personal screenshots or account data to GitHub.
Raw screen/account data, installers, logs and mirroring helpers remain outside
Git and the vault. The server binds only to loopback.

## UI Evidence and Limits

Native accessibility traversal returned named work-opening controls, headings,
friend ratings and author controls on the installed app. A normal work-opening
activation request was attempted without submitting data. Although the request
returned, the screen remained on Home. Thus screen streaming, app activation and
element reading are verified; successful automatic tapping is **not** verified.
No claim of full UI coverage or device validation of LF-013 through LF-017 follows.

The installed Home still shows tightly packed friend names/ratings and feed
content behind the bottom dock in the observed viewport. These installed-build
observations require comparison against the corresponding repaired source;
they do not establish that the latest source regressed or is installed.

[[12-Device-Repairs]] | [[bugs/LF-003-Frame-Device-QA]] |
[[17-Extended-Review-Plan]] | [[systems/Native-Release]] | [[05-Verification]]
