---
{"kind":"bug","id":"LF-073","status":"closed","priority":"P1","area":"app-boot","date":"2026-10-19","reviewed_on":"2026-10-19","source_commit":"8426a2f","source_verified":true,"device_verified":false,"service_verified":false,"requires_device":false,"requires_service":false,"verified_on":"2026-10-19","resolution_evidence":"[[sessions/2026-10-19-Surface-Render-Recovery]]","next_action":"Keep the original Discord black-screen report open until matching device evidence identifies its cause"}
---
# LF-073: A descendant render exception has no recovery boundary

[AppShell](../../modules/lorefy-ui-runtime.js) lacked a React error boundary, so
a child render failure could unmount the entire root. The vendor Capacitor
delegate already reloads a terminated WebView; an extra guessed native reload
would not diagnose the Discord black screenshot.

The new boundary shows localized recovery, focuses its retry button, and only
retries on explicit action or a newly supplied surface. It does not reload the
page, clear storage, promise unsaved-draft recovery, or loop automatically on the
same failing child. Local diagnostics contain a standard error class only,
never the exception message, stack or user content.

Five initially failing regression cases,15 related cases and2195 full cases
passed. Real vendored React in an isolated AR/EN browser fixture proved fallback,
persistent failure and recovery after clearing the injected fault. The original
report's cause and installed iPhone remain unverified; this closes the source
recovery gap only.

[[sessions/2026-10-19-Surface-Render-Recovery]] | [[systems/App-Boot]] |
[[12-Device-Repairs]] | [[15-Work-Control]]
