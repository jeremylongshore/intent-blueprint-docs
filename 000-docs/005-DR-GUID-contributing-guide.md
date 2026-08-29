# 005 - Contributing Guide

## Welcome

Thank you for your interest in contributing to Intent Blueprint Docs. This guide covers how to get started, our standards, and the contribution workflow.

## Getting Started

```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/intent-blueprint-docs.git
cd intent-blueprint-docs

# Install dependencies
npm install

# Build all packages
npm run build

# Run in development mode
npm run dev
```

## Project Structure

```
intent-blueprint-docs/
├── packages/cli/          # CLI tool source
├── packages/chatbots/     # MCP server source
├── professional-templates/ # 22 master templates (READ-ONLY)
├── form-system/           # Interactive form tools
├── 000-docs/              # Project documentation
└── .github/workflows/     # CI/CD
```

## Contribution Types

### Template Improvements
- Fix typos or unclear guidance in templates
- Improve placeholder coverage
- Suggest new template sections

### Code Contributions
- Bug fixes
- New MCP tools
- Plugin implementations
- Export integrations
- Performance improvements

### Documentation
- Improve guides in `000-docs/`
- Add examples and tutorials
- Fix documentation errors

### Template Packs
- Create vertical-specific template packs (FinTech, HealthTech, etc.)
- Create compliance template packs (SOC 2, HIPAA, GDPR)
- Create framework-specific packs (Next.js, FastAPI, Rails)

## Workflow

1. **Fork** the repository
2. **Create a branch**: `git checkout -b feature/my-feature`
3. **Make changes** following the coding standards below
4. **Test**: `npm run test && npm run lint`
5. **Commit** with conventional commits: `feat: add new template`
6. **Push** and open a Pull Request

## Coding Standards

- **TypeScript** for all source code
- **ESLint + Prettier** for formatting
- **Conventional commits**: `feat:`, `fix:`, `docs:`, `chore:`, `test:`
- **Tests required** for new features
- **Documentation required** for public API changes

## Template Rules

1. **Never modify** files in `professional-templates/` without approval
2. All templates must include `{{DATE}}` placeholder
3. Templates must work across all three scope tiers
4. Run `make verify` to validate template integrity

## Document Filing

All docs in `000-docs/` follow the filing system: `NNN-CC-ABCD-description.md`

See `000-docs/000-DR-INDEX-standards-catalog.md` for the full spec.

## Code of Conduct

We follow the [Contributor Covenant](https://www.contributor-covenant.org/). Be respectful, inclusive, and constructive.

## Getting Help

- **Issues**: https://github.com/jeremylongshore/intent-blueprint-docs/issues
- **Discussions**: Use GitHub Discussions for questions
