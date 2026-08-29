---
name: blueprint-docs
description: Create, modernize, or review evidence-backed product and engineering documentation using the Intent Blueprint lifecycle. Use when a user asks for a PRD, architecture description, ADR, project brief, risk register, user stories, acceptance criteria, test plan, release plan, operational readiness review, postmortem, usability study, or a coordinated documentation set.
license: Apache-2.0
metadata:
  author: Intent Solutions
  version: "2.9.0"
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
