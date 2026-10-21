---
kind: session
status: simulator-synced
date: 2026-10-19
---
# GitHub source to Device Hub

User requested latest GitHub source in Device Hub. Fetched main at `90a392e`
into the initially empty local checkout from `lorefysupport-star/lorefy-`.
Prepared runtime with `tools/prepare-ios-web.mjs`; copied web assets to the
existing com.lorefy.app simulator installation, retaining native plugins and
app data. SHA-256 verified all 557 prepared runtime files against installed
copies. Previous public assets backed up under /tmp/lorefy-devicehub-backup-20261019.

Device: iPhone 18 Pro, iOS 27.0, F29283CD-2136-4084-82AD-D5506246CCC2.
Launch succeeded; Device Hub displayed the updated feather launch screen,
then the signed-in Home screen with reading cards and navigation.
This is a local web-asset update, not a native rebuild, release upload,
physical-device verification or full regression test.

[[00-Home|Home]] | [[10-Open-Questions|Verification limits]]
