---
kind: map
status: maintained
---
# Architecture and Ownership Map

| Area | Entry points | Contract |
| --- | --- | --- |
| Web shell | [index.html](../index.html), [sw.js](../sw.js) | Native/browser safe areas and cache versions are distinct. |
| Main React application | [lorefy-app.js](../uploads/files/lorefy-app.js) | Defines NenApp; inspect this as well as feature modules. lorefy-v2.js is the statistics helper, not the main application. |
| Profile ornaments | [frame motion](../modules/lorefy-frame-motion.js), [shop](../modules/lorefy-profile-shop.js) | Shared geometry, account-scoped selection, preserve media. |
| Original artwork | [original](../modules/lorefy-original-original.js), [autumn](../modules/lorefy-original-autumn.js), [illustrated](../modules/lorefy-original-illustrated.js) | All use the shared page renderer. |
| Profile presentation | [public profile](../modules/lorefy-public-profile.js), [sections](../modules/lorefy-profile-sections.js) | Visitor snapshot belongs to the visited reader, not the viewer. |
| Reader search | [discovery](../modules/lorefy-user-discovery.js) | Search result opens a full public profile; respect account visibility. |
| Progress totals | [reading metrics](../modules/lorefy-reading-metrics.js) | Saved checkpoints, not mutable catalog totals. |
| Authentication | [auth](../auth/), [backend](../backend/) | Do not copy credentials into documentation. |
| Catalog | [catalog loading](../docs/CATALOG_LOADING.md) | Use established loaders and indexes, not a parallel catalog. |
| Native assets | [prepare-ios-web](../tools/prepare-ios-web.mjs) | Source first; then generated `ios-web` and native public files. |
| Tests | [tests](../tests/), [QA](../qa/) | Tests scale with the changed behavior. |
| Project memory | [memory tool](../tools/project-memory.mjs) | Local retrieval, fingerprints and link checks; not in runtime bundles. |

Before changes, inspect the actual module and its focused tests. This map is a
starting point, not an assertion that every feature is currently certified.

Detailed maps: [[08-Feature-Router]], [[09-Data-Contracts]],
[[systems/App-Boot]], [[systems/Accounts-Sync]], [[systems/Catalog-Search]],
[[systems/Reading-Library]], [[systems/Profiles-Lists]],
[[systems/Community-Notifications]], [[systems/Explore-Works]],
[[systems/Appearance-Bundles]], [[systems/Native-Release]],
[[systems/Language-Media]]. The full file index is [[07-Source-Atlas]].

[[00-Home]] | [[04-Current-State]] | [[05-Verification]]
