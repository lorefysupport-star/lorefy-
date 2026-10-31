# Lorefy Performance Review - 2026-11-01

Scope: existing browser/Capacitor web source. Actual local Home profiling,
delayed-image reproduction, cold catalog workloads, large-library maintenance
and slowed-CPU search acceptance. No native build, production data mutation,
provider/billing change or replacement artwork.

## Repairs Delivered

| Issue | Repair | Fresh evidence |
| --- | --- | --- |
| Valid slow artwork permanently hidden after 5.5s | Keep current request listeners past the UI deadline; reveal late success, retain stale/disposal guards | 14 actual-app checks, original bytes delivered after 8.5s, one GET per image |
| Duplicate recommendation/discovery classification | Shared classification followed by recommendation-only rating/source gates | 1322 real records: median 45.56 to 27.36ms, normalizations 22764 to 11382, identical result digest |
| Full library JSON work during unchanged diary maintenance | Compare stored strings before parsing; retain real transition detection and safety polling | 2000 saved works, 100 unchanged calls: browser median 117-125 to 0.5-0.6ms, parse/serialize calls 200/100 to 0/0 |
| Repeated pure identity normalization | Small FIFO memo, at most 512 entries, inputs AND outputs at most 256 UTF-16 code units each; no retained failed normalization | 1322 real records, seven cold runs: median 29.06 to 25.68ms, normalizations 6674 to 3956, exact records/aliases/report digest unchanged |

CPU timings above describe their named workloads, not total app or network time.
Each source repair has separate regression/browser acceptance and Git history.

## Verification

- Final full suite: **3153/3153**, zero failures, exit 0, 64992ms.
- Managed images: 14/14 delayed-byte checks, Arabic/English; no extra download.
- Classification: 44/44 actual-app checks, Arabic/English at 320/390px; paired
  old/new eligibility vectors identical, four primary routes still work.
- Diary: 16/16 actual-app checks, Arabic/English, real progress/completion once,
  dialog opens and owner change closes it before any fast-path return.
- Identity: 8/8 actual-app checks, Arabic/English; all tested record contents,
  alias maps and organization reports match the prior implementation.
- Search: 12/12 checks with CPU slowed 4x and external/API providers unavailable:
  latest input retained, local results visible, clear/cancel work, no overflow.
  First available Berserk result: 562ms Arabic / 374ms English in these samples.
  These are current acceptance times, not a measured before/after search gain.
- Byte-identical selective runtime mirrors, versioned main/worker imports and
  service-worker assets. No full native preparation or archive edits.
- Project-memory session notes retain red/green details and excluded evidence.
  Browser scripts/logs stay in the workspace outside Git, without private data.

## Cleanup Boundaries

Removed redundant execution and the duplicate classification branch. Existing
layouts, opt-in experiments, provider fallbacks, translations, user colors and
art are still reachable and intentionally retained. Their age or CSS override
count is not evidence that deletion is safe. No catalog coverage was reduced.

## Still Open

1. **Cold startup/layout:** public-image Home at 4x CPU measured 3603ms in one
   initial sample and 3954ms in a later sample before the identity memo. These
   variable samples do not prove faster overall startup. First layout and catalog
   processing remain measurable costs. Capture a controlled repeated native
   launch trace before making a whole-app performance claim.
2. **Artwork provider latency:** actual public cover requests took about
   2.4-3.6s across the samples. Late-success recovery fixes false permanent errors,
   not remote server latency. Measure actual device transfer sizes/cache behavior
   before choosing thumbnail sizing or an authorized image delivery layer.
3. **Real account/feed/cloud latency:** this turn used isolated demo contexts;
   no authenticated production feed timings or live mutations were performed.
4. **Physical iPhone:** installed app performance is not established by desktop
   emulation. Source-only updates are not a newly installed IPA.
5. **Broad dead-code removal:** requires consumer/route coverage evidence. Do
   not delete active legacy consumers or design collections as a speed shortcut.

No claim of zero lag, fully optimized startup, or verified native/network speed.
