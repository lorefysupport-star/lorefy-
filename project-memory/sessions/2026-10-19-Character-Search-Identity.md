---
kind: session
status: source-verified-device-pending
date: 2026-10-19
---
# Character Search Identity Follow-up

Scope: [[bugs/LF-076-Character-Search-Identity]]. This repairs the source only;
there is no native build, release upload, service mutation or device install.

- Four regressions failed before the implementation; eight new cases cover books,
  cached contamination, contradictory IDs, ambiguous titles, valid fallback and
  authoritative identity. The existing favorites sentinel remains unchanged.
- 27 focused character/name/gallery cases passed before adding the final two
  identity-conflict cases. Final full suite: **2241/2241**, zero failures.
- The first full run passed 2240/2241; the sole failure pinned the old script URL.
  Its load-order assertion is retained with the new cache-busting version.
- A subsequent full run caught incomplete new bug-note metadata; the existing
  work-control schema was respected rather than weakening its assertions.
- The actual demo editor still returned Killua under Hunter x Hunter without
  selecting a character or saving. This is not live bibliographic certification.
- Source/index/service-worker assets were copied selectively to both native web
  directories and SHA-256 compared. Archives and unrelated dirty config remain.
- The phone USB probe currently returns no devices. Live two-account testing is
  also unproven: the owner supplied the same username again, not a second account.

[[18-Progress-Handoff]] | [[13-Project-Story]] | [[14-Feature-Coverage]]
