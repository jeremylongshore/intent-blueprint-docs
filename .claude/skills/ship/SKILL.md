---
name: ship
description: |
  Ship intent-blueprint-docs releases: validate templates, run tests, bump version,
  update changelog, create PR. Handles the full release workflow from validation to PR creation.
  Use when shipping a release, preparing a version bump, or creating a release PR.
  Trigger with "/ship" or "ship this release".
  Make sure to use this skill whenever preparing to release or publish intent-blueprint-docs.
allowed-tools: "Read,Write,Edit,Glob,Grep,Bash(git:*),Bash(gh:*),Bash(npm:*),Bash(make:*),Bash(npx:*)"
version: 1.0.0
author: Jeremy Longshore <jeremy@intentsolutions.io>
license: Apache-2.0
compatible-with: claude-code
tags: [release, shipping, versioning, changelog]
model: inherit
---

# Ship

<!-- Portions adapted from gstack (https://github.com/garrytan/gstack) -->
<!-- Original: MIT License, Copyright (c) Garry Tan -->

Full release workflow for intent-blueprint-docs: template validation, version bump,
changelog update, and PR creation.

## Overview

Shipping intent-blueprint-docs requires validating all 22 templates, ensuring the build
passes, bumping the version, writing a user-friendly changelog, and creating a clean PR.
This skill automates the entire flow, adapted from gstack's battle-tested ship workflow.
It follows the Completeness Principle — every step runs, nothing is skipped.

## Prerequisites

- On a feature branch (not main/master)
- Clean working tree (or changes staged for inclusion)
- `gh` CLI authenticated
- `make` available for template verification

## Instructions

### Step 0: Detect Base Branch

1. `gh pr view --json baseRefName -q .baseRefName` — use PR base if exists
2. `gh repo view --json defaultBranchRef -q .defaultBranchRef.name` — fallback to default
3. Final fallback: `main`

### Step 1: Check Branch State

```bash
git status
git log <base>..HEAD --oneline
```

Verify: on feature branch, commits exist, working tree is clean or changes are intentional.

### Step 2: Validate Templates

```bash
make verify
```

All 22 templates must be present in `professional-templates/core/`. If template count < 22,
abort with error listing missing templates.

### Step 3: Run Build & Tests

```bash
npm run build
npm test
```

If tests fail, stop and report. Do not proceed with a failing build.

### Step 4: Run Pre-Landing Review

Invoke `/review-docs` on any generated docs if present. For code-only changes, skip this step.

### Step 5: Detect Version Changes

Read current version from `package.json` (root) and `packages/cli/package.json`.
Check if VERSION file exists and read it.

Determine bump type from commit history:
- `feat:` commits -> minor bump
- `fix:` commits -> patch bump
- `BREAKING CHANGE` or `!:` -> major bump
- docs/chore only -> patch bump

Ask user to confirm the version bump.

### Step 6: Update CHANGELOG

Read existing CHANGELOG.md. Generate new entry from `git log <base>..HEAD --oneline`.

**Voice polish rules (from gstack):**
- Lead with what the user can now **do** — not implementation details
- "You can now..." not "Refactored the..."
- Flag and rewrite any entry that reads like a commit message
- Internal changes go in a "### For contributors" subsection
- NEVER delete or replace existing entries — only add new ones

### Step 7: Bump Version

Update version in:
1. `package.json` (root)
2. `packages/cli/package.json`
3. `VERSION` file (if exists)

### Step 8: Commit and Push

```bash
git add package.json packages/cli/package.json CHANGELOG.md VERSION
git commit -m "chore(release): prepare vX.Y.Z"
git push -u origin HEAD
```

### Step 9: Create PR

```bash
gh pr create --title "chore(release): vX.Y.Z" --body "$(cat <<'EOF'
## Summary
- Template validation: passed (22/22)
- Build: passed
- Tests: passed
- Version: X.Y.Z

## Changes
[changelog entry here]

## Checklist
- [ ] Templates validated
- [ ] Build passes
- [ ] Tests pass
- [ ] CHANGELOG updated
- [ ] Version bumped
EOF
)"
```

### Step 10: Wait for PR Checks

```bash
gh pr checks --watch
```

Report final status.

## Output

```
SHIP COMPLETE
====================================
Version: X.Y.Z
Branch: feature/...
PR: https://github.com/.../pull/N

Templates: 22/22
Build: passed
Tests: passed
CHANGELOG: Updated
PR Checks: Passing
====================================
```

## Examples

### Standard Release

**Input:**
```
/ship
```

**Output:**
```
SHIP COMPLETE
====================================
Version: 2.1.0
Branch: feat/new-templates
PR: https://github.com/intent-solutions-io/intent-blueprint-docs/pull/42

Templates: 22/22
Build: passed
Tests: passed (all passing)
CHANGELOG: Added 3 entries
PR Checks: Passing
====================================
```

## Edge Cases

- If already on main, abort with message to create a feature branch
- If PR already exists, update it instead of creating a new one
- If CHANGELOG was already updated on this branch, skip the generation step
- If no version-worthy changes exist, ask user before proceeding

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| Template validation fails | Missing templates | List missing templates, abort |
| Build fails | TypeScript errors | Show errors, abort |
| Tests fail | Failing tests | Show failures, abort |
| PR creation fails | No upstream or auth issue | Check `gh auth status` |
| Version conflict | Version already exists as git tag | Bump to next available |
