# README KISS usability assessment

Date: 2026-10-23. Scope: `blueprint-2s0`; baseline: commit `a8e60c2` on PR #75. Companion packaging repair: `blueprint-4ef`.

## Grade

**Before: 73/100. Revised: 91/100.** These are editorial judgments from a repository-grounded cognitive walkthrough by the implementing agent. They are not scores from recruited users, measured completion times, or independent model evaluation. The rubric evaluates whether a first-time reader can understand the outcome, start, inspect a result, and ignore unnecessary setup.

| Criterion | Maximum | Before | Revised | Evidence and remaining limitation |
|---|---:|---:|---:|---|
| Clear purpose, audience, and result | 15 | 14 | 14 | Opening names the audience and deliverables; breadth still takes some explanation. |
| One obvious, actionable starting path | 25 | 17 | 22 | Starter prompt now explicitly reads the skill file. ZIP/extract/open instructions explain the local-copy prerequisite. Opening a folder still depends on the chosen assistant. |
| Plain language and manageable choices | 15 | 11 | 14 | Friendly catalog labels; advanced terminology is behind an expandable section. A 22-item catalog remains long, as requested. |
| Accurate prerequisites and commands | 20 | 18 | 18 | File-reading assistant required for the no-install authoring path; executable tooling requires Node.js. Unpublished npm version remains explicit. No fresh live authoring run in every host. |
| Inspectable examples and next step | 15 | 9 | 14 | Links to 22 current raw workbooks plus a developed fictional brief with a requirement, acceptance criterion, and planned test. No approved real-client example. |
| Progressive disclosure | 10 | 4 | 9 | Prompt and catalog remain visible; enterprise, plugin, CLI/MCP, and contributor details are expandable. The advanced section is still substantial. |
| **Total** | **100** | **73** | **91** | **Pass for a simple repository entry point; cross-host user validation remains unproven.** |

## Walkthrough evidence

These are inspection tasks performed by the agent, not observations of human participants.

1. **“What does this do for me?”** Read the title, opening sentence, audience, and list of outcomes before the first prompt. The result is a project plan and draft documents; a reader need not understand MCP or template internals.
2. **“I am on GitHub; how do I start?”** Baseline assumed a local checkout. Revised text links the repository ZIP, tells the reader to extract it and open the folder in a file-reading assistant. The prompt explicitly names `skills/blueprint-docs/SKILL.md`, which exists with its referenced resources. No package install is required to follow the instructions directly. This confirms instruction availability, not host compliance or a timed 30-second completion.
3. **“What will I get?”** Baseline linked raw workbooks dominated by Unknown fields. Revised opening links a fictional authored project brief. It shows the distinction between supplied input, derivation, assumptions, unresolved questions, and planned verification. Its metadata validates against `DocumentMetadataSchema`; it claims neither completed tests nor approval.
4. **“Which template should I use?”** The catalog suggests brief, requirements, and task plan first, then lists all 22 with plain-language purposes. Every preview remains byte-identical to the canonical renderer with the saved context. The workbook guide explains how to regenerate it.
5. **“Do I need to understand plugin installation?”** The default visible journey ends with the catalog. Advanced installation and engineering details are available through a labeled expandable section; they are not prerequisites for the starter prompt.
6. **“Does the downloaded plugin include these examples?”** Inspection found that the new README linked examples absent from the existing plugin build. The companion fix copies examples and their linked historical corpus. The actual ZIP is extracted into a temporary directory; local README/example-guide links are checked there before the existing offline enterprise runtime test.

## Improvements applied

Highest-priority friction was the missing local-copy instruction and implicit skill loading. Both are explicit now. The next priority was showing a developed draft rather than only empty workbook structure; the linked fictional brief fills that gap while preserving evidence labels. The remaining presentation change hides optional engineering detail without removing the requested template catalog.

The raw renderer previews are deliberately unedited. The developed brief is clearly labeled as authored illustration. Neither is represented as a live customer result. No install commands or vendor-specific invocation syntax were changed by this assessment.

## Validation and limits

Validation passed:

- `npm run lint` and `npm test`: 235 tests passed; three optional model evaluations skipped. This includes the extracted-ZIP link and offline enterprise runtime checks.
- `npm run verify`, `npm run skill:check`, `npx audit-harness verify`, and `git diff --check`.
- Manual Node assertions: the worked brief's metadata satisfies `DocumentMetadataSchema`; 38 local README/example links resolve; all 22 raw previews still match `renderSchemaBlueprint` byte for byte.
- The documented CLI generation command succeeds with isolated temporary output: four MVP workbooks, `index.md`, and `.metadata`. The temporary output is removed after inspection.

Static opening-copy checks protect existing expectations but do not establish usability by themselves.

The revised grade remains short of a perfect score because this is a walkthrough, not usability research. There is no measured host-by-host completion rate, independently observed user session, or public directory approval. The phrase “Start in 30 seconds” describes the intended quick-start path, not a measured service guarantee. Release publication and third-party submissions remain outside this change.
