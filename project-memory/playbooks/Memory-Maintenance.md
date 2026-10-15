---
kind: playbook
status: maintained
---
# Memory Maintenance

## Before a task

Run `npm run memory:context -- relevant keywords`, then inspect the named source.
`npm run memory:search -- keywords` returns ranked local notes. Use English or
Arabic keywords/aliases. Missing or stale context is not permission to invent facts.

Use [[08-Feature-Router]] to find the relevant `systems/` note and its focused
tests. Read [[09-Data-Contracts]] before changing shared state. Source inventory
entries in [[07-Source-Atlas]] are not evidence of semantic review.

## After authorized repository edits

Update only relevant curated notes. Every meaningful claim needs a date,
source/file/commit reference, evidence and status. Record durable decisions and
verified bugs; don't copy all conversation history. Use the templates.

Mark abandoned decisions superseded and link to the replacement. Keep historical
test results labeled historical. Keep unresolved issues open, not silently fixed.

Run `npm run memory:refresh` to regenerate the managed snapshot, source inventory
indexes, responsibilities Canvas and fingerprint JSON. Manual notes are never
overwritten; handwritten generated targets make refresh stop rather than replace
them. Edit `brain-map.json` to maintain the Canvas specification, not the generated
Canvas. Its conceptual nodes link to curated notes, not automatic code calls.
Then run `npm run memory:audit` for freshness, missing core notes, broken/ambiguous
links, unreachable notes and exact duplicates. No notes are merged or deleted.

After a pull or commit, refresh the snapshot during an authorized edit task.
For read-only tasks, report stale context instead of modifying files. Changes
to untracked allowlisted feature files are now detected. Excluded media, catalog
data, frozen archives, dependencies and live services still need separate review.
Generated files include no source bodies or credential/configuration values.
Only paths, sizes and hashes are captured from canonical allowlisted source.

## Knowledge quality

Use [[15-Work-Control]] for remaining work, independent verification scopes and
review reminders. [[16-Obsidian-Workflow]] records the official research and
property conventions. Set reviewed_on only after reviewing the note against
source or dated evidence, never on refresh, file modification or merely opening it.
Templates start unverified; closed work requires the relevant evidence.

Maintain date/status/source and verification boundaries for each meaningful note.
Add the note to the relevant index so the audit can reach it from [[00-Home]].
Use [[templates/Feature]] for features. Place uncertain incoming material in
[[inbox/Inbox]]; do not promote it to accepted knowledge without reading the source.
Update [[10-Open-Questions]] when evidence changes. Read [[11-Organization-Plan]]
before any proposed cleanup: organizing memory does not authorize deleting code.

## Privacy and portability

Markdown notes and the fingerprint data can be versioned with the project.
Device-specific `.obsidian/` settings and attachments are ignored. No credentials,
user exports or private account information belong here. Obsidian local recovery
and Git history serve different purposes; uncommitted work is not backed up remotely.

`project-memory/` is excluded from EAS uploads and the native runtime allowlist.
No community plugins, remote indexes or cloud sync are configured.

Sources: [memory tool](../../tools/project-memory.mjs),
[agent contract](../../AGENTS.md), [upload exclusions](../../.easignore).

[[00-Home]] | [[templates/Decision]] | [[templates/Bug]] | [[templates/Session]]
