# 007 - Release and Publishing Guide

## Package Publishing

### npm Packages

Two workspace packages are publishable. The release workflow currently publishes the core product package only:

| Package | Registry | Scope |
|---------|----------|-------|
| `@intentsolutions/blueprint` | npm | CLI, library, templates, and MCP binary |
| `@intentsolutions/blueprint-chatbots` | npm | Slack and Discord adapters; separately promoted |

### Release Process

1. **Version bump**: Update the root and product package version together
2. **Changelog**: Update `CHANGELOG.md` with changes
3. **Build**: `npm run build` (all packages via Turbo)
4. **Test**: `npm run test && npm run lint`
5. **Tag**: `git tag v<package-version>` (for example, `v3.0.0`)
6. **Publish**: `npm publish --workspace=@intentsolutions/blueprint --access public --provenance`
7. **Push tags**: `git push --tags`

### Versioning

We follow [Semantic Versioning](https://semver.org/):
- **Major**: Breaking changes to CLI flags, MCP tool schemas, or core API
- **Minor**: New features, new templates, new MCP tools
- **Patch**: Bug fixes, template improvements, doc updates

### Pre-release (Beta)

Current status is **beta**. Pre-release versions use:
```
2.1.0-beta.1
```

## Template Verification

Before every release, templates are verified:

```bash
make verify
```

This checks:
- All 22 templates exist in `professional-templates/`
- All templates contain required `{{DATE}}` placeholder
- No template files are empty or corrupt

## CI/CD Pipeline

### On Push to Main
1. Lint (TypeScript + ESLint)
2. Build (all packages)
3. Test (unit + integration)
4. Template verification
5. Enterprise E2E validation

### On Release Tag
1. All CI checks pass
2. Fail-closed npm publish for `@intentsolutions/blueprint`
3. GitHub Release created

## Rollback

If a bad release is published:
```bash
# Unpublish within 72 hours
npm unpublish @intentsolutions/blueprint@2.x.x

# Or deprecate
npm deprecate @intentsolutions/blueprint@2.x.x "Known issue, use 2.x.y instead"
```
