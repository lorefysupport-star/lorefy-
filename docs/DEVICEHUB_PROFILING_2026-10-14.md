# Device Hub native profiling — build341021

Device: existing iPhone18Pro simulator, iOS27.0, F29283CD-2136-4084-82AD-D5506246CCC2. Existing account/session preserved. No save/post/reaction/account mutation. No source changes, new app build, commit or push during this profiling pass.

## Confirmed recording

Instruments Time Profiler completed a30.620505-second all-process recording; analysis filtered exclusively to Lorefy App18963 and its simulator WebContent18971. Raw traces remain under /tmp/lorefy-devicehub-profile-341021/; all-process traces can contain unrelated host activity and are not included in repository or uploaded.

Lorefy native shell:230 weighted1ms running samples (162ms on main thread). WebContent:1097 weighted1ms running samples (865ms on main thread). One-core average estimates0.75% and3.58%, respectively, across a mostly idle30.6s window. Do not call these overall performance percentages. Largest WebContent one-second bin contained598ms sampled CPU; that is CPU work in a time bin, not a598ms UI hang.

JavaScriptCore appeared in902ms of inclusive WebContent samples (~82% of1097ms); WebCore861ms; ImageIO8ms; CoreText11ms. Inclusive stacks overlap, so these cannot be summed into a total. Timer-dispatch functions appeared in~680ms of samples. This prioritizes JavaScript/timer-driven UI work for deeper profiling in this particular recording; it does not prove image loading is inexpensive in other flows. JIT addresses were unresolved, so no specific Lorefy JavaScript function can be attributed yet.

Observed UI: existing NARUTO query and56 results; dismiss keyboard; return to Home; feed and avatars loaded. Following restart Home rendered and retained signed-in avatar. Automated swipes did not visibly move Home feed, so scroll smoothness was not validated. Follow-up search trace did not establish successful search interaction and is not presented as a search benchmark.

## Unavailable measurements

Animation Hitches record failed: “Hitches is not supported on this platform.” Activity Monitor failed: “Activity monitoring service not available on this device.” App Launch recorded with input/sampling warnings; lifecycle table exported zero rows. Consequently no valid FPS/hitch count, whole-app memory footprint or exact launch duration is reported. Empty potential-hangs table likewise is not proof of no hangs, given the missing-input warning. Host ps RSS for native shell alone excludes WebContent and cannot stand in for total iPhone app memory.

The Device Hub window later became unavailable (noWindowsAvailable), though the underlying simulator stayed booted. No device/system settings were changed in this pass; Capture Keyboard was already on, previously explicitly authorized.

## Next measurement

Use physical iPhone Instruments for animation hitches, memory and launch metrics. For actionable JavaScript attribution, capture a Safari Web Inspector JavaScript/Rendering timeline for the native WebView (debug inspectability may need a dedicated local profiling build). Measure Home transitions and refreshes before changing them. CPU traces alone cannot certify zero lag or quantify overall improvement.

## Follow-up: image and accessibility maintenance

Local timing probe build 341022 identified image guarding and accessibility DOM maintenance as expensive callbacks. Image guarding now queues only added/changed images and uses IntersectionObserver for lazy visibility instead of interleaving style writes with synchronous geometry reads. Accessibility uses CSS minimum touch targets and avoids per-button geometry reads; rating and character ranking controls retain their exclusions.

Observed callback maxima: image flush 247 → 42 ms; accessibility maintenance 92 → 2 ms; whole growth maintenance 103 → 13 ms. These are diagnostic callback samples from separate simulator runs, not an overall app speed percentage or a controlled FPS benchmark. Later search ranking reached 87 ms and an anonymous timer reached 114 ms, so the app cannot be claimed free of frame stalls. Search accepted Naruto and displayed 55 results. No account data was written.

Privacy-safe counters are in performance/devicehub-js-maintenance-341022.json. Normal generated assets omit the local probe; final simulator build is 341023. Physical iPhone profiling is needed for valid scrolling hitches, memory and cold-launch measurements.
