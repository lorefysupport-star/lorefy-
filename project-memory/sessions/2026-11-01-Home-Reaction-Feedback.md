---
kind: session
status: source-browser-verified-service-device-pending
date: 2026-11-01
source_commit: 5890894
---
# Home reaction feedback and aligned actions

Owner requested UI/UX Pro Max and Apple-guided fixes, especially poor tweet
interactions and Home continuation. This is the reaction portion; reading/header
geometry is a separate follow-up. Source-only GitHub repair, no native build.

## Reproduction and change

- Review actions used clustered fixed44px controls while posts had different
  ordering/layout. Home-only shared five-track grid now distributes the controls,
  retains44px targets, keyboard focus, selected heart fill and semantic colors.
  Selected bookmarks retain feedback, including standalone posts. No global theme,
  artwork, user font, library or profile redesign.
- Live standalone post reactions previously waited for the RPC to paint and
  locked only the tapped button, allowing an opposite concurrent request. Now
  optimistic selected/count states paint immediately, both controls announce
  pending/disabled and share the lock. Failure restores the prior snapshot unless
  a newer realtime object replaced it; success never adds the count again.
- Backend/account/epoch changes suppress obsolete UI/error callbacks. This does
  not cancel already dispatched writes or certify live service policies.
- Review action names are localized at creation. Large review counts compact
  only visually, retaining exact full counts in accessible names/tooltips. Paint
  writes the final display once, avoiding full/compact mutation oscillation.
- No replacement of React-owned action children, no new icon/dependency/provider.
  Existing local reaction keys and cloud payloads unchanged. Cachev645; only
  repaired JS/CSS and entry/worker selectively mirrored to both web runtimes.

## Evidence

11 new behavior/style cases; initial reaction-only9 cases had8 failures.
Final full suite3122/3122, zero failures,69,227ms. Additional38 focused cases
passed after counter stability coverage. Syntax/mirror/diff checks accompany
the commit. Earlier full runs exposed stale cache assertions and a static check
for the obsolete full-number writer; tests now assert final display stability.

192/192 actual local-app browser checks: AR/EN x dark/pink x320/390/768.
Asserted actual locale/theme, equal44px tracks, selected/exclusive toggles,
exact single increment, filled heart, save, large counts, keyboard activation
and no accidental thread opening. No page errors. Browser fixtures are demo,
external requests blocked; delayed RPC/failure/owner races tested in source,
not by publishing or reacting on a real user's account.

Evidence outside Git: output/playwright/home-reactions.js, -results.txt and
home-reactions-*.png; artifacts/home-reactions-20261101-{red,full}.log.
Skills: UI/UX Pro Max touch target/spacing search; Apple HIG synthesis and
apple-design response/continuity guidance. Existing palette/identity preserved.

[[systems/Community-Notifications]] | [[13-Project-Story]] |
[[14-Feature-Coverage]] | [[15-Work-Control]]
