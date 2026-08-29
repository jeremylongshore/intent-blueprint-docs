# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [3.0.0] - 2026-08-29

### Changed

- Default generation now uses concise schema-backed workbooks for all 22 public template IDs.
- Evidence states, provenance, trace graphs, shared modules, and human-review boundaries are runtime validated.
- Historical workbook bodies remain available only through explicit legacy compatibility mode.
- The CLI, library, MCP server, Claude, Codex, Cursor, and Gemini adapters share the 3.0.0 release identity.

### Added

- Governed opt-in example packs that cannot satisfy project evidence.
- Deterministic generation receipts, packed-consumer CLI/MCP protocol smoke tests, CycloneDX SBOM, checksums, build attestations, and release receipts.
- Current audit-harness policy pinning, conformance, and change-boundary enforcement.

## [2.9.0] - 2026-03-18

### Added
- gstack integration: template build system, 5 Claude Code skills, quality test infrastructure (#35)
- Template build system (`gen-skill-docs.ts`) with `{{PLACEHOLDER}}` resolution from shared blocks
- 5 Claude Code skills: `review-docs`, `review-architecture`, `ship`, `document-release`, `qa-docs`
- Vitest test suites: 38 skill validation tests, 133 doc quality tests
- LLM-judge evaluation helper using Anthropic SDK
- Review checklist rubric (`review/doc-checklist.md`)
- ACKNOWLEDGMENTS.md crediting gstack (MIT → Apache 2.0)
- 000-docs directory with doc-filing system
- GitHub community standards compliance (SECURITY.md, CONTRIBUTING.md, CODE_OF_CONDUCT.md)

### Changed
- CLAUDE.md refreshed: v2.0.0 reference, new commands, gstack integration section
- CI workflow: added skill validation and template freshness checks
- Makefile: added `gen-skills` and `skill-check` targets
- Vitest config: added `std-env` inline for ESM compatibility
- LLM judge model now configurable via `ANTHROPIC_MODEL` env var

### Fixed
- Hardcoded `cd ~/ai-dev` → `git rev-parse --show-toplevel` in new-project template
- Added `*)` fallback for invalid scope in new-project template
- Use `find` instead of `ls` for comprehensive template listing
- Fail fast on unresolved placeholders in `gen-skill-docs.ts`
- Response parsing in `llm-judge.ts` uses `.find()` for text block
- Template freshness guard assertion (empty suite no longer passes silently)
- Fenced code blocks now have language identifiers (MD040)
- Deduplicated `doc-checklist.md` → symlink from skill reference

### Security
- Resolved 27 npm audit vulnerabilities
- 0 critical/high/moderate vulnerabilities

## [2.0.0] - 2025-09-18

### Added
- Complete template system with 22 professional documents
- Dual AI assistant support (Claude Code CLI + Cursor IDE)
- Dynamic date placeholder system with {{DATE}} tokens
- Automated template verification via GitHub Actions
- Comprehensive CLAUDE.md for AI assistant guidance
- Professional README with SEO optimization

### Changed
- Normalized template metadata structure
- Improved directory organization
- Enhanced form system for interactive input

### Fixed
- Template integrity verification
- Cross-reference accuracy in generated documents
- Symlink compatibility for templates directory

## [1.0.0] - 2025-09-16

### Added
- Initial 22 professional templates
- Basic form system for interactive input
- Cursor IDE integration rules
- GitHub Actions CI/CD pipeline
- Makefile utilities for template verification

### Security
- Added SECURITY.md policy
- Implemented secure development practices
- Enhanced repository security settings
