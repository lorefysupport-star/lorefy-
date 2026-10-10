# Review editor redesign

Reference inspected: the supplied 33.77-second Lotd video, sampled throughout its work-detail, comment, and rating flows. The redesign focuses on the review task rather than copying the reference product.

## Changes
- Direct overall rating with the existing theme-aware feather control and half-step support.
- Detailed criteria are optional; completing all criteria still calculates their average.
- Recommendation, optional review text, and a spoiler checkbox remain close to the primary rating.
- Detailed ratings, memorable moments, images, and favorite characters use progressive disclosure.
- A fixed publish footer, pending state, duplicate-tap guard, and retry feedback preserve the draft on failure.
- Explicit Arabic/English UI copy, automatic text direction, keyboard focus trapping, and background inert state.
- Existing publishing API and premium attachment rules remain in place.

## Browser checks
- Arabic/light, Arabic/pink, and English/dark at 390 x 844.
- Small-screen geometry at 320 x 700: no horizontal overflow, footer visible.
- Large-layout geometry at 1024 x 900: 600px sheet, no horizontal overflow. The in-app screenshot surface cropped this large viewport, so this is a geometry check, not a complete desktop visual sign-off.
- A rating-only review saved as 4/5 in demo mode with no detailed scores or body required. That exact test review and its newly created demo library entry were removed afterwards.
- English typing, direct rating, recommendation selection, and opening detail/extras sections verified.
- The original pink/Arabic preferences were restored after testing.

Native web assets were prepared and copied to the iOS project. No TestFlight build was uploaded; physical-device keyboard and touch behavior remain unverified.

Full final Node suite: 604 passed, zero failed (`output/review-editor-tests.log`).
