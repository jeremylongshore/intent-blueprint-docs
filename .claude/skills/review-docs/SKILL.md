---
name: review-docs
description: |
  Review generated documentation suites for quality, completeness, accuracy, and audience fit.
  Scores documents against the Intent Solutions doc-checklist rubric across 8 weighted categories.
  Use when auditing generated docs, checking doc quality before shipping, or reviewing a doc suite.
  Trigger with "/review-docs" or "review these docs".
  Make sure to use this skill whenever reviewing or auditing documentation quality.
allowed-tools: "Read,Edit,Glob,Grep,Bash(git:*),Bash(gh:*)"
version: 1.0.0
author: Jeremy Longshore <jeremy@intentsolutions.io>
license: Apache-2.0
compatible-with: claude-code
tags: [documentation, quality, review, audit]
model: inherit
---

# Review Docs

<!-- Portions adapted from gstack (https://github.com/garrytan/gstack) -->
<!-- Original: MIT License, Copyright (c) Garry Tan -->

Reviews generated documentation for quality, completeness, and consistency using a structured
rubric. Produces a health score and actionable fix recommendations.

## Overview

After generating a documentation suite with `/new-project`, the output needs quality validation.
This skill applies the doc-checklist rubric (8 weighted categories, 100-point scale) to identify
gaps, inconsistencies, and audience-fit issues before the docs ship. Four review modes handle
different scenarios — from comprehensive audits to quick scope checks.

## Prerequisites

- Generated documentation in `completed-docs/<project>/` or equivalent
- Access to the project's professional-templates/ for structure comparison
- `review/doc-checklist.md` or `${CLAUDE_SKILL_DIR}/references/doc-checklist.md` for the rubric

## Instructions

### Step 1: Detect Review Mode

Determine the review mode from user input:

| Mode | When to Use | What It Does |
|------|-------------|--------------|
| COMPREHENSIVE | Default, full audit | All 8 rubric categories, every document |
| FOCUSED | "review this doc" (single file) | All categories on one document |
| CROSS-REFERENCE | "check consistency" | Cross-document consistency only |
| SCOPE CHECK | "does this match scope?" | Verify doc count matches declared scope (MVP/Standard/Comprehensive) |

### Step 2: Load the Rubric

Read `${CLAUDE_SKILL_DIR}/references/doc-checklist.md` for the full scoring rubric.

Key categories and weights:
- Completeness: 30%
- Accuracy: 25%
- Audience Fit: 15%
- Placeholder Resolution: 10%
- Voice & Tone: 5%
- Structure & Formatting: 5%
- Cross-Document Consistency: 5%
- Actionability: 5%

### Step 3: Run Pass 1 — Critical Review

For each document in scope:

1. **Completeness** — Compare against the template structure in `professional-templates/core/`.
   Flag any missing sections, empty placeholders ("TBD", "TODO"), or missing metadata.

2. **Accuracy** — Cross-reference technical claims against the actual codebase.
   Check version numbers, file paths, API endpoints, commands.

3. **Audience Fit** — Evaluate language complexity against declared audience.
   Startup docs shouldn't read like compliance audits.

4. **Placeholder Resolution** — Scan for unresolved `{{PLACEHOLDER}}` tokens.
   `{{DATE}}` should be replaced with YYYY-MM-DD format.

### Step 4: Run Pass 2 — Informational Review

1. **Voice & Tone** — Check for consistent voice, active language, no AI filler.
2. **Structure & Formatting** — Validate header hierarchy, table formatting, code annotations.
3. **Cross-Document Consistency** — Terminology, project name, scope alignment.
4. **Actionability** — Clear next steps, concrete decisions, mitigation strategies.

### Step 5: Score and Report

Calculate the weighted health score. Apply the auto-fix/ask heuristic:

- **AUTO-FIX**: Placeholder resolution, formatting, stale cross-references
- **ASK**: Narrative changes, section removal, audience reframing

## Output

```
Document Quality Review: N issues (X critical, Y informational)

Health Score: X.X/5.0 (Grade: A/B/C/D/F)

Scores:
  Completeness:              X/5 (30%)
  Accuracy:                  X/5 (25%)
  Audience Fit:              X/5 (15%)
  Placeholder Resolution:    X/5 (10%)
  Voice & Tone:              X/5 (5%)
  Structure & Formatting:    X/5 (5%)
  Cross-Doc Consistency:     X/5 (5%)
  Actionability:             X/5 (5%)

AUTO-FIXED:
- [doc:section] Problem → fix applied

NEEDS INPUT:
- [doc:section] Problem description
  Recommended fix: suggested fix

Verdict: Ship-ready | Needs minor rework | Needs significant rework | Regenerate
```

Thresholds: >=4.0 Ship-ready, 3.0-3.9 Minor rework, 2.0-2.9 Significant rework, <2.0 Regenerate.

## Examples

### Comprehensive Review

**Input:**
```
/review-docs completed-docs/my-saas-project/
```

**Output:**
```
Document Quality Review: 4 issues (1 critical, 3 informational)

Health Score: 4.1/5.0 (Grade: A)

AUTO-FIXED:
- [01_prd.md:Metadata] {{DATE}} unresolved → replaced with 2026-03-18

NEEDS INPUT:
- [06_architecture.md:Tech Stack] Lists "PostgreSQL" but project uses MongoDB
  Recommended fix: Update database references throughout
```

### Scope Check

**Input:**
```
/review-docs --mode scope completed-docs/quick-mvp/
```

**Output:**
```
Scope Check: MVP (4 docs expected)
  ✓ 01_prd.md
  ✓ 03_generate_tasks.md
  ✓ 14_project_brief.md
  ✗ 15_brainstorming.md — MISSING

Verdict: Incomplete — regenerate missing template
```

## Edge Cases

- If `completed-docs/` directory doesn't exist, prompt user for the doc location
- If no scope was declared, infer from document count (4=MVP, 12=Standard, 22=Comprehensive)
- Single-file review mode when user provides a specific .md path instead of a directory
- Handle both flat and nested doc directory structures

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| No docs found | Wrong path or empty directory | Ask user to confirm the output directory |
| Template not found | Missing professional-templates/ | Fall back to structure-only checks |
| Mixed scopes | Some docs from wrong scope tier | Flag scope inconsistency in report |

## Resources

- `${CLAUDE_SKILL_DIR}/references/doc-checklist.md` — Full scoring rubric with categories and weights
