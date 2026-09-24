# Testing Context — intent-blueprint-docs
<!-- TESTING.md schema v1 (see audit-tests/references/testing-md-spec.md) -->
<!-- Managed by audit-tests + implement-tests. Policy defaults below require engineer review. -->

## Classification (policy)

Repo type: monorepo (library + CLI + MCP + plugin + skill + agent)
Primary language(s): TypeScript, JavaScript, shell, Markdown
Applicable layers: L1, L2, L3, L4-contract, L5-security, L6-smoke, L7-acceptance
Waived layers: L5-accessibility UI automation and L6-visual (no graphical product surface)
Compliance overlay: none

## Thresholds (policy, hash-pinned)

coverage.line: 80
coverage.branch: 70
mutation.kill_rate: 70
crap.prod_max: 30
crap.test_max: 15
crap.project_avg: 10
flaky.tolerance: 0/3runs
test.complexity_ceiling: 15

## Installed gates (observational)

L0: @intentsolutions/audit-harness@1.3.1
L1: GitHub Actions build matrix, required repository checks, harness hash verification, escape scan
L2: Oxlint, TypeScript compiler, npm audit, gitleaks workflow, schema and document validators
L3: Vitest unit, exhaustive lifecycle-pair, duplicate, cycle, and safe-default tests
L4-contract: MCP SDK in-memory protocol tests and installed-package stdio negotiation
L5-security: path containment, explicit write boundary, source/evidence validation, dependency audit
L6-smoke: clean-consumer npm tarball, CLI binary, MCP binary, and 22-template generation smoke
L7-acceptance: 22-row migration mapping, README 30-second path, accessibility and release-evidence tests

## Frameworks (observational)

unit: Vitest 4.x
typecheck: TypeScript 5.x
contract: @modelcontextprotocol/sdk 1.x
package: npm pack clean-consumer smoke
security: npm audit + repository gitleaks workflow
enforcement: @intentsolutions/audit-harness 1.3.1
lint: Oxlint 1.x (correctness rules; legacy unused-variable debt excluded)

## Last audit (observational)

date: 2026-08-29
grade: B (84/100)
auditor: audit-tests + @intentsolutions/audit-harness 1.3.1
p0_gaps: 0
p1_gaps: 5
  - architecture fitness tool is not configured; harness reports NOT_APPLICABLE
  - property-based framework is absent; exhaustive lifecycle combinatorics provide bounded coverage
  - optional OSV, markdownlint, and behavioral j-rig tools are unavailable locally
  - legacy documentation contains broken-link findings outside the schema-corpus migration
  - harness gitleaks history scan reports nine candidate historical findings; the required PR gitleaks workflow remains authoritative
p2_gaps: stale upstream-currency pins require human re-verification and remain advisory

## Traceability (observational, updated by audit-tests)

template_dispositions.total: 22
template_dispositions.implemented: 22
template_dispositions.generation_tested: 22
scopes.tested: MVP 4, Standard 12, Comprehensive 22
adapters.tested: library, CLI, MCP in-memory, MCP stdio, npm packed consumer
release_evidence: checksum, CycloneDX SBOM, receipt, GitHub attestation, npm provenance

## Hash manifest

version: 1
last_init: 2026-08-29 by implement-tests handoff
protected_files:
  - tests/TESTING.md#policy
  - features/*.feature
  - architecture-rule configuration when engineer-approved
