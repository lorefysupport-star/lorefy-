---
kind: decision
status: accepted-temporary
date: 2026-10-11
aliases: ["الحزم المجانية"]
---
# Temporarily Free Current Bundles

The user requested the 17 current offers be free for now. Preserve account
checks, supported parts and allowlists. All-free flows must not invoke checkout,
ownership lookup, restore, store price availability or billing listeners.

The audit documents an explicitly approved database allowlist migration for
the 12 originals; receipt/refund records were unchanged. This is historical
deployment evidence, not a new server query or permission to replay migrations.

Restoring paid behavior requires coordinated manifest and database changes in
a new authorized migration. Do not silently restore prices from older README
or paid-product notes; do not reinterpret free as a permanent entitlement.

Sources: [audit and deployment limits](../../docs/FEATURE_AUDIT_20261011.md),
[current catalog](../../launch/decorations/originals/catalog.json),
[shop](../../modules/lorefy-profile-shop.js).

[[00-Home]] | [[06-Known-Risks]] | [[05-Verification]]
