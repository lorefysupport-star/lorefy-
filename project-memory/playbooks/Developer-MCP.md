---
kind: playbook
status: source-reviewed
date: 2026-11-03
---
# Developer MCP tools

The active Codex workspace (`new-chat`, which contains this checkout under
`work/`) has a local `.codex/config.toml` for Playwright, Firecrawl, Perplexity
and PostHog. Run `codex mcp list` from that workspace to verify the entries.
Restart Codex or start a new session in that workspace to load them.

| Tool | Intended use for Lorefy | Verified status |
| --- | --- | --- |
| [Playwright MCP](https://github.com/microsoft/playwright-mcp) | Run browser checks against the loopback demo in an isolated context. | Pinned 0.0.83; opened the app, clicked Explore and found its search control. |
| [Firecrawl](https://docs.firecrawl.dev/mcp-server) | Read a public provider reference, not private profiles or authenticated pages. | Keyless request denied; official OAuth endpoint configured. Account not connected. |
| [Perplexity](https://docs.perplexity.ai/docs/getting-started/integrations/mcp-server) | Find public references and verify relevant claims at their primary source. | Search tool configured; OAuth needed. Usage may be billed by the selected API organization. |
| [PostHog](https://posthog.com/docs/model-context-protocol/codex) | Query an existing, authorized Lorefy analytics project, read-only. | Configured; no login, data capture or SDK installation performed. |
| [Claude in Chrome](https://code.claude.com/docs/en/chrome) | Optional browser workflow in the separate Claude Code client. | Claude Code 2.1.317 downloaded via npm and version verified. Browser extension not installed or connected. |

For each cloud service you intend to use, run `codex mcp login <name>` from
the workspace and review the account, billing organization and permissions
yourself. Select read-only in PostHog and restrict it to the intended project.
Do not paste tokens into chat or version-controlled settings.

For Claude, review permissions in the
[official extension listing](https://chromewebstore.google.com/detail/claude/fcoeoabgfenejglbffodgkkbkcdhcgfn).
After installing the extension and signing in with an eligible Anthropic
account, run the following from the Lorefy checkout:

```powershell
npm exec --yes --package '@anthropic-ai/claude-code@2.1.317' -- claude --chrome
```

Keep these tools out of the application bundle. Use fictional accounts for
local testing. Do not send local files, auth tokens, user activity or
production data to an external tool without a separately approved purpose.

[[13-Project-Story]] | [[14-Feature-Coverage]]
