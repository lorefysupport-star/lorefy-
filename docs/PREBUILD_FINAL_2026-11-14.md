# Lorefy: Final Prebuild Audit

Date: 2026-11-14. Base: `ec45246`, branch `main`.
Scope: current web source, both checked-in native web mirrors, isolated browser
fixtures and low-volume read-only public service probes. No build/upload,
production account writes, notification sends, migration or credential changes.

## Decision

Local source checks pass after one confirmed UI repair. This is **not an
unqualified release clearance**. Apple web OAuth fails live, privacy/content
rights attestations remain unverified, and physical-device release acceptance
has not been performed on these bytes.

## Fixed: Empty Library Blocks Its Own View Controls

At 430px, switching an empty Library to spines used a fixed 240px grid row and
end alignment. The empty message was 300px tall and extended upward: its top
was 323px although the grid began at 383px. It overlapped the view controls
(313-365px) and intercepted taps, preventing the next layout selection.

`styles/lorefy-library-refined.css` gives grids with a direct empty message
content-sized automatic rows and start alignment. The repaired message starts
at 383px, below the controls. Populated shelves, all four view modes, source
artwork and stored reading data are unchanged. Cache is `v720-prebuild-library`;
the stylesheet, entry and worker are selectively mirrored into both iOS roots.

A new source regression failed before the fix and passed afterward. Actual
unforced pointer clicks across 96 language/theme/width/layout combinations
confirm the message does not overlap controls and no page overflow appears.

## Fresh Verification

| Check | Result |
| --- | --- |
| Full Node suite, final source | 3610 pass, 0 fail/skip/cancel; exit 0; 121497ms |
| Dependency audit | 0 known npm vulnerabilities; exit 0 |
| Referenced JS/CSS assets | 159 exist, worker references match, native mirrors match |
| Script syntax / configuration JSON | 95 script checks; no syntax/JSON errors |
| Runtime hygiene | No QA/vault/private release JSON or matched private-key patterns in inspected runtime files |
| Browser workflow assertions | 1356 pass across 15 workflow groups, AR/EN, 320/430px |
| Responsive/glass checks | 102 pass, 320/768/1280px, selected light/dark/custom themes |
| Warm offline navigation / reconnect | 180 pass across AR/EN and five themes; not offline cold start |
| Empty-Library repair | 96 cases, AR/EN, four themes, three widths, four modes |
| Notification inbox | Four fixtures pass: deduplication, self/other-owner rejection, read receipts, retained offline history, follow destination |
| Public live probes | 11/12 unique GET checks pass; Apple web OAuth is the exception |

Browser groups cover reading completion/cancellation and deliberate zero ratings;
Library search/sort/four views and persistence; Explore filters, search and stale
pagination; profile tabs/followers and moving-frame pixels; community composer,
edit/reply focus and obsolete-account results; export lifecycle; settings/safety/
correction/import dialogs; selected import rows and artwork. Fixture writes use
local demo storage only. They do not certify production two-account syncing.

Early browser runs correctly exposed the Library defect. Other harness updates
follow intentional UI evolution: explicit sort selector after adding Work type;
percent progress versus saved chapter units; redesigned inbox empty state and
disabled empty mark-read action; relocated screenshot paths. The pagination
fixture isolates its independent remote-search channel from deliberately blocked
network failures. Original failed receipts are retained, not silently counted as
passing runs. The final workflow result uses the latest verified run per group.

Native generated runtime configuration differs in newline bytes only; normalized
contents and projected settings agree. No private values are included here.

## Remaining Gates

1. **Apple web OAuth:** live HTTP 400, `Unsupported provider: missing OAuth
   secret`. Google redirects correctly. Native Apple ID-token sign-in is a
   separate path and is not certified by this probe. Owner previously deferred
   Apple credential setup; the APNs key was not read or reused.
2. **App Privacy / content rights:** strict source release audit still reports
   `privacy-nutrition-label` and `content-rights`. Flags were not falsified.
3. **Physical device:** fresh/upgrade install, actual Apple/Google login, photo
   permissions, push delivery/opening, background resume, memory/thermal behavior,
   keyboard/safe areas and long-scroll frame times need a signed-device run.
4. **Live multi-account acceptance:** notification Realtime/mentions and reading,
   reaction/follow/cloud durability need authorized real-account testing. No test
   alerts or real posts/reactions/follows were sent by this audit.
5. **Release numbering/signing:** source still says build 35 consistently. Select
   an unused number after checking Apple during a separately authorized build.

Live manga/book/Arabic catalog GETs and manga/book/character media probes returned
200. This small sample is not provider-wide completeness or latency certification:
the sampled book image took about 5 seconds on that request. No global speed or
zero-crash claim follows from these results.

## Evidence

Local evidence, excluded from Git/native bundles:
`output/playwright/prebuild-final-20261114/` in the parent Codex workspace;
full-suite and dependency logs are in that workspace's `output/` directory.
`browser-results.json` retains the initial run, `browser-results-rerun.json` and
`browser-results-support.json` the verified follow-ups. `responsive/`,
`empty-regression.json`, `notifications/results.json`, `static-audit.json` and
`live-readonly.json` keep their own scopes separate.
