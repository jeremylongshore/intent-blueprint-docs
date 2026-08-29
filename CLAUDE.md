# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## System Overview

**Intent Blueprint Docs** is a model-neutral documentation system. The canonical portable Agent Skill guides evidence-backed authoring; the deterministic core, CLI, MCP server, and host adapters render and review a selectable 22-workbook lifecycle corpus.

**Release:** v3.0.0 - Schema-backed Blueprint workbooks
**Template Count:** 22 canonical historical templates plus a generated package mirror

## Task Tracking (Beads)

```bash
bd ready                                    # Start of session
bd create "Title" -p 1 --description "..."  # Create work
bd update <id> --status in_progress         # Claim task
bd close <id> --reason "Done"               # Complete task
bd sync                                     # End of session (git sync)
```

After `bd` upgrades: `bd info --whats-new` and `bd hooks install` if warned.

## Development Commands

```bash
# Template verification
make verify                     # Verify 22 templates exist
make tree                       # Show repository layout

# Enterprise pipeline
make enterprise PROJECT="name"              # Interactive 17-question intake
make enterprise-ci PROJECT="name" ANSWERS="..."  # CI/automation mode

# Form system
node form-system/cli.js         # Interactive form interface

# Skill template build system
make gen-skills                 # Regenerate slash commands from .tmpl sources
make skill-check                # Dry-run: verify generated files are fresh
npm run gen:skill-docs          # Same as make gen-skills
npm run skill:check             # Same as make skill-check

# Testing
npm run test:skills             # Validate skill files (frontmatter, structure)
npm run test:docs               # Template static validation (22 templates)
npm run test:evals              # LLM-judge evaluation (requires ANTHROPIC_API_KEY)
```

## Directory Structure

```
├── 01-Docs/                    # Documentation (NNN-abv-description.ext format)
├── 05-Scripts/                 # Automation (export.js, verify-templates.sh, run-enterprise.mjs)
├── 99-Archive/                 # Archived items
├── professional-templates/     # 22 master templates (READ-ONLY)
├── skills/blueprint-docs/      # Canonical model-neutral Agent Skill
├── agents/                     # Focused Claude compatibility agents
├── form-system/                # Interactive CLI tools
├── commands/                   # Slash commands (new-project.md, .md.tmpl sources)
│   └── shared/                 # Shared template blocks (preamble.md, template-list.md)
├── .claude/skills/             # 5 gstack-adapted skills
│   ├── review-docs/            # Document quality review
│   ├── review-architecture/    # Architecture doc review (15 cognitive patterns)
│   ├── ship/                   # Release workflow (validate → bump → changelog → PR)
│   ├── document-release/       # Post-ship documentation sync
│   └── qa-docs/                # Report-only doc quality audit with health score
├── review/                     # Review rubrics (doc-checklist.md)
├── test/                       # Vitest test suites
│   ├── skill-validation.test.ts    # Skill file structural validation
│   ├── doc-quality-eval.test.ts    # Template quality (free + LLM-judge tiers)
│   └── helpers/llm-judge.ts        # Anthropic SDK LLM-as-judge scoring
├── scripts/                    # Build scripts (gen-skill-docs.ts)
├── .cursorrules/               # Cursor IDE integration (4 rule files)
├── .github/workflows/          # CI/CD (enterprise-e2e.yml, ci.yml, template-validation.yml)
├── vitest.config.ts            # Test configuration
└── .directory-standards.md     # Master naming/structure reference
```

## gstack Integration

Several skills and the template build system are adapted from [gstack](https://github.com/garrytan/gstack) (MIT License, Garry Tan). See `ACKNOWLEDGMENTS.md` for full attribution.

**Template build system:** `.md.tmpl` files in `commands/` are processed by `scripts/gen-skill-docs.ts` to resolve `{{PLACEHOLDER}}` tokens from shared blocks (`commands/shared/`, `review/`). The `{{DATE}}` token is intentionally preserved for doc-generation time.

**Ported patterns:**
- Template pipeline with shared content blocks
- Plan/architecture review skills (adapted for documentation domain)
- Ship workflow (template validation + npm publish)
- Document-release sync (auto-update docs after deploys)
- QA methodology (report-only quality audit with health scoring)
- LLM-judge testing infrastructure (Anthropic SDK-based eval)

## Workflows

### Claude Code CLI (One-Paste)
```
Create a new folder in completed-docs/ named after my project, then generate all 22 docs using the templates in professional-templates/. Ask me for a single free-form project summary. Use deductive reasoning to fill gaps. Output all final docs into completed-docs/<my-project>/ and include an index.md summarizing what was generated and any assumptions.
```

### Cursor IDE
```
Use @.cursorrules/01-create-prd.mdc
Here's my feature: [describe it]
```
Follow steps 2-4 in `.cursorrules/` for structured workflow.

### Enterprise Pipeline
17-question structured intake with governance controls, CODEOWNERS protection, and CI/CD integration.

## Critical Rules

1. **Templates are READ-ONLY** - Never modify `professional-templates/` files
2. **Follow directory standards** - Use `.directory-standards.md` for naming (`NNN-abv-description.ext`)
3. **Store docs in 01-Docs/** - All documentation goes there
4. **Generated docs go to completed-docs/** - Not in professional-templates/
5. **Regenerate after editing .tmpl** - Run `make gen-skills` after modifying any `.md.tmpl` or shared block

## Architecture Notes

- **22 templates** in `professional-templates/` with `{{DATE}}` placeholders for dynamic date insertion
- **Model-neutral host support** - Portable Agent Skill plus thin Claude Code, Codex, Cursor, Gemini, CLI, and MCP adapters
- **Enterprise E2E** validated via GitHub Actions
- **Node.js required** for form-system and enterprise scripts
- **Monorepo** with workspaces in `packages/` (cli, chatbots)

## GitHub

- **Repo:** https://github.com/jeremylongshore/intent-blueprint-docs
- **Org:** Intent Solutions

## Testing baseline (2026-05-01 — Intent Solutions Testing SOP)

This repo participates in the **Intent Solutions Testing SOP** per `~/.claude/CLAUDE.md` § "Intent Solutions Testing SOP" and the VPS-as-the-home program (`OPS-5nm`, Priority 6).

**Installed**: `@intentsolutions/audit-harness v0.1.0` vendored at `.audit-harness/` with wrapper at `scripts/audit-harness`.

**Commands**: `scripts/audit-harness {verify, init, list, escape-scan --staged}`.

**Next step**: run `/audit-tests` to produce `TEST_AUDIT.md`. See `000-docs/010-TQ-SOPS-audit-harness-baseline-2026-05-01.md`.

**Upgrade**: `AUDIT_HARNESS_VERSION=vX.Y.Z curl -sSL https://raw.githubusercontent.com/jeremylongshore/audit-harness/main/install.sh | bash`. Or run `/sync-testing-harness` from any session.
