---
name: document-release
description: |
  Post-ship documentation sync for intent-blueprint-docs. After code changes, automatically
  updates CLAUDE.md, README, CHANGELOG, and all project docs to match what shipped. Flags
  stale documentation and applies factual corrections.
  Use when documentation is out of date after a release, or after running /ship.
  Trigger with "/document-release" or "update docs after release".
  Make sure to use this skill whenever documentation needs to be synced after code changes.
allowed-tools: "Read,Write,Edit,Glob,Grep,Bash(git:*),Bash(gh:*)"
version: 1.0.0
author: Jeremy Longshore <jeremy@intentsolutions.io>
license: Apache-2.0
compatible-with: claude-code
tags: [documentation, release, sync, changelog]
model: inherit
---

# Document Release

<!-- Portions adapted from gstack (https://github.com/garrytan/gstack) -->
<!-- Original: MIT License, Copyright (c) Garry Tan -->

Post-ship documentation update workflow. Reads all project docs, cross-references the diff,
updates docs to match what shipped, and polishes CHANGELOG voice.

## Overview

After `/ship` commits code and creates a PR, documentation often lags behind. This skill
audits every documentation file in the project, cross-references it against the diff, and
applies factual corrections automatically. Risky or subjective changes are flagged for
human review. Adapted from gstack's document-release workflow.

## Prerequisites

- On a feature branch with commits (typically run after `/ship`)
- `gh` CLI authenticated (for PR body updates)

## Instructions

### Step 0: Detect Base Branch

1. `gh pr view --json baseRefName -q .baseRefName`
2. `gh repo view --json defaultBranchRef -q .defaultBranchRef.name`
3. Fallback: `main`

### Step 1: Pre-flight & Diff Analysis

1. Verify on a feature branch (abort if on main/master)
2. Gather context:
   ```bash
   git diff <base>...HEAD --stat
   git log <base>..HEAD --oneline
   git diff <base>...HEAD --name-only
   ```
3. Discover all documentation files:
   - `*.md` files in root and first two directory levels
   - Exclude: `.git/`, `node_modules/`, `completed-docs/`, `99-Archive/`
4. Classify changes: new features, changed behavior, removed functionality, infrastructure

### Step 2: Per-File Documentation Audit

Read each documentation file and cross-reference against the diff:

**README.md:**
- Features and capabilities match the diff?
- Install/setup instructions still valid?
- Examples and demos accurate?

**CLAUDE.md:**
- Project structure section matches actual file tree?
- Listed commands and scripts accurate?
- Build/test instructions match package.json?

**CHANGELOG.md:**
- Latest entry covers all changes on this branch?
- Voice is user-forward, not commit-message style?

**000-docs/ files:**
- Cross-reference against diff for stale content
- Check file paths and version references

**Any other .md files:**
- Read, determine purpose, check against diff

Classify updates as:
- **Auto-update** — Factual corrections clearly from the diff
- **Ask user** — Narrative changes, section removal, large rewrites

### Step 3: Apply Auto-Updates

Make factual corrections using Edit tool. For each change, output a one-line summary:
"README.md: updated template count from 20 to 22"

**Never auto-update:** README introduction, project positioning, security model descriptions.

### Step 4: Ask About Risky Changes

For each risky update, ask user with options including "Skip — leave as-is."

### Step 5: CHANGELOG Voice Polish

**CRITICAL — NEVER CLOBBER CHANGELOG ENTRIES.**

Only polish wording within existing entries. Never delete, reorder, or replace.
- "You can now..." not "Refactored the..."
- Lead with what the user can do, not implementation details
- Use Edit tool with exact old_string matches — never Write to overwrite

### Step 6: Cross-Doc Consistency Check

1. README feature list matches CLAUDE.md description?
2. CHANGELOG version matches VERSION file?
3. Every doc file reachable from README or CLAUDE.md?
4. Auto-fix factual inconsistencies, ask about narrative contradictions

### Step 7: Commit & Output

If no files were modified: "All documentation is up to date."

Otherwise:
1. Stage modified docs by name (never `git add -A`)
2. Commit: `docs: update project documentation for vX.Y.Z`
3. Push to current branch
4. Update PR body with documentation section (if PR exists)

## Output

```
Documentation health:
  README.md        [Updated] (added new skill to feature list)
  CLAUDE.md        [Current] (no changes needed)
  CHANGELOG.md     [Voice polished] (3 entries reworded)
  CONTRIBUTING.md  [Updated] (fixed build command)
  000-docs/        [Current] (all 10 docs consistent)
  VERSION          [Already bumped] (v2.1.0 by /ship)
```

## Examples

### After a Feature Release

**Input:**
```
/document-release
```

**Output:**
```
Analyzing 8 files changed across 5 commits. Found 15 documentation files to review.

Documentation health:
  README.md        [Updated] (added /review-docs to skills table, updated count 4->5)
  CLAUDE.md        [Updated] (added .claude/skills/ to project structure)
  CHANGELOG.md     [Voice polished] (2 entries reworded for user-forward voice)
  CONTRIBUTING.md  [Current] (no changes needed)

Committed: docs: update project documentation for v2.1.0
Pushed to: feat/gstack-integration
PR body updated with Documentation section.
```

## Edge Cases

- If on main branch, abort
- If no PR exists, skip PR body update
- If CHANGELOG was not modified on this branch, skip voice polish
- If VERSION doesn't exist, skip version checks

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| On main branch | Wrong branch | Abort with message |
| No changes to commit | Docs already current | Output "up to date" message |
| PR body update fails | No PR or auth issue | Warn and continue (changes are in commit) |
| CHANGELOG clobbered | Write tool used instead of Edit | Restore from git and re-apply with Edit |
