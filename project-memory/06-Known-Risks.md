---
kind: risks
status: requires-revalidation
---
# Known Risks and Unverified Areas

These are documented gaps or historical observations, not fresh remote checks.
Verify the linked source and live state before asserting that an issue remains
or is resolved. A green JavaScript suite is not device certification.

## Database and release gates

- The October 11 audit records owner/fixture lists working locally but the public-list RPC migration not deployed. Recheck before live cross-account list work; do not deploy it automatically.
- Temporary-free bundle deployment is recorded separately. Do not replay it or alter receipts without authorization.
- Content rights, privacy-review gates and imported-art release permission require explicit review.
- Keep the frozen Build 34 artifacts intact; preparing source is not approval for a release.

## Native behavior

- The October 12 native-auth report records simulator checks and limited physical-device evidence, not resolution of widespread production crashes.
- Hardware Google/Apple login, photo upload, push delivery, software keyboard, WebContent memory attribution and full decoration acceptance need targeted evidence.
- Earlier APNs/OAuth configuration reports may be stale. Never publish server configuration or credentials while investigating.

## Dependency history

The October 10 audit used older dependency pins. The October 12 fix report says
Capacitor and affected transitive dependencies were patched. Current package
pins are shown in [[04-Current-State]]. Do not call the old audit current, or
infer complete security clearance from package versions; run a fresh audit when
that is the task, and never use `npm audit fix --force` on frozen artifacts.

Sources: [feature audit](../docs/FEATURE_AUDIT_20261011.md),
[native-auth fix](../docs/NATIVE_AUTH_SEARCH_FIXES_2026-10-12.md),
[historical gaps](../docs/BUILD34_KNOWN_GAPS.md).

[[00-Home]] | [[05-Verification]] | [[decisions/Temporary-Free-Bundles]]
