# Plugin packaging and compatibility

Blueprint is one portable documentation skill with a bundled optional workbook engine. Enterprise authoring is a supported mode: it gathers control and operational evidence, drafts the requested suite, and preserves uncertainty and human review. It uses the host model, so there is no required provider account or separate model API key.

## Build the distributable

From a checkout with Node.js 20+ and `zip` installed:

```bash
npm ci
npm run build
npm run plugin:build
```

Artifacts:

| Artifact | Purpose |
|---|---|
| `dist/plugin/blueprint-docs/` | Complete local plugin directory |
| `dist/plugin/blueprint-docs.zip` | Plugin files at archive root, prepared for later submission |
| `dist/plugin/blueprint-docs.zip.sha256` | Checksum of the generated ZIP |
| `dist/plugin/.agents/plugins/marketplace.json` | Codex local marketplace |
| `dist/plugin/.claude-plugin/marketplace.json` | Claude-compatible local marketplace |

The ZIP contains root Agent Plugins, Codex and Claude manifests; the canonical skill and its references; icons; project documentation and license; and the canonical engine bundled with dependencies, templates, examples and third-party license notices. It includes neither credentials nor an automatically connected MCP server. Once installed, the bundled engine runs locally with Node.js and no package download.

The build embeds current source. Rebuild after changing the engine, skill, manifests or dependencies. The package is ready for host validation and later submission; it has not been accepted by any directory.

## Codex

```bash
codex plugin marketplace add ./dist/plugin
codex plugin add blueprint-docs@intent-blueprint
```

Start a new session and invoke `$blueprint-docs`. For repo-based source discovery, `.agents/plugins/marketplace.json` also exposes the root plugin. Use the generated distribution for the bundled runtime. The Codex manifest includes skill paths, listing metadata and icons; the root Agent Plugins manifest carries OpenAI presentation settings as a complete extension.

Packaging and marketplace source conventions were checked against [OpenAI's plugin packaging documentation](https://developers.openai.com/plugins/build/plugins). Local marketplace discovery and public directory approval are separate operations.

## Claude Code

For a local preview:

```bash
claude --plugin-dir ./dist/plugin/blueprint-docs
```

Invoke `/blueprint-docs:blueprint-docs`. For repository distribution, the root marketplace supports:

```text
/plugin install blueprint-docs --marketplace jeremylongshore/intent-blueprint-docs
```

That source install provides the skill; build the distribution for the bundled engine. Check the generated manifest with `claude plugin validate dist/plugin/blueprint-docs/.claude-plugin/plugin.json --strict --json`. The manifest and component layout follow [Claude's plugin reference](https://code.claude.com/docs/en/plugins-reference).

## Grok Build and other skill hosts

```bash
grok --plugin-dir ./dist/plugin/blueprint-docs
```

Invoke `/blueprint-docs`. Grok Build documents plugin-directory loading and portable skill discovery in [its skills and plugins reference](https://docs.x.ai/build/features/skills-plugins-marketplaces). This is a Grok Build integration; it does not claim that uploading the ZIP to every Grok web interface is supported.

Any Agent Skills host can also install just `skills/blueprint-docs/` from the generated directory, retaining its references and runtime. The model performs substantive authoring; deterministic rendering alone does not complete research or control testing.

## Runtime and enterprise verification

```bash
node dist/plugin/blueprint-docs/skills/blueprint-docs/runtime/dist/core/blueprint.mjs --list
node dist/plugin/blueprint-docs/skills/blueprint-docs/runtime/dist/core/blueprint.mjs \
  --enterprise-intake /path/to/enterprise-intake.md --project ProjectName --output /path/to/docs
```

The comprehensive generator retains supplied answers as provided evidence, associates the intake hash, and writes 22 workbooks with receipts. Follow the skill's enterprise workflow to author the project-specific sections and review controls, requirements, decisions, risks and release gates. No generated draft claims certification or approval.

Repository enterprise verification checks the exact catalog, input evidence, schema metadata, index and document/receipt hashes. The package test extracts the actual ZIP and runs the engine from another working directory. Native Claude validation, portable schema validation and local runtime tests establish packaging and deterministic behavior. They do not establish a successful live authoring session in every host or directory approval.

## Optional MCP

MCP is available separately from the repository build using `.mcp.json`, or from a locally installed product tarball. Use an absolute path to the built server when the client runs outside the checkout. The source tree's declared version does not imply that npm publishes it. The plugin skill and bundled runtime do not depend on npm publication.

## Scope of validation

No provider-driven model evaluations, third-party submissions, live external exports, email or bot messages are required by the packaging checks. Current supported workflows and experimental modules are identified in the README. Public submission requirements can change; recheck the intended directory before submitting this ZIP.
