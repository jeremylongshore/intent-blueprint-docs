# Enterprise documentation workflow

Use this mode when the user requests enterprise readiness, a comprehensive documentation suite, an integration with governance requirements, or a control/evidence assessment.

## Establish the decision context

Inspect supplied architecture, code, policies, incident records, existing requirements and stakeholder decisions. Establish the objective and scope before assuming that a technology inventory describes the business need. Ask focused questions for missing material facts; preserve supplied answers as `provided` until verified. An assertion that a control exists needs implementation and operating evidence before it becomes `verified`.

Capture these discovery topics, using the user's existing material where possible:

| Area | Evidence needed |
|---|---|
| Existing system and integration scope | Components, interfaces, owners, constraints, intended change |
| Data and jurisdiction | Classification, residency, retention, processing boundaries |
| Applicable controls | Actual obligations and applicability rationale; distinguish goals from certifications |
| Identity and access | User/service identities, permissions, provisioning, emergency access |
| Security and audit | Controls, implementation evidence, event sources, retention and reviewers |
| Availability and recovery | Agreed targets, recovery design and actual exercise results |
| Environments and change control | Promotion rules, approvals, segregation, configuration and secrets |
| Dependencies and vendors | Versions, service owners, contracts, exit and failure behavior |
| Migration and rollback | Data movement, validation, cutover conditions, recovery decision |
| Risks and decisions | Accountable owner, treatment, evidence, expiry and accepted residual risk |
| Stakeholders and release | Decision authority, required reviewers, rollout gates, communications |
| Success measures | Operational/business measures, baseline, owner and collection method |

The deterministic enterprise intake accepts 17 questionnaire answers. It records them with hashes and source references in all 22 draft workbooks. It does not infer legal applicability or prove operating controls.

## Author the requested suite

For a comprehensive request, cover all 22 types listed in the template catalog. If a type is inapplicable, give the reason and accountable reviewer rather than silently omitting it. For a narrower request, select the necessary artifacts and explain material gaps.

Use the runtime catalog's section definitions when available. Write project-specific content in the workbook sections, not just in a common introduction. For example, an identity requirement should lead to a named architecture boundary, an access-control decision, acceptance criteria, a test, and a release gate. A stated recovery target should link to an owned recovery test and its result; an untested target remains a requirement.

Maintain shared stable records instead of duplicating inconsistent prose:

- Requirement: ID, statement, source, evidence state, owner and acceptance link.
- Control: ID, applicability, implementation owner, evidence source and review status.
- Risk: ID, impact, treatment, owner, next evidence action and acceptance authority.
- Decision: ID, alternatives, rationale, constraints and consequences.
- Test/release: IDs, related requirements/controls, actual result, reviewer and release decision.

Author tasks as explicit records such as `## TASK-AUTH-1: Configure team sign-in`, followed by a description, `Priority: high`, and a subordinate `### Acceptance criteria` checklist. The GitHub, Linear and Jira adapters export these records. General headings, instructions and examples are not tasks.

## Review and provenance

Check that claims are sourced, cross-document decisions agree, requirements link to acceptance/tests, risks have owners, and release gates distinguish promised from executed checks. Never present an intake answer or a generated checklist as completed testing, certification or approval. Report unresolved unknowns with owners and next actions.

The runtime creates `.metadata/receipts/<document>.md.json` with a hash of each generated draft. Host-authored edits change the bytes and invalidate that original draft hash. Preserve it as the generation record; do not claim it attests later edits. Record subsequent authoring/review evidence separately. Generation never grants approval.
