# Test Audit — Intent Blueprint Docs

Date: 2026-08-29
Harness: `@intentsolutions/audit-harness@1.3.1`
Classification: monorepo, library, CLI, MCP, plugin, skill, agent
Grade: B (84/100)

## Outcome

No P0 gap blocks the schema-backed workbook release. The executable suite covers the exact 22-entry catalog, three scopes, evidence and trace rejection, compatibility lookup, example isolation, accessibility, CLI, MCP in-memory and packaged stdio protocols, npm contents, and release evidence.

## Layer assessment

| Layer | State | Evidence |
|---|---|---|
| L1 enforcement | Installed | GitHub Actions, hash manifest, escape scan, required repository gates |
| L2 static/security | Installed with advisory gaps | Oxlint, TypeScript build, npm audit, gitleaks workflow; optional OSV/markdown/link tools incomplete |
| L3 unit/fitness | Installed with advisory gaps | Vitest and exhaustive graph tests pass; no approved dependency-cruiser policy or property framework |
| L4 contract | Installed | MCP SDK protocol tests and clean-consumer stdio negotiation |
| L5 system quality | Applicable subset installed | security boundaries and generated-document accessibility; no graphical UI surface |
| L6 smoke | Installed | packed CLI/library/MCP consumer smoke |
| L7 acceptance | Installed | 22 audit dispositions, migration contract, README 30-second test, release receipt contract |

## Deterministic results

- Classification: exit 0; no unresolved classifications.
- Conformance: 10 PASS, 0 ADVISORY, 0 FAIL.
- Testing-depth audit: unit and smoke PASS; property framework advisory; per-package classification advisory.
- Security/hygiene scan: README PASS; optional-tool, link, and historical-secret findings remain advisory.
- Architecture: NOT_APPLICABLE until an engineer approves and pins an architecture rule set.
- Full repository suite before harness wiring: 190 passed, 3 intentionally skipped; CLI package: 30 passed.
- Production dependency audit: 0 vulnerabilities.

## Traceability summary

All 22 governed template definitions map one-to-one to historical public IDs and filenames. All three scopes are generated in tests. Structured evidence and lifecycle graphs are parsed at the generation boundary. The installed tarball exposes 22 templates, CLI `3.0.0`, and four functioning MCP tools over stdio.

## Advisory follow-up

The remaining gaps are recorded in `tests/TESTING.md` and should be promoted only through Beads and engineer-approved policy changes. Harness currency findings do not change pinned external-spec versions automatically.
