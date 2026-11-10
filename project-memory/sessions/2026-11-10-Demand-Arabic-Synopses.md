---
kind: repair-session
status: source-browser-verified-device-pending
date: 2026-11-10
---
# Demand-loaded Arabic synopsis foundation

Owner approved implementation after the Lootd study. This is one shared loading
repair, not completion of the full app plan. No design migration or service write.

[Report](../../docs/DEMAND_SYNOPSIS_PERFORMANCE_2026-11-10.md) records the current
source references, evidence and limits. The former6.5s timer loaded6,020,864 bytes
of synopsis data and triggered ingest/refresh. A generated manifest and256 exact
JSON shards now load only the selected work's synopsis. Original12,071 entries
remain in canonical source and are tested value-for-value. Existing title/alias
search, personal artwork, reading totals and deliberate zero ratings remain.

Shared per-shard requests, concurrency2, decoded LRU8, timeout/late-result guard,
direct-route alias/catalog races and targeted refresh are covered. Cachev702 allows
only the new static shard path; native preparation generates shards and excludes
the redundant old runtime map. Selective web mirroring is not a native build.

Fresh full3445/3445, zero failures/skips/cancellations. Local browser showed
Arabic Berserk search, clicked-work synopsis, preservation of the existing Pride
summary and direct-route recovery. No console errors observed in those samples.

Decoded JS in the first15s fell13,084,595 to7,068,471 bytes (45.98%) on local demo,
HTTP cache disabled. FCP176 to188ms did not improve; no latency/fps improvement
is claimed. Only one before/after pair, no real-device/production certification.
Raw browser receipts remain outside the repo/vault. Next: repeated startup CPU
traces and remaining foundation assets, then a separate community-focused pass.

[[systems/App-Boot]] | [[systems/Catalog-Search]] | [[13-Project-Story]]
