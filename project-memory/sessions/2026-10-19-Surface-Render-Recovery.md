---
kind: session
status: source-and-browser-verified
date: 2026-10-19
reviewed_on: 2026-10-19
---
# Render Failure Recovery, Not a Native Crash Diagnosis

Parent `8426a2f`. The owner requested all remaining Discord follow-ups, without
a native build. [[bugs/LF-073-Surface-Render-Recovery]] records an independent
source gap found while investigating the dark screenshot.

The installed dependency's WebViewDelegationHandler already handles web-content
process termination with bridge reset/reload. No native files or vendor code
were edited. AppShell had no React error boundary; five tests failed before the
change and pass with the localized manual fallback. Class-only diagnostics use
a fixed allowlist; no exception data is persisted or sent to a new endpoint.

`node --test tests/surface-render-recovery.test.js
tests/bootstrap-auth-safety.test.js`:15 passed. Full `npm test`:2195 passed,
zero failures/skips/cancellations. Runtime/index/sw selectively synchronized to
both native-web copies; cache `lorefy-v529-render-recovery`.

Local-only `qa/surface-recovery.html` uses the actual vendored React/ReactDOM and
runtime. AR: injected persistent render exception showed localized alert and
focused Retry; Retry while fault persisted remained usable, no blank page/loop;
clearing the simulated fault then Retry restored Lorefy. English alert and
button also verified. Fixture and screenshot `artifacts/render-recovery-en.png`
are local QA, outside native bundles/Git/vault. No real account or storage writes.

Windows read-only device inventory found no connected Apple/iPhone device in
this turn; the local mirror port8798 was not listening. Asked the owner to connect
the device, and continued source work. Do not equate this fixture with an iPhone
WebView process-kill, actual user navigation, or closure of the original report.

[[systems/App-Boot]] | [[13-Project-Story]] | [[14-Feature-Coverage]] |
[[18-Progress-Handoff]]
