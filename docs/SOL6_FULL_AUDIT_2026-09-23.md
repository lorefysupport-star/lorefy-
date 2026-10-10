# Lorefy full local audit - 23 September 2026

## Decision

The local preview and automated suite are healthy enough for continued beta work, but this audit does not certify the deployed app or a new TestFlight build. The remaining release checks require real accounts, a real iPhone, and App Store Connect. Content rights remain deferred by the owner.

## Verified this pass

| Area | Evidence | Result |
| --- | --- | --- |
| Automated regression suite | `npm test` | 361 passed, 0 failed |
| App syntax and patch hygiene | `node --check uploads/files/lorefy-app.js`; `git diff --check` | Passed; Git emitted only line-ending warnings |
| iOS web assets | `npm run ios:prepare`; `npx cap copy ios` | Prepared and synchronized the current web bundle; no native build or upload |
| Catalog load | Local browser preview, all 17 parts loaded | Completed |
| Comics search | Search `Batman`, filter `Comics`, open 23-edition picker, select Jim Starlin 1988 | Picker opens the selected work; same-title works remain separate saved identities |
| Reading statistics | Local demo after full catalog ingestion | Legacy auto-filled Bleach chapter 706 removed; saved progress empty, profile shows 0 chapters and 0 reading hours |
| Community | Local demo feed and first post's reply thread | Feed loads; thread contains post, reply, reaction controls and reply composer instead of a blank page |
| Native release preflight | `npm run apple:audit` | Two reported blockers: privacy nutrition label and content rights |

## Findings

1. **P1 - Work recommendations are not relevant.** The Jim Starlin Batman detail page recommends `Cardcaptor Sakura`, `Magic Knight Rayearth`, `Not THIS Bear!`, and `Little Lulu`. The detail view uses the work's raw `related` IDs without a relevance/type check. This is a catalog trust problem, not a layout problem. Add a verified relationship source or suppress unverified recommendations.
2. **P1 - Comics taxonomy still contains wrong media types.** The Comics search list includes manga such as `Dragon Ball vol 13` and `Uzumaki`, and prose/other material. Existing classification only corrects entries when explicit markers are present. Audit source metadata and add a conservative, provenance-aware reclassification pass before treating the Comics section as clean.
3. **P2 - Demo review content can contradict its label.** The local demo feed has some `recommends` labels paired with negative review text and vice versa. This is generated fixture content, not evidence of live user data corruption, but it makes the preview unreliable for editorial QA. Make demo sentiment and recommendation flags consistent.
4. **P2 - Search result card has nested interactive controls.** The Batman result's clickable `article` contains an edition-picker button and an add-to-list button. The picker works with a direct click, but the nested button roles make broad assistive-technology locators ambiguous. Separate the card's open action from its child controls.

## Not certified by this pass

- Live Google and Apple sign-in, relogin, account linking, account deletion, and crash behavior on physical iPhone devices. Automated contract tests pass, but they do not replace this acceptance run.
- Live multi-account isolation, follow graph, review uniqueness, reactions, reports, and Supabase policies after deployment. The suite covers their code contracts; this pass did not mutate production accounts.
- Real-device iPad/iPhone visual and performance behavior. Local preview dimensions were smoke-tested earlier; native rendering and memory/scroll performance were not measured here.
- App Store Connect privacy answers and reviewer metadata. `apple:audit` still flags the privacy nutrition label. The content-rights decision is explicitly deferred until before final release.

No build was uploaded or sent to testers in this pass.
