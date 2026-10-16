---
kind: session
status: source-browser-verified
date: 2026-10-16
---
# Reading Estimate Labels and Provenance

Base: `5c07689`; [[bugs/LF-018-Reading-Estimate-Labels]]. Source-only repair;
no new native build, installation, Apple upload or live-account write.

## Reproduction and Repair

The shared calculator derives cumulative hours from saved library checkpoints:
chapters x 12 minutes, otherwise pages x 1.5, otherwise volumes x 90 per work.
It rounds minutes, then whole hours with a positive-time minimum of one hour.
The owner/visitor UI called this reading hours, while the statistics hero called
the cumulative aggregate this year's reading. These labels did not describe
their actual source or period.

Owner, full/fallback visitor, statistics and recap hour labels now identify an
estimate. Statistics show From saved progress rather than a year claim. A native
details/summary explains the existing fallback weights and that this is not a
reading timer. It uses automatic text direction and a 44px summary target.
Small statistics labels wrap instead of ellipsizing the new estimate label.
Owner/public values, formulas, storage, diary history and backend read_hours
contracts are unchanged. This does not certify every period claim in the recap.

## Verification

- Nine new regression cases were observed failing before the corresponding
  changes, including locale copy, owner and visitor labels, unchanged projected
  values, zero, recap counters, cumulative period, disclosure and wrapping.
- Full source suite: **1,265 passed, 0 failed**, after the final runtime edits.
  Cache-assertion pins were updated to check all five changed script entries.
- Seven affected existing web assets match both existing native web copies.
  Cache version `lorefy-v468-reading-estimate`; scripts use
  `20261016-reading-estimate-v1`. No native compiler or packaging job ran.
- Current Chromium source preview: English/dark owner label at 320px wraps
  without horizontal clipping (57px client/scroll width); estimate method
  opens by pointer. Arabic/dark method at 320px opens with Enter and displays
  the preserved weights. Arabic 440px visitor fixture retains its own number
  and estimate label (65px client/scroll width), independently of the owner.
- Evidence screenshots and the TAP log remain outside Git/vault in the local
  conversation artifact folder. The loopback preview server was restarted after
  it stopped; no browser security warning was bypassed or firewall changed.

## Limits and Next Work

No current-source change was installed on the phone. The independent native
control receipt is [[sessions/2026-10-16-Native-Touch-Audit]]. These browser
checks do not certify VoiceOver, native keyboard, persistence or production sync.
Remaining English statistics copy/numeric direction is tracked separately in
[[bugs/LF-019-Statistics-Locale]], rather than called fixed by this receipt.

[[17-Extended-Review-Plan]] | [[05-Verification]] |
[[decisions/Saved-Reading-Metrics]] | [[systems/Reading-Library]]
