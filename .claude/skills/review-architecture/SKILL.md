---
name: review-architecture
description: |
  Review architecture documentation (06_architecture.md, 02_adr.md) for technical rigor,
  completeness, and decision quality. Applies 15 cognitive patterns from experienced engineering
  managers to evaluate architecture decisions and documentation.
  Use when reviewing architecture docs, ADRs, or system design documentation.
  Trigger with "/review-architecture" or "review architecture docs".
  Make sure to use this skill whenever evaluating architecture decisions or technical design docs.
allowed-tools: "Read,Edit,Glob,Grep,Bash(git:*)"
version: 1.0.0
author: Jeremy Longshore <jeremy@intentsolutions.io>
license: Apache-2.0
compatible-with: claude-code
tags: [architecture, review, adr, technical-design]
model: inherit
---

# Review Architecture

<!-- Portions adapted from gstack (https://github.com/garrytan/gstack) -->
<!-- Original: MIT License, Copyright (c) Garry Tan -->

Reviews architecture documentation and ADRs using cognitive patterns from experienced engineering
managers. Evaluates technical rigor, decision quality, and documentation completeness.

## Overview

Architecture docs are the highest-leverage documentation in a project — they shape every
implementation decision downstream. This skill applies 15 cognitive patterns (adapted from
gstack's plan-eng-review) to evaluate whether architecture documentation is rigorous enough
to guide development. It catches common failure modes: missing trade-off analysis, unstated
assumptions, architecture-code divergence, and incomplete ADRs.

## Prerequisites

- Architecture docs in `completed-docs/<project>/` (typically `06_architecture.md`, `02_adr.md`)
- Access to the codebase for cross-referencing (if available)

## Instructions

### Step 1: Identify Architecture Documents

Scan the doc suite for architecture-relevant files:
- `06_architecture.md` — System architecture specification
- `02_adr.md` — Architecture Decision Records
- `16_frontend_spec.md` — Frontend architecture (if present)
- Any file containing "architecture", "design", or "ADR" in the name

### Step 2: Apply Cognitive Patterns

Evaluate each document against these 15 patterns from great engineering managers:

| # | Pattern | What to Check |
|---|---------|---------------|
| 1 | **State Diagnosis** | Does the doc accurately describe the current system state before proposing changes? |
| 2 | **Blast Radius Instinct** | Are failure domains identified? What breaks if this component fails? |
| 3 | **Boring by Default** | Does it prefer proven technology over novel approaches? Is novelty justified? |
| 4 | **Dependency Awareness** | Are all upstream/downstream dependencies mapped? Version constraints? |
| 5 | **Migration Path** | Is there a clear path from current state to proposed state? Rollback plan? |
| 6 | **Scale Anticipation** | Are scaling bottlenecks identified? What happens at 10x load? |
| 7 | **Security by Design** | Is the threat model explicit? Auth, data boundaries, secrets management? |
| 8 | **Observability Planning** | How will you know if it's working? Metrics, alerts, dashboards? |
| 9 | **Team Topology Fit** | Does the architecture match team structure? Conway's Law alignment? |
| 10 | **Cost Awareness** | Are infrastructure costs estimated? Cost per request/user? |
| 11 | **Data Gravity** | Where does data live? What happens when it needs to move? |
| 12 | **API Contract Rigor** | Are interfaces formally defined? Versioning strategy? Breaking change policy? |
| 13 | **Testing Strategy Alignment** | Does the architecture support the testing pyramid? Integration points? |
| 14 | **Operational Readiness** | Deployment, rollback, health checks, runbooks? |
| 15 | **Decision Reversibility** | Which decisions are one-way doors? Are they called out? |

### Step 3: ADR Quality Check

For each ADR (Architecture Decision Record):
1. **Context** — Is the problem statement clear and grounded?
2. **Decision** — Is the chosen approach explicitly stated?
3. **Alternatives** — Are rejected alternatives documented with reasons?
4. **Consequences** — Are both positive and negative consequences listed?
5. **Status** — Is the ADR status current (proposed/accepted/deprecated/superseded)?

### Step 4: Architecture-Code Alignment

If codebase access is available:
1. Compare component diagrams against actual directory structure
2. Verify stated tech stack matches `package.json` / dependency files
3. Check that described APIs match actual endpoint implementations
4. Flag any components in code not represented in architecture docs

### Step 5: Score and Report

Rate each cognitive pattern 1-5 and produce a weighted architecture health score.

## Output

```
Architecture Review: N findings

Pattern Scores:
  State Diagnosis:        X/5
  Blast Radius:           X/5
  Boring by Default:      X/5
  Dependency Awareness:   X/5
  Migration Path:         X/5
  Scale Anticipation:     X/5
  Security by Design:     X/5
  Observability:          X/5
  Team Topology Fit:      X/5
  Cost Awareness:         X/5
  Data Gravity:           X/5
  API Contract Rigor:     X/5
  Testing Alignment:      X/5
  Operational Readiness:  X/5
  Decision Reversibility: X/5

Overall: X.X/5.0

ADR Quality:
  Total ADRs: N
  Complete: N | Incomplete: N
  Missing trade-offs: [list]

Critical Findings:
- [doc:section] Finding description
  Recommended action: suggested fix

Architecture-Code Alignment:
  Matches: N | Divergences: N
  [list of divergences if any]
```

## Examples

### Full Architecture Review

**Input:**
```
/review-architecture completed-docs/my-saas/
```

**Output:**
```
Architecture Review: 6 findings

Pattern Scores:
  State Diagnosis:        4/5
  Blast Radius:           2/5  <- Missing failure domain analysis
  Boring by Default:      5/5
  ...
  Decision Reversibility: 3/5  <- One-way doors not flagged

Overall: 3.8/5.0

Critical Findings:
- [06_architecture.md:Deployment] No rollback strategy defined
  Recommended action: Add rollback procedure for each deployment stage
- [02_adr.md:ADR-003] Missing alternatives section
  Recommended action: Document at least 2 rejected alternatives with reasoning
```

## Edge Cases

- If no architecture docs exist, suggest generating them with scope "comprehensive"
- If codebase is unavailable, skip architecture-code alignment (patterns 1-15 still apply)
- Handle both single-ADR and multi-ADR formats

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| No architecture docs | MVP scope doesn't include them | Suggest upgrading to Standard or Comprehensive scope |
| Empty ADR sections | Template not filled in | Flag as critical — incomplete ADRs are worse than none |
| Codebase not accessible | Running on docs-only directory | Skip code alignment, note in report |
