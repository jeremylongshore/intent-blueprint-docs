# Intent Blueprint Docs

**Turn a rough idea into a clear project plan your team can use.**

For founders, product owners, agencies, and engineering teams. Blueprint asks questions, then creates a project brief, requirements, tasks, risks, and launch checklist. No documentation jargon needed.

## Start in 30 seconds — no install

Open this repository in your AI coding assistant and paste:

```text
Use the blueprint-docs skill in this repository to plan [describe your idea].
Ask me one question at a time. Label assumptions. Show the plan before creating files.
```

You get a draft for review with evidence, assumptions, and unknowns marked. Samples and AI guesses never become approved facts.

Example: “a booking site for my mobile dog-grooming business” becomes a ready-to-review plan—not 22 unnecessary files.

## Choose another way to use it

| If you are… | Use this path |
|---|---|
| Working in Claude Code, Codex, Cursor, or Gemini CLI | Open the repository and use the starter prompt above. |
| Adding Blueprint to another compatible AI tool | Install the portable skill from `skills/blueprint-docs/`. |
| A developer or automation engineer | Use the command-line or MCP setup below. |

## What is included

- One guided workflow that works without choosing a specific AI model.
- 22 project-document types covering planning, design, delivery, testing, launch, and operations.
- Review agents that find unsupported claims and missing links between decisions, requirements, tests, and releases.
- A command-line tool and MCP server for repeatable automation.

The 22 historical workbooks now generate shorter, schema-backed drafts by default. Historical bodies remain available only through the explicit `generationMode: "legacy"` compatibility option and carry a prominent review warning.

## Install the portable skill

Copy or install `skills/blueprint-docs/` into any tool that supports the [Agent Skills specification](https://agentskills.io/specification), then ask it to use `$blueprint-docs`.

The skill selects the smallest useful document set, builds an evidence register, connects related decisions and tests, and keeps assumptions and unknowns visible.

## CLI

Requirements: Node.js 20 or newer.

```bash
npx --package @intentsolutions/blueprint@3.0.0 blueprint --help
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
      "args": ["-y", "--package", "@intentsolutions/blueprint@3.0.0", "blueprint-mcp"]
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
