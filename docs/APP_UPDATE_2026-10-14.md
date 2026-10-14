# Lorefy app update — 2026-10-14

Integrated the reviewed Explore redesign, profile customization and list/post layouts, work details with Story/Related sections, character search improvements, consistent navigation, notification handling, and rendering/search performance fixes. Includes the existing main branch profile-decoration geometry fixes from 716da60.

Validation: all 1,102 Node regression tests passed after integration; Release iOS simulator compilation succeeded. Local simulator build 341024 contains this integrated source. Native web assets were regenerated from canonical source. Build 34 archives remain unchanged. Temporary design review pages were not included in this update.

Simulator checks verified search input and results. Timing evidence is recorded in DEVICEHUB_PROFILING_2026-10-14.md and performance/. These measurements do not establish a universal app speed improvement or absence of frame stalls. Physical iPhone scrolling, memory, cold launch and authentication checks remain outstanding. External push delivery still requires Apple APNs credentials/configuration; this update does not configure production secrets or deploy backend services.

This is a source update to GitHub, not an App Store/TestFlight upload or production backend deployment.
