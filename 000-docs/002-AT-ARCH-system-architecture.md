# 002 - System Architecture

## Overview

Intent Blueprint Docs is a monorepo with one canonical portable skill, a provider-neutral deterministic core, two workspace packages, and thin host adapters.

## Architecture Diagram

```
                    ┌─────────────────────────────┐
                    │        User Interfaces       │
                    ├──────────┬──────────┬────────┤
                    │  CLI     │  MCP     │  IDE   │
                    │ (npx)   │ Server   │ Plugin │
                    └────┬─────┴────┬─────┴───┬────┘
                         │          │         │
                    ┌────▼──────────▼─────────▼────┐
                    │     @intentsolutions/        │
                    │        blueprint             │
                    │                              │
                    │  ┌──────────┐ ┌───────────┐  │
                    │  │ Template │ │  Plugin   │  │
                    │  │ Engine   │ │  Manager  │  │
                    │  └────┬─────┘ └─────┬─────┘  │
                    │       │             │        │
                    │  ┌────▼─────────────▼─────┐  │
                    │  │   Document Generator    │  │
                    │  └────────────┬────────────┘  │
                    └──────────────┼────────────────┘
                                   │
                    ┌──────────────▼────────────────┐
                    │         Output Layer          │
                    ├──────┬───────┬────────┬───────┤
                    │ Files│GitHub │ Linear │ Notion │
                    └──────┴───────┴────────┴───────┘
```

## Package Structure

```
intent-blueprint-docs/
├── packages/
│   ├── cli/                   # @intentsolutions/blueprint
│   │   ├── src/
│   │   │   ├── commands/      # CLI command handlers
│   │   │   ├── interview/     # AI-guided interview engine
│   │   │   └── index.ts       # CLI entrypoint
│   │   └── package.json
│   │
│   └── chatbots/              # Slack + Discord integrations
│       ├── src/
│       │   └── index.ts
│       └── package.json
│
├── professional-templates/    # 22 master templates (READ-ONLY)
├── form-system/               # Interactive CLI form tools
├── 000-docs/                  # Project documentation (doc-filing system)
├── 01-Docs/                   # Legacy docs (migrating to 000-docs/)
└── .github/workflows/         # CI/CD pipelines
```

## Key Components

### Template Engine
- Reads templates from `professional-templates/`
- Prepends project/provenance context and replaces the legacy `{{DATE}}` token
- Validates template completeness
- Supports scope filtering (MVP/Standard/Comprehensive)

### Plugin System
- Five plugin types: Formatter, Validator, Processor, Integration, Hook
- Lifecycle hooks: before/after generation
- Built-in plugins: markdown-formatter, html-formatter, quality-validator

### MCP Server
- Exposes 4 tools: generate, interview, list_templates, and customize
- Stateless design - each call is independent
- Uses standard stdio MCP so compatible hosts can connect without provider-specific business logic

### Enterprise Pipeline
- 17-question structured intake (`scripts/run-enterprise.mjs`)
- Governance controls and CODEOWNERS protection
- CI/CD integration via GitHub Actions
- Automated E2E validation

## Technology Stack

| Component | Technology |
|-----------|-----------|
| Language | TypeScript 5.3+ |
| Runtime | Node.js 20+ |
| Build | Turbo (monorepo) |
| Package Manager | npm (workspaces) |
| CI/CD | GitHub Actions |
| Templates | Markdown with placeholders |
| MCP | Model Context Protocol SDK |

## Build System

Turborepo manages the monorepo with these pipelines:

```json
{
  "build": { "dependsOn": ["^build"] },
  "dev": { "persistent": true },
  "lint": {},
  "test": { "dependsOn": ["build"] }
}
```
