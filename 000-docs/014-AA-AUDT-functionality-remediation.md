# Functionality remediation evidence

Observed 2026-10-22 UTC, following the historical repository audit at `1c5913b`. This record distinguishes the repaired source and local plugin from npm publication and third-party directory approval.

## Repaired behavior

| Bead | Result |
|---|---|
| `blueprint-owe` | README and repository MCP adapters use the tested local build; Gemini and Cursor agree. Version checks enforce local entrypoints and consistent manifests. Old release-task notes acknowledge that PR #45 merged; npm publication remains separate release work. |
| `blueprint-2t8` | Enterprise discovery routes through the canonical engine. Supplied answers and their source hash appear in 22 schema drafts; receipts persist. Verification checks evidence, metadata, index and hashes. Existing output is protected unless replacement is requested. |
| `blueprint-828` | GitHub, Linear and Jira use explicit `TASK-`/`STORY-` records. Blank workbooks yield no tasks or invented cycles/sprints. Fixtures preserve real titles, descriptions, priorities and acceptance criteria. |
| `blueprint-1jr` | Current root, email helper and PDF helper dependency audits report zero vulnerabilities. The unused browser-based PDF dependency was removed; the actual renderer uses Pandoc/LaTeX. Nodemailer 10 typing and local delivery boundaries are tested. |
| `blueprint-gbb` | Adaptive CLI questions recalculate after each answer; supplied responses survive into evidence. Invalid scope fails without output. `npm test` builds first and passes on a fresh lockfile install. |
| `blueprint-vdh` | Supported/experimental feature claims are reconciled. REST exposes the canonical catalog and rejects unsupported webhooks. Receipts persist. Bot ZIP generation/cleanup has behavioral checks; authenticated service operation is not inferred. |
| `blueprint-l34` | A self-contained plugin ZIP includes the portable enterprise skill and shared engine. The extracted artifact runs outside the checkout without package installation. Native Codex installation succeeds; Claude strict validation and portable manifest schema validation pass. |

## Validation

- A fresh source copy with no `dist` or `node_modules` passed `npm ci --ignore-scripts`, followed directly by `npm test`: 195 root, 38 CLI and 2 chatbot tests passed. Three optional model evaluations were skipped.
- The clean copy passed corpus, mirror and version/adapter verification. Local lint, generated-command freshness and harness hash verification passed.
- The enterprise fixture runner generated and verified 22 workbooks and 22 receipts. Integration tests demonstrate input-sensitive output, collision protection and detection of an edited document.
- The extracted ZIP returned the 22-entry catalog, previewed enterprise output without writes, generated output with receipts and refused an unintended overwrite.
- The actual npm tarball was installed in an isolated consumer and passed library, CLI and four-tool stdio MCP smoke testing.
- Root npm audit, the standalone email lockfile audit, and the PDF helper audit returned zero findings. This supersedes the historical audit's current-use security conclusion; it is not a blanket exploitability guarantee.
- Root Agent Plugins `plugin.json` passed its published JSON Schema. The portable skill passed the skill-creator structural check. The local marketplace rubric gives the skill a C advisory grade; that rubric asks for additional top-level fields beyond the portable skill format and is not a host-directory approval.
- `claude plugin validate dist/plugin/blueprint-docs --strict --json` passed without errors or warnings. Codex installed and listed `blueprint-docs@intent-blueprint` version 3.0.0 as enabled. A new session is required to load the installed skill.
- Harness conformance reported 11 passes, one advisory and no failures. Its marketplace schema is unavailable in this harness version; marketplace behavior was additionally checked through native host tooling. Testing-depth property/per-package advisories remain explicit.

The hash manifest was refreshed for the authorized package-script and enterprise CI changes. Test thresholds and enforcement were not lowered. Enterprise CODEOWNERS now also covers real `05-Scripts/` paths instead of relying only on the `scripts/` symlink.

## Artifacts and boundaries

Build with `npm ci`, `npm run build` and `npm run plugin:build`. The complete plugin is `dist/plugin/blueprint-docs/`; its upload ZIP and checksum sit alongside it. The [packaging guide](013-DR-GUID-plugin-packaging.md) explains host installation and verification limits.

The host model authors substantive enterprise analysis using the bundled skill. Deterministic generation creates evidence-backed draft structures; it does not prove controls, perform research, certify compliance or approve releases. Live Grok/Claude model authoring sessions, authenticated external exports, email delivery, PDF rendering and publication were not exercised. No directory submission or npm release was performed.

The requested README simplicity grade is deliberately retained as separate follow-up `blueprint-2s0`: evaluate the first-time-user journey against KISS criteria, including a single obvious start, minimal jargon and accurate setup. Passing a static README text check is not that usability assessment.
