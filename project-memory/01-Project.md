---
kind: context
status: maintained
---
# Project and Boundaries

Lorefy is a bilingual Arabic/English reading application with libraries, catalog
search, progress, public profiles, community features, lists and decorations.

The active application is the HTML/CSS/JavaScript repository containing this
vault, not the older Expo React Native prototype. React/ReactDOM are vendored.
Capacitor and Swift provide the iOS shell; EAS is build infrastructure.

- Preserve user banners, avatars, favorites, shelves, colors and account-scoped persistence.
- Keep `archives/` and `build34/` frozen.
- Local demo fixtures are not real production users.
- A source push does not build, submit or deploy the application.
- Production database migrations and release uploads need separate explicit authorization.
- This vault is project documentation, not a runtime feature or replacement for source control.

Sources: [README](../README.md), [AGENTS](../AGENTS.md),
[Build 34 readiness](../docs/BUILD34_READINESS.md).

[[00-Home]] | [[02-Architecture]] | [[06-Known-Risks]]
