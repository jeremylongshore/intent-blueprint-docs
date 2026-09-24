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

### Completed
- 22 professional templates with dynamic date placeholders
- CLI tool (`@intentsolutions/blueprint`)
- MCP server (`blueprint-mcp` binary in `@intentsolutions/blueprint`)
- Core library (main export of `@intentsolutions/blueprint`)
- Portable Agent Skill plus Claude, Codex, Cursor, and Gemini adapters
- Enterprise pipeline with 17-question intake
- GitHub Actions CI/CD
- Template marketplace framework
- Plugin system architecture
- Analytics dashboard

### In Development (Beta)
- Template pack publishing workflow
- Web UI for non-technical users
- Team collaboration features
- Enhanced export integrations (Linear, Jira, Notion)

### Planned
- Slack/Discord bot integration
- Custom branding per organization
- Multi-language template support
- Real-time collaborative editing

## Packages

| Package | Description | Status |
|---------|-------------|--------|
| `@intentsolutions/blueprint` | CLI, library, templates, and MCP binary | Beta |
| `@intentsolutions/blueprint-chatbots` | Slack and Discord adapters | Beta |

## Documentation Scopes

| Scope | Documents | Target |
|-------|-----------|--------|
| MVP | 4 docs | Quick starts, prototypes |
| Standard | 12 docs | Most projects |
| Comprehensive | 22 docs | Enterprise, compliance |
