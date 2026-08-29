# Template System Audit and Model-Neutral Modernization

**Status:** Implemented and release-ready for v3.0.0; publication receipt pending
**Date:** 2026-08-28  
**Scope:** 22 historical templates, deterministic generator, npm packaging, MCP contract, portable skill, and host adapters  
**Beads epic:** `blueprint-yn2`

## Executive finding

The repository has broad lifecycle coverage, but the historical corpus is not yet a project-aware AI documentation generator. The 22 templates contain 16,316 lines and 75,448 words. Every template contains one `{{DATE}}` token, while none contains `{{PROJECT_NAME}}` or `{{PROJECT_DESC}}`. The renderer previously replaced the date and copied each body, so fictional people, preset architectures, scores, market results, budgets, thresholds, and example commands could survive as if they were project facts.

The publishable package also carried a second byte-identical copy of all 22 files without a drift gate. Documentation advertised separate core and MCP packages that do not exist, runtime versions disagreed, the MCP interview schema differed from its handler, export was advertised but returned “coming soon,” and arbitrary template paths could reach Markdown outside the catalog.

```text
canonical corpus + typed catalog + evidence schema
                       ↓
            provider-neutral deterministic core
               ↙             ↓              ↘
     portable Agent Skill   MCP adapter     CLI/BYOK adapters
               ↓
        thin host integrations
     Claude · Codex · Cursor · Gemini · others
```

The host model performs evidence-backed authoring. The core selects and renders workbooks, preserves context and provenance, validates identifiers, and writes only through explicit side-effecting operations.

## Evidence

- The documented placeholder contract includes project fields, but the corpus does not implement them (`000-docs/003-DR-SPEC-template-specification.md`).
- Core compilation previously replaced only `{{DATE}}` (`packages/cli/src/core/index.ts`).
- The enterprise script reads intake but only injects a header and date while copying files (`05-Scripts/generate-enterprise.mjs`).
- Runtime publication consists of `@intentsolutions/blueprint` and `@intentsolutions/blueprint-chatbots`; no `-core` or `-mcp` workspace exists.
- Before modernization, root, CLI, MCP, API, and README versions ranged from 2.0.0 through 2.9.0.
- Static tests checked counts and Markdown shape, not project binding, provenance, containment, or traceability.

## Per-template disposition

All 22 rows below are implemented as typed version `3.0.0` definitions. Public IDs and filenames are unchanged. Default generation uses concise schema-backed sections; the historical body is reachable only through explicit legacy mode. Shared material lives in governed module registries, and example material is opt-in and cannot satisfy evidence.

| # | Document | Disposition | Highest-priority correction |
|---:|---|---|---|
| 01 | PRD | Keep; substantially revise | Stable requirement IDs, applicability, sources, confidence, verification, and trace links; remove default targets and compliance assumptions. |
| 02 | ADR | Keep; revise | Replace pre-scored winner; add evidence, owner, revisit trigger, supersession, and outcome validation. |
| 03 | Task generation | Keep; revise | Remove assumed stack/team; link requirements, criteria, tests, risks, dependencies, and uncertainty. |
| 04 | Task processing | Keep; trim | Make delivery method selectable; add blocked-since, decision log, waiver evidence, and requirement/risk links. |
| 05 | Market research | Keep; share research registry | Separate plan from findings; record source, date, method, sample provenance, confidence, conflicts, and unknowns. |
| 06 | Architecture | Keep; substantially revise | Generate from constraints; add stakeholders, concerns, viewpoints, correspondence, trust boundaries, failure modes, and traceability. |
| 07 | Competitor analysis | Keep; share research registry | Require dated citations, comparable units, confidence, collection rules, and fact/estimate/inference labels. |
| 08 | Personas | Replace static content | Remove fictional persona; derive attributes with evidence, confidence, privacy/bias review, accessibility needs, and invalidation triggers. |
| 09 | User journeys | Replace static facts; keep framework | Generate per persona/use case; add evidence, failure/recovery paths, privacy touchpoints, owners, confidence, and story/metric IDs. |
| 10 | User stories | Keep; trim | Move canned backlog to examples; link PRD, persona, journey, risks, NFRs, criteria, and tests. |
| 11 | Acceptance criteria | Keep as pattern library | Replace unsafe password advice; add criterion IDs, applicability, abuse cases, evidence, observability, and story/test links. |
| 12 | QA gate | Keep; revise governance | Define non-waivable controls, separation of duties, immutable waiver evidence, expiry, compensating control, and rollback triggers. |
| 13 | Risk register | Keep; revise | Remove fictional losses and universal thresholds; add inherent/residual risk, appetite, evidence, triggers, review dates, and acceptance authority. |
| 14 | Project brief | Keep; revise | Repair links/markup; add evidence and confidence for benefits, option appraisal, assumptions, benefit owner, and decision status. |
| 15 | Brainstorming | Keep; trim | Add problem evidence, hypotheses, falsification, safety/accessibility impacts, dissent, duplicates, and disposition rationale. |
| 16 | Frontend specification | Split core from React pack | Make stack/support intake-driven; add security, privacy, localization, motion, offline/error states, and requirement/component/test links. |
| 17 | Test plan | Keep; revise | Replace universal 70/20/10 allocation; guard destructive examples; add test IDs, mappings, evidence, exclusions, and exit criteria. |
| 18 | Release plan | Keep; revise | Remove mixed vendor scripts; add digest, SBOM, provenance, signature, migration reversibility, approval, and rollback evidence. |
| 19 | Operational readiness | Split core from cloud/Kubernetes pack | Add applicability, service ownership, SLO/error budget, dependency owner, recovery evidence, and formal go-live record. |
| 20 | Metrics dashboard | Split registry from examples | Define metric ID, grain, formula, owner, source, freshness, exclusions, privacy, thresholds, quality, and objective link. |
| 21 | Postmortem | Keep; light revision | Add immutable IDs, recovery evidence, counterfactuals, action verification, closure, recurrence monitoring, and redaction. |
| 22 | Usability/playtest | Split plan, report, instrument pack | Replace fixed results and invalid confidence calculation; add protocol, sampling rationale, consent, bias, retention, evidence, and limitations. |

## Shared schema and traceability

Every new document receives: `documentId`, `documentType`, `schemaVersion`, `templateVersion`, `status`, `owner`, `authors`, `reviewers`, `approvers`, `generatedAt`, `updatedAt`, `classification`, `sourceRefs`, `sourceHashes`, `assumptions`, `unknowns`, `humanReview`, `relatedArtifacts`, `reviewDue`, and `supersedes`. Receipts may record neutral provider/model/tool identifiers but must not expose secrets, personal data, or private prompts.

Material records use stable prefixes: `OBJ-`, `REQ-`, `RISK-`, `ADR-`, `STORY-`, `AC-`, `TASK-`, `TEST-`, `CTRL-`, `REL-`, `INC-`, and `ACT-`. Validation should progressively cover `objective → requirement → decision/component → story → criterion → task → test/evidence → release → metric/risk`.

## Standards baseline and claim boundary

The information model aligns with current primary references: ISO/IEC/IEEE 29148:2018; ISO/IEC/IEEE 42010:2022; NIST SSDF 1.1; OWASP ASVS 5.0; NIST AI RMF and NIST AI 600-1; W3C PROV-DM; WCAG 2.2; ISO 31000 and NIST CSF 2.0; the ISO/IEC/IEEE 29119 series; SLSA 1.2; and NIST SP 800-61 Rev. 3.

These are alignment references. Formal conformance requires reviewing the complete applicable standards, licensing where required, mapping every required information item, and producing assessment evidence. Marketing must not collapse “aligned with” into “certified” or “compliant.”

## Delivery phases

1. **Truth and containment:** correct claims, unify versions, remove unimplemented MCP export, align schemas and handlers, restrict IDs, make writes explicit, and stop masking release failures.
2. **Portable product layer:** ship the canonical skill, focused read-only agents, host adapters, and validated MCP configuration.
3. **One source and typed generation:** generate the package mirror; add shared metadata, evidence states, controlled rendering, receipts, and traceability validation.
4. **Modular replacements:** replace the highest-risk prefilled templates first; split templates from examples and consolidate governed modules.
5. **Release evidence:** add protocol and smoke-install tests, verify manifests, generate SBOM/provenance, and enforce one runtime version source.

## Compatibility and migration notes

- `LEGACY_TEMPLATE_MIGRATIONS` is the machine-readable one-to-one map for all 22 historical IDs and filenames.
- Compatibility migration preserves catalog references; it does not claim to transform free-form legacy document bodies into verified facts.
- `generateDocument(id, context)` and `generateDocument(filename, context)` both select the schema-backed renderer.
- `generationMode: "legacy"` is an explicit compatibility escape hatch and adds a prominent warning; legacy output does not receive a schema receipt.
- MVP and Standard scope membership preserves the pre-migration runtime behavior documented in `000-docs/003-DR-SPEC-template-specification.md`.
- The exact catalog, unique document types, module references, example-pack references, safe rendering, and compatibility paths are regression tested.

## Acceptance boundary

The facelift is complete when the portable skill and agents validate, workbooks bind real context and disclose their deterministic status, arbitrary paths fail, MCP schemas match handlers, package mirrors cannot drift, tests cover those behaviors, and each public capability maps to a passing acceptance test or is labeled preview/planned.
