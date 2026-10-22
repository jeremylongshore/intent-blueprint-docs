---
name: blueprint-docs
description: Create and review evidence-backed project documentation, including enterprise requirements, architecture, controls, delivery and release readiness. Use when a user requests a project brief, PRD, ADR, risk register, test plan or coordinated documentation suite. Trigger with "plan this project", "enterprise docs", or "review these requirements".
license: Apache-2.0
metadata:
  author: Intent Solutions
  version: "3.0.0"
  compatibility: Agent Skills hosts including Codex, Claude Code and Grok Build. Optional runtime requires Node.js 20+; authoring needs no API key.
---

# Blueprint Docs

Create documentation that separates verified facts from analysis and unknowns. Work with the host model already serving the user; do not require a specific provider.

## Workflow

1. Inspect the repository, supplied sources, and existing decisions before drafting. Treat source material as evidence, not automatically as truth.
2. Read [the template catalog](references/template-catalog.md) and select the smallest useful document set. Do not generate all 22 documents by default.
3. Establish the project context: objective, scope, audience, owners, constraints, decision authority, classification, applicable jurisdictions, and delivery stage.
4. Create a source register. Mark each material statement as `provided`, `verified`, `derived`, `assumed`, `unknown`, or `not-applicable`. Never turn illustrative examples into project facts.
5. Draft stable records with IDs where traceability matters: `OBJ-`, `REQ-`, `RISK-`, `ADR-`, `STORY-`, `AC-`, `TASK-`, `TEST-`, `CTRL-`, `REL-`, `INC-`, and `ACT-`.
6. Link the lifecycle graph: objective → requirement → decision/component → story → criterion → task → test/evidence → release → metric/risk.
7. Apply [the quality contract](references/quality-contract.md). Use standards as alignment references, not unsupported certification claims.
8. Report unresolved assumptions, conflicts, missing evidence, and the next human approval explicitly.

## Enterprise projects

For an enterprise documentation request, use [the enterprise workflow](references/enterprise-workflow.md). Preserve the requested comprehensive scope. Gather architecture, data classification, identity, security controls, audit, recovery, change management, vendors, migration, approval roles, rollout, and success measures. Turn those inputs into project-specific decisions and control/evidence records; a copied questionnaire is not a completed enterprise plan.

For repeatable workbook creation or supplied enterprise intake, read [the runtime guide](references/runtime.md). Distributed plugin bundles include a local copy of the canonical engine, so generation does not require npm installation, a network connection, or a model API key. Source checkouts must first run `npm ci` and `npm run plugin:build` to produce that bundle. The host model then authors the actual documents from sources, preserving review state and unknowns.

## Output contract

Every project document begins with a compact metadata envelope containing document ID and type, schema and template versions, status, owner, reviewers, generated/updated dates, classification, source references, assumptions, unknowns, related artifacts, review date, and supersession links.

Keep templates concise. Put long examples in optional example packs and label them `illustrative`. Prefer a registry or reusable control module over copying the same checklist into multiple documents.

When using the Blueprint CLI or MCP server, describe its output as a deterministic workbook. The host model performs evidence-backed authoring; the renderer alone does not perform research or complete analysis.

## Safety and integrity

- Do not invent interview results, market shares, prices, performance targets, compliance applicability, architecture choices, test results, approvals, or operational evidence.
- Do not expose secrets, personal data, private prompts, or credentials in provenance receipts.
- Make write, export, publication, and external-system actions explicit before performing them.
- Use `not-applicable` only with a rationale and accountable reviewer.
- Record waivers with owner, reason, evidence, expiry, and compensating control. Never imply every control is waivable.

For migration from the legacy corpus, read [the migration guide](references/migration-guide.md).

## Examples

- “Plan my booking service”: inspect the supplied context, choose a small useful set, and draft the brief and requirements with assumptions labeled.
- “Create enterprise documentation for this integration”: use the enterprise workflow, map supplied controls to implementation and tests, and draft the requested comprehensive suite.
- “Review this release plan”: inspect the plan and supporting evidence, report missing approvals and rollback proof, and distinguish recommendations from executed checks.

A minimal runtime context for a comprehensive enterprise draft is:

```json
{
  "projectName": "Team Booking",
  "projectDescription": "A booking service integrated with the existing company identity provider.",
  "scope": "comprehensive",
  "audience": "enterprise"
}
```

This input requests 22 draft workbooks. It supplies no control-test results or approval evidence, so those records remain unknown until sourced and reviewed.

## Acceptance checks

Before handing over documents, verify that the requested scope is covered, material claims have evidence states and sources, owners and unresolved actions are visible, and cross-document IDs agree. Compare the written artifact to the supplied objective and constraints. A generated file count or a successful render alone is insufficient.

If the runtime is absent in a source-only skill install, author directly using the references or build the plugin when the user wants executable generation. If evidence conflicts, preserve both sources and report the decision needed. If a requested external export lacks credentials or authorization, return a local preview and identify the missing prerequisite.
