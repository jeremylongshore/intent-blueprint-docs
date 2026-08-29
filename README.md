# Intent Blueprint Docs

Model-neutral workflows and deterministic workbooks for product and engineering documentation.

Blueprint Docs helps a capable coding agent or human team create evidence-backed PRDs, architecture descriptions, ADRs, risks, stories, tests, releases, operational reviews, and postmortems. The portable Agent Skill is canonical; MCP, CLI, Claude Code, Codex, Cursor, and Gemini integrations are thin adapters.

> Blueprint’s renderer creates structured workbooks. It does not independently research a project or turn sample content into verified facts. Agent-assisted drafts require source review and accountable human approval.

## What is implemented

| Surface | Status | Artifact |
|---|---|---|
| Portable agent workflow | Implemented | `skills/blueprint-docs/SKILL.md` |
| Historical 22-workbook corpus | Implemented; modernization in progress | `professional-templates/core/` |
| Project/provenance envelope | Implemented | `@intentsolutions/blueprint` core |
| CLI and library | Implemented | `@intentsolutions/blueprint` |
| MCP list, interview, preview, and explicit write | Implemented | `blueprint-mcp` binary in the same package |
| Claude Code adapter and review agents | Implemented | `.claude-plugin/`, `agents/` |
| Codex plugin metadata | Implemented | `.codex-plugin/` |
| Cursor and Gemini adapters | Implemented | `.cursor/`, `gemini-extension.json`, `GEMINI.md` |
| GitHub, Linear, Jira, and Notion exporters | Library/CLI modules exist; not exposed as MCP tools | `packages/cli/src/integrations/` |
| Fully schema-backed replacements for all legacy templates | Planned migration | `000-docs/011-AT-AUDT-template-system-modernization.md` |

## Use the portable skill

Copy or install `skills/blueprint-docs/` into any harness that supports the [Agent Skills specification](https://agentskills.io/specification), then ask it to use `$blueprint-docs`.

The skill selects the smallest useful document set, builds an evidence register, assigns stable record IDs, connects lifecycle traceability, and keeps assumptions and unknowns visible.

## CLI

Requirements: Node.js 20 or newer.

```bash
npx --package @intentsolutions/blueprint@2.9.0 blueprint --help
```

The published package contains the CLI, JavaScript library, MCP binary, and a generated mirror of the historical templates. There are not separate `-core` or `-mcp` npm packages.

## MCP

Repository-local clients can use `.mcp.json`. An equivalent stdio configuration is:

```json
{
  "mcpServers": {
    "blueprint-docs": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "--package", "@intentsolutions/blueprint@2.9.0", "blueprint-mcp"]
    }
  }
}
```

- `blueprint_list_templates` lists catalog-bound IDs.
- `blueprint_interview` gathers project context.
- `blueprint_customize` previews one workbook and rejects paths outside the catalog.
- `blueprint_generate` previews by default; `writeFiles: true` is required for filesystem output.

## Development

```bash
npm install
npm run templates:check
npm run test:docs
npm run test:skills
npm test
npm run build
```

`professional-templates/core/` is the canonical historical corpus. Never edit `packages/cli/templates/core/` directly; run `npm run templates:sync`. CI and `npm run verify` fail if the package mirror drifts.

## Documentation integrity

Blueprint uses a common metadata and evidence contract and recommends stable identifiers such as `REQ-`, `ADR-`, `RISK-`, `TEST-`, and `REL-`. Standards are alignment guides, not automatic certifications. See the [template-system audit](000-docs/011-AT-AUDT-template-system-modernization.md) for the complete assessment and migration roadmap.

Read [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md), and [LICENSE](LICENSE). Track durable work with Beads (`bd`).
