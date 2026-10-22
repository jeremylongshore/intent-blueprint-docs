# Bundled workbook runtime

The distributable plugin includes `runtime/dist/core/blueprint.mjs` beneath this skill directory, with its dependencies, historical corpus, optional examples and license notices. It runs with Node.js 20+ and uses the same engine as the CLI and MCP server. It makes no network or model API calls.

Resolve the installed skill directory using the host's skill location. Run commands with that absolute path; do not assume the user's current directory is the plugin repository. In the examples, replace `<skill-directory>` with that path.

List the 22 definitions:

```bash
node <skill-directory>/runtime/dist/core/blueprint.mjs --list
```

Create a JSON context file containing `projectName`, `projectDescription`, `scope` (`mvp`, `standard`, `comprehensive`), and `audience` (`startup`, `business`, `enterprise`). Optional library context includes `evidence`, `sourceRefs`, `sourceHashes`, `assumptions`, `unknowns`, `owner`, `reviewers`, and `traceGraph`.

```bash
node <skill-directory>/runtime/dist/core/blueprint.mjs --context /path/to/context.json
node <skill-directory>/runtime/dist/core/blueprint.mjs --context /path/to/context.json --output /path/to/docs
```

Without `--output`, the command returns JSON documents and writes no files. With `--output`, it writes workbooks, an index and generation receipts. Existing destinations are refused; use `--force` only when replacement is intended.

For comprehensive enterprise discovery, supply a Markdown intake with numbered question headings and supplied answers:

```markdown
# Enterprise Intake
### 1. Existing system and business objective
Provided description of the actual project.

### 2. Security and identity requirements
Provided controls, constraints and unresolved questions.
```

```bash
node <skill-directory>/runtime/dist/core/blueprint.mjs --enterprise-intake /path/to/intake.md --project ProjectName --output /path/to/docs
```

The engine retains answers as provided evidence linked to `enterprise-intake.md` and its hash. Keep the supplied intake alongside written output so that reference resolves. Review and author the workbooks using the enterprise workflow; deterministic generation produces a draft structure, not completed analysis.

For a source checkout, `npm run plugin:build` creates the self-contained package at `dist/plugin/blueprint-docs/` and `dist/plugin/blueprint-docs.zip`. A skill copied directly from the source tree can still guide host authoring; use the built bundle for the executable runtime.
