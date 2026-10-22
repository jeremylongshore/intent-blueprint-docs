# 001 - Product Vision and Roadmap

## Vision

Intent Blueprint Docs is a model-neutral system for creating evidence-backed product and engineering documentation. A portable Agent Skill governs authoring; the deterministic core, CLI, MCP server, and host adapters share the same catalog and integrity contract.

## Core Value Proposition

- **Focus**: Select the smallest useful set instead of generating 22 documents by default
- **Integrity**: Keep verified facts, derived analysis, assumptions, and unknowns distinct
- **Flexibility**: CLI, MCP server, IDE integration, and programmatic API
- **Extensibility**: Plugin system, template marketplace, and custom template packs

## Product Pillars

### 1. Template Engine
The foundation: 22 professionally crafted templates covering product strategy, technical architecture, user experience, development workflow, and quality assurance.

### 2. AI Integration (MCP-First)
Native Model Context Protocol integration makes Blueprint a first-class tool for any AI agent or IDE that supports MCP.

### 3. Enterprise Pipeline
Structured 17-question intake with governance controls, CODEOWNERS protection, and CI/CD integration for organizations.

### 4. Ecosystem
Template marketplace, plugin system, and community-contributed template packs for verticals (FinTech, HealthTech, SaaS) and compliance frameworks (SOC 2, HIPAA, GDPR).

## Current Status

**Version:** 3.0.0 (schema-backed workbook release line)

### Maintained workflows

- Portable documentation skill with comprehensive enterprise authoring guidance
- Canonical 22-workbook engine, library, CLI and four-tool stdio MCP adapter
- Enterprise intake mapped to provided evidence, source hashes and draft workbooks
- Generation receipts persisted beside written documents
- Explicit task/story records for GitHub, Linear and Jira export previews
- Self-contained skill plugin bundle for Codex, Claude Code and Grok Build
- CI checks for generation, protocols, packaging and enterprise output integrity

### Experimental surfaces

REST custom-template helpers, live external exports, team configuration, model-provider clients, internal template marketplace, analytics and Slack/Discord delivery code require environment-specific evaluation. Source modules are preserved; their presence is not a claim of a hosted enterprise platform. Bi-directional sync and webhook registration are not supported. There is no shipped graphical collaboration application.

### Distribution

The source version is 3.0.0. Use a checkout build or `npm run plugin:build` for current behavior until npm publication is completed through the release workflow. Plugin packaging is separate from approval by a host's directory.

## Documentation Scopes

| Scope | Documents | Target |
|-------|-----------|--------|
| MVP | 4 docs | Quick starts, prototypes |
| Standard | 12 docs | Most projects |
| Comprehensive | 22 docs | Enterprise, compliance |
