# Library Workbench (local)

Reading state and search stay visible. A native expander groups format, sort,
and the four existing layouts without a modal or a second set of filter state.
The Reading tab links to the closest unfinished work with a known saved unit
and total; a title search suppresses the shortcut. No catalog or account writes.

Sources: modules/lorefy-library-cinema.js, modules/lorefy-library-view.js,
styles/lorefy-library-cinema.css, uploads/files/lorefy-app.js (Library only).
Pattern for later consideration: heading/action, scoped search, state rail,
results and expandable secondary tools. Not applied to other sections.

Local Chromium demo, 320/390/820px, Arabic dark and English light: four
layouts, combined filters, keyboard close, empty search and reset. In the
empty 390px baseline the grid starts at 279px instead of 383px. Focused Library
tests: 59. Not a physical-device check or a released build.
Run node qa/library-workbench-preview.cjs for the scoped local sample library.

The local follow-up adds an on-device, Library-only comfortable/compact cover
preference (two/three columns on phones), visible layout names and keyboard
focus restoration after opening a work from the filtered collection. At 390px
the poster widths are 172px and 110px. Verified with Chromium at 320, 390, 440
and 820px, all four layouts, selection after reload and a keyboard round trip.
The phone preview uses the ten-work tester fixture; no real membership changed.

Follow-up: compared the four tabs at 390px. Library alone now pairs search with
an accessible disclosure; count feedback appears on filtering, not three times
in the default view. Grid captions and checkpoints share the UI reading edge
and Arabic unit labels use explicit current/total wording. The first poster
moved from y=291 to 233. Chromium checks at 320/390/440/820px covered search,
reset, layouts, Escape and returned focus. No other tab was redesigned.
