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

## Working enterprise workflow

Blueprint supports enterprise discovery and a comprehensive set of 22 draft workbooks through the same engine used by the CLI and MCP server. The assistant uses the enterprise skill guidance to turn those workbooks into project-specific analysis, decisions, controls and release evidence.

```bash
npm ci
npm run build
node scripts/run-enterprise.mjs --project MyProject --answers /path/to/17-answers.txt
node scripts/verify-enterprise-output.mjs MyProject
```

Discovery answers are preserved as provided evidence with source hashes. Output includes document metadata and generation receipts. Re-running into existing generated output requires `--force`. See the [enterprise workflow](skills/blueprint-docs/references/enterprise-workflow.md).

## CLI and MCP from source

Requirements: Node.js 20 or newer. This source tree is version 3.0.0; that version has not been published to npm. Build this checkout to use the current engine:

```bash
npm ci
npm run build
node packages/cli/dist/cli.js --help
node packages/cli/dist/cli.js generate --name MyProject --description "My project objective" --scope mvp --output ./docs/my-project
```

Repository-local `.mcp.json` and `.cursor/mcp.json` use the built server. Start clients from this repository, or configure an absolute path:

```json
{
  "mcpServers": {
    "blueprint-docs": {
      "type": "stdio",
      "command": "node",
      "args": ["/absolute/path/to/intent-blueprint-docs/packages/cli/dist/mcp/index.js"]
    }
  }
}
```

The four tools list templates, interview, customize, and generate. Generation previews by default; `writeFiles: true` explicitly enables filesystem output. The JavaScript library also accepts structured evidence and traceability graphs.

## Install as a plugin

```bash
npm ci
npm run plugin:build
```

This creates a self-contained skill plugin, bundled local engine, icons, license notices and submission ZIP in `dist/plugin/`. The bundle works without npm, credentials or network access after installation; the optional engine requires Node.js 20+.

- **Codex:** add the generated local marketplace with `codex plugin marketplace add ./dist/plugin`, then install `blueprint-docs@intent-blueprint` with `codex plugin add`. Restart the session and invoke `$blueprint-docs`.
- **Claude Code:** load `claude --plugin-dir ./dist/plugin/blueprint-docs`, then invoke `/blueprint-docs:blueprint-docs`.
- **Grok Build:** load `grok --plugin-dir ./dist/plugin/blueprint-docs`, then invoke `/blueprint-docs`.
- **Other Agent Skills hosts:** copy the bundled `skills/blueprint-docs/` directory, including references and runtime, to the host's skill location.

See [plugin packaging and compatibility](000-docs/013-DR-GUID-plugin-packaging.md) for verification limits and artifact details. Packaging does not mean directory approval; the ZIP is prepared for later submission.

## Supported surfaces

The portable skill, enterprise workbook flow, library, CLI generation/interview, MCP, and explicit-record export previews are maintained together. Live exports require service credentials and authorization. Use `## TASK-ID: Title` or `## STORY-ID: Title` records with acceptance criteria for GitHub, Linear and Jira; workbook headings and ordinary lists are excluded.

REST custom-template helpers, model-provider clients, team configuration, marketplace, analytics and delivery bots remain experimental modules. Bi-directional sync and webhook registration are not implemented. These are not a hosted enterprise service or a certification system.

## Development

```bash
npm ci
npm run templates:check
npm test
npm run lint
npm run verify
npm run skill:check
npm run plugin:build
```

`npm test` builds before running artifact tests, so it works from a clean checkout. `professional-templates/core/` is the canonical historical corpus. Never edit `packages/cli/templates/core/` directly; run `npm run templates:sync`.

## Documentation integrity

Blueprint uses a common metadata and evidence contract and recommends stable identifiers such as `REQ-`, `ADR-`, `RISK-`, `TEST-`, and `REL-`. Standards are alignment guides, not automatic certifications. See the [template-system audit](000-docs/011-AT-AUDT-template-system-modernization.md) for the complete assessment and migration roadmap.

Read [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md), and [LICENSE](LICENSE). Track durable work with Beads (`bd`).
