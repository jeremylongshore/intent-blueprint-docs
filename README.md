# Intent Blueprint Docs

**Turn a rough idea into a clear project plan your team can use.**

For founders, product owners, agencies, and engineering teams. Blueprint asks questions, then creates a project brief, requirements, tasks, risks, and launch checklist. No documentation jargon needed.

## Start in 30 seconds — no install

Open a local copy of this repository in your AI coding assistant and paste:

```text
Use the blueprint-docs skill in this repository to plan [describe your idea].
Read skills/blueprint-docs/SKILL.md first.
Ask me one question at a time. Label assumptions. Show the plan before creating files.
```

You get a draft for review with evidence, assumptions, and unknowns marked. Samples and AI guesses never become approved facts.

Example: “a booking site for my mobile dog-grooming business” becomes a [draft project brief like this](examples/dog-grooming-project-brief.md). Start with the documents you need.

Need a local copy? [Download the repository ZIP](https://github.com/jeremylongshore/intent-blueprint-docs/archive/refs/heads/main.zip), extract it, and open the folder in your assistant. This path needs no Node.js or package installation. Your assistant must be able to read local files.

## Browse the templates

Click a template name to see what its draft looks like—no install needed.

Start with the [project brief](examples/template-previews/14_project_brief.md), [requirements](examples/template-previews/01_prd.md), or [task plan](examples/template-previews/03_generate_tasks.md). Use only the documents your project needs.

These previews use the same fictional dog-grooming booking idea. They show the current generator’s **starter workbooks**, with unanswered fields marked **Unknown**. Your assistant uses your answers and evidence to develop them into project-specific documents. They are not completed plans or approved research.

| Template — click to preview | What it helps you do |
|---|---|
| [Product requirements (PRD)](examples/template-previews/01_prd.md) | What to build and why. |
| [Technical decision (ADR)](examples/template-previews/02_adr.md) | Why a technical decision was made. |
| [Task plan](examples/template-previews/03_generate_tasks.md) | Break the plan into tasks. |
| [Task workflow](examples/template-previews/04_process_task_list.md) | Track tasks through completion. |
| [Market research](examples/template-previews/05_market_research.md) | Plan research and record sourced findings. |
| [System architecture](examples/template-previews/06_architecture.md) | How the system fits together. |
| [Competitor analysis](examples/template-previews/07_competitor_analysis.md) | Compare alternatives using evidence. |
| [User personas](examples/template-previews/08_personas.md) | Who the users are and what they need. |
| [User journeys](examples/template-previews/09_user_journeys.md) | How users complete a goal. |
| [User stories](examples/template-previews/10_user_stories.md) | Describe needs from a user’s perspective. |
| [Acceptance criteria](examples/template-previews/11_acceptance_criteria.md) | Define what counts as working. |
| [Quality gate](examples/template-previews/12_qa_gate.md) | Check quality before moving forward. |
| [Risk register](examples/template-previews/13_risk_register.md) | Track risks and safeguards. |
| [Project brief](examples/template-previews/14_project_brief.md) | The problem, goals, scope, and decision needed. |
| [Brainstorming](examples/template-previews/15_brainstorming.md) | Capture ideas and decide what to explore. |
| [Frontend specification](examples/template-previews/16_frontend_spec.md) | Specify screens, states, and interactions. |
| [Test plan](examples/template-previews/17_test_plan.md) | What to test and how to prove it works. |
| [Release plan](examples/template-previews/18_release_plan.md) | Plan rollout and rollback. |
| [Operational readiness](examples/template-previews/19_operational_readiness.md) | Check support, recovery, and go-live readiness. |
| [Metrics dashboard](examples/template-previews/20_metrics_dashboard.md) | Choose useful measures and their sources. |
| [Postmortem](examples/template-previews/21_postmortem.md) | Learn from an incident and track improvements. |
| [Usability study](examples/template-previews/22_playtest_usability.md) | Plan a usability study and record findings. |

[About these previews and how to regenerate them](examples/template-previews/README.md).

## More ways to use Blueprint

<details>
<summary>Show setup, enterprise generation, plugins, and developer reference</summary>

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

</details>

Read [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md), and [LICENSE](LICENSE). Track durable work with Beads (`bd`).
