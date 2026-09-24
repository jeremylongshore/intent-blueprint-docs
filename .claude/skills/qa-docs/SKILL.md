---
name: qa-docs
description: |
  Systematically audit generated documentation quality with a structured health score.
  Produces a report-only quality assessment — identifies issues but does not fix them.
  Scores Completeness, Consistency, Accuracy, Audience-Fit, and Actionability.
  Use when auditing doc quality, running a QA pass on generated docs, or checking doc health.
  Trigger with "/qa-docs" or "audit doc quality".
  Make sure to use this skill whenever performing quality assurance on documentation output.
allowed-tools: "Read,Glob,Grep"
version: 1.0.0
author: Jeremy Longshore <jeremy@intentsolutions.io>
license: Apache-2.0
compatible-with: claude-code
tags: [qa, documentation, audit, quality]
model: inherit
---

# QA Docs

<!-- Portions adapted from gstack (https://github.com/garrytan/gstack) -->
<!-- Original: MIT License, Copyright (c) Garry Tan -->

Report-only documentation quality audit. Identifies issues systematically without fixing them.
Produces a structured health score across 5 dimensions.

## Overview

Unlike `/review-docs` which auto-fixes issues, `/qa-docs` is a pure audit — it scores
documentation quality and produces a report without making any changes. This is useful for
CI quality gates, pre-release audits, and tracking doc quality over time. Adapted from
gstack's qa-only workflow which emphasizes evidence-based assessment over intervention.

## Prerequisites

- Generated documentation in `completed-docs/<project>/` or equivalent
- Templates in `professional-templates/core/` for structure comparison

## Instructions

### Step 1: Determine Audit Scope

Detect mode from user input:
- **Full** (default) — Audit every document in the suite
- **Quick** — Score only the 5 health dimensions without per-document detail
- **Diff-aware** — Focus on documents affected by recent changes

### Step 2: Inventory Documents

List all `.md` files in the target directory. For each file, record:
- Filename and path
- Word count
- Section count (H2 headers)
- Placeholder status (any unresolved `{{...}}` tokens)

### Step 3: Score Each Dimension

Rate each dimension 1-10 with evidence:

**Completeness (weight: 30%)**
- All expected sections present vs template?
- No empty "TBD" / "TODO" placeholders?
- Required metadata populated?
- Cross-references resolve?

**Consistency (weight: 25%)**
- Terminology uniform across all docs?
- Project name spelled identically everywhere?
- Version numbers aligned?
- Scope tier reflected consistently?

**Accuracy (weight: 20%)**
- Technical claims verifiable against codebase?
- File paths exist?
- Commands are runnable?
- API references correct?

**Audience-Fit (weight: 15%)**
- Language complexity matches declared audience?
- Jargon appropriate for tier (startup vs enterprise)?
- Assumptions explicit?

**Actionability (weight: 10%)**
- Clear "what to do next" guidance?
- Decisions framed as choices with trade-offs?
- Risk mitigations included, not just descriptions?
- Task breakdowns estimable and assignable?

### Step 4: Generate Health Report

Calculate weighted health score. Classify each finding with severity.

## Output

```
Documentation Quality Audit
====================================
Project: <name>
Scope: <MVP|Standard|Comprehensive>
Documents: N files, N total words

Health Score: XX/100

Dimension Scores:
  Completeness:   XX/10 (30%) — [evidence summary]
  Consistency:    XX/10 (25%) — [evidence summary]
  Accuracy:       XX/10 (20%) — [evidence summary]
  Audience-Fit:   XX/10 (15%) — [evidence summary]
  Actionability:  XX/10 (10%) — [evidence summary]

Findings (N total):

  CRITICAL (N):
  - [doc:section] Finding with evidence

  WARNING (N):
  - [doc:section] Finding with evidence

  INFO (N):
  - [doc:section] Finding with evidence

Per-Document Summary:
  01_prd.md           __________ 9/10
  02_adr.md           ________   8/10
  06_architecture.md  ______     6/10  <- needs attention

Recommendation: [Ship-ready | Needs rework | Regenerate]
====================================
```

## Examples

### Full Audit

**Input:**
```
/qa-docs completed-docs/my-saas/
```

**Output:**
```
Documentation Quality Audit
====================================
Project: my-saas
Scope: Standard (12 docs)
Documents: 12 files, 45,230 total words

Health Score: 82/100

Dimension Scores:
  Completeness:   9/10 (30%) — All sections present, 1 empty placeholder in 05_market_research.md
  Consistency:    8/10 (25%) — "API" vs "api" inconsistency in 3 docs
  Accuracy:       7/10 (20%) — 2 file paths reference nonexistent directories
  Audience-Fit:   9/10 (15%) — Language appropriate for startup audience
  Actionability:  8/10 (10%) — 3 risk items missing mitigation strategies

Recommendation: Ship-ready with minor fixes
====================================
```

## Edge Cases

- If target directory is empty, report "No documents found" and suggest running /new-project
- If templates directory is unavailable, skip structure comparison
- For single-file audit, score all 5 dimensions on that one file
- Handle both flat and nested directory structures

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| No docs found | Wrong path | Ask user to confirm directory |
| Template mismatch | Custom templates used | Note in report, skip structure comparison |
| Unreadable file | Permission or encoding issue | Skip file, note in report |
