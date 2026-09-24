# Document Quality Review Checklist

## Instructions

Review generated documentation for the issues listed below. Be specific — cite the document and section. Skip anything that's fine. Only flag real problems.

**Two-pass review:**
- **Pass 1 (CRITICAL):** Accuracy and completeness — the document must be factually correct and cover all required sections.
- **Pass 2 (INFORMATIONAL):** Voice, consistency, and polish — the document should read well and follow conventions.

**Output format:**

```text
Document Quality Review: N issues (X critical, Y informational)

**AUTO-FIXED:**
- [doc:section] Problem → fix applied

**NEEDS INPUT:**
- [doc:section] Problem description
  Recommended fix: suggested fix
```

If no issues found: `Document Quality Review: No issues found.`

---

## Review Categories

### Pass 1 — CRITICAL

#### Completeness
- All required sections present (compare against template structure)
- No empty placeholder sections (e.g., "TBD", "TODO", "Fill in later")
- Required metadata fields populated (project name, date, version, author)
- Cross-references to other documents resolve correctly

#### Accuracy
- Technical claims match the actual codebase (architecture, tech stack, dependencies)
- Version numbers consistent across all documents
- File paths and directory references are valid
- API endpoints, commands, and code examples are correct and runnable

#### Audience Fit
- Language complexity matches declared audience (startup vs enterprise)
- Jargon level appropriate — startup docs shouldn't read like compliance audits
- Assumptions about reader knowledge are explicit, not implicit
- Action items are concrete enough for the audience to execute

#### Placeholder Resolution
- No unresolved `{{PLACEHOLDER}}` tokens in generated output
- `{{DATE}}` replaced with actual date (YYYY-MM-DD format)
- Project-specific values substituted correctly (name, description, scope)
- Template instructions removed from final output (e.g., "Replace this with...")

### Pass 2 — INFORMATIONAL

#### Voice & Tone
- Consistent voice across all documents in the suite
- Active voice preferred over passive
- Actionable language: "Do X" not "X should be done"
- No AI-generated filler ("In today's fast-paced...", "It's important to note...")

#### Structure & Formatting
- Headers follow logical hierarchy (H1 → H2 → H3, no skips)
- Tables are well-formed and readable
- Code blocks have language annotations
- Lists are parallel in structure

#### Cross-Document Consistency
- Terminology consistent across documents (don't call it "API" in one doc and "service" in another)
- Project name spelled identically everywhere
- Scope decisions reflected consistently (MVP docs shouldn't reference enterprise features)
- Timeline/milestone references aligned across planning docs

#### Actionability
- Each document has clear "what to do next" guidance
- Decisions are framed as choices with trade-offs, not open questions
- Risk items have mitigation strategies, not just descriptions
- Task breakdowns are granular enough to estimate and assign

---

## Severity Classification

```text
CRITICAL (highest severity):          INFORMATIONAL (lower severity):
├─ Completeness                       ├─ Voice & Tone
├─ Accuracy                           ├─ Structure & Formatting
├─ Audience Fit                       ├─ Cross-Document Consistency
└─ Placeholder Resolution             └─ Actionability
```

---

## Scoring Rubric

Rate each category 1-5:

| Score | Meaning |
|-------|---------|
| 5 | Excellent — no issues, ready to ship |
| 4 | Good — minor gaps, easily fixable |
| 3 | Adequate — some rework needed |
| 2 | Poor — significant gaps |
| 1 | Unusable — fundamental problems |

**Health Score** = weighted average:
- Completeness: 30%
- Accuracy: 25%
- Audience Fit: 15%
- Placeholder Resolution: 10%
- Voice & Tone: 5%
- Structure & Formatting: 5%
- Cross-Document Consistency: 5%
- Actionability: 5%

**Thresholds:**
- >= 4.0: Ship-ready
- 3.0-3.9: Needs minor rework
- 2.0-2.9: Needs significant rework
- < 2.0: Regenerate from scratch
