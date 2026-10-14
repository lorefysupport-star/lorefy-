---
kind: decision
status: accepted
date: 2026-10-13
---
# Local Project Memory

The user requested current Obsidian and a durable memory that improves project
work. Obsidian 1.14.4 was checked against the official public download and
installed from the matching winget release. Installer hash and publisher were verified.

## Choice

Keep a compact Markdown vault inside the active repository, separate from
runtime assets. The agent reads core context and retrieves relevant notes before
substantial tasks through the repository's AGENTS contract. Both the agent and
Obsidian work on the same files; the desktop application need not be running
for local retrieval.

Use dated decisions, focused bug playbooks, sessions, source references and
bounded retrieval rather than indiscriminately storing chats or the entire
repository. Generated fingerprints expose drift; they do not certify tests.

No new AI provider, embedding service, MCP server, cloud sync or paid plugin is
needed. Restricted Mode remains on; third-party plugins inherit broad access
and would need a separate review and explicit consent before sharing data.

Limitations: retrieval is local lexical search, not semantic embeddings or an
autonomous learning engine. Notes need maintenance. Agents must follow AGENTS
and check sources; no guaranteed quality percentage is claimed.

Sources: [official download](https://obsidian.md/download),
[public release](https://obsidian.md/changelog/2026-10-05-desktop-v1.14.4/),
[plugin security](https://obsidian.md/help/plugin-security),
[agent integration](../../AGENTS.md).

[[00-Home]] | [[playbooks/Memory-Maintenance]] | [[sessions/2026-10-13-Obsidian-Setup]]
