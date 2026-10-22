# Contributing to Intent Blueprint Docs

Thank you for your interest in contributing. This guide covers the process for submitting changes.

## Getting Started

```bash
git clone https://github.com/jeremylongshore/intent-blueprint-docs.git
cd intent-blueprint-docs
npm ci
npm run build
npm run test
```

## Development Workflow

1. Fork the repository
2. Create a feature branch from `main`: `git checkout -b feature/my-change`
3. Make your changes
4. Run checks: `npm run lint && npm run test && make verify`
5. Commit with conventional commits: `feat(templates): add fintech compliance section`
6. Push and open a pull request

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

Types: feat, fix, docs, refactor, test, chore
Scopes: templates, cli, mcp, core, plugins, ci
```

## What We Accept

- Bug fixes with reproduction steps
- New templates or template improvements
- Plugin contributions
- Documentation improvements
- Test coverage improvements

## What Needs Discussion First

Open an issue before submitting PRs for:

- New template categories
- Breaking API changes
- New dependencies
- Architecture changes

## Templates

When modifying templates:

- All 22 templates must remain present (`make verify`)
- Required placeholders (`{{DATE}}`, etc.) must be preserved
- Follow the existing Markdown structure
- Test with all three scopes: MVP, Standard, Comprehensive

## Code Style

- TypeScript with strict mode
- Oxlint and TypeScript (enforced by CI)
- Root checks in `test/`; CLI behavioral checks in `packages/cli/test/`

## Review Process

1. CI must pass (lint, build, test, template verification)
2. One maintainer approval required
3. Squash merge to `main`

## License

By contributing, you agree that your contributions will be licensed under the Apache 2.0 License.
