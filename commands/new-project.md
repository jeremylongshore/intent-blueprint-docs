# /new-project — vibe-prd guided generator
<!-- AUTO-GENERATED from new-project.md.tmpl — do not edit directly -->
<!-- Regenerate: npx tsx scripts/gen-skill-docs.ts -->

## Preamble (run first)

```bash
_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
echo "BRANCH: $_BRANCH"
```

If `_BRANCH` is `main` or `master`, **abort**: "You're on the default branch. Switch to a feature branch first."

## Base Branch Detection

1. Check if a PR already exists for this branch:
   `gh pr view --json baseRefName -q .baseRefName`
   If this succeeds, use the printed branch name as the base branch.

2. If no PR exists (command fails), detect the repo's default branch:
   `gh repo view --json defaultBranchRef -q .defaultBranchRef.name`

3. If both commands fail, fall back to `main`.

Print the detected base branch name. In every subsequent `git diff`, `git log`,
and `gh pr create` command, substitute the detected branch name wherever
the instructions say "the base branch."


## Available Templates (22)

| # | Template | Category | Description |
|---|----------|----------|-------------|
| 01 | `01_prd.md` | Product & Strategy | Product Requirements Document |
| 02 | `02_adr.md` | Technical Architecture | Architecture Decision Records |
| 03 | `03_generate_tasks.md` | Development Workflow | Task generation framework |
| 04 | `04_process_task_list.md` | Development Workflow | Task processing workflow |
| 05 | `05_market_research.md` | Product & Strategy | Market analysis |
| 06 | `06_architecture.md` | Technical Architecture | System architecture specification |
| 07 | `07_competitor_analysis.md` | Product & Strategy | Competitive landscape analysis |
| 08 | `08_personas.md` | User Experience | User personas |
| 09 | `09_user_journeys.md` | User Experience | User journey mapping |
| 10 | `10_user_stories.md` | User Experience | User stories |
| 11 | `11_acceptance_criteria.md` | Development Workflow | Acceptance criteria specification |
| 12 | `12_qa_gate.md` | Quality Assurance | QA gate process |
| 13 | `13_risk_register.md` | Quality Assurance | Risk management register |
| 14 | `14_project_brief.md` | Product & Strategy | Project brief overview |
| 15 | `15_brainstorming.md` | Product & Strategy | Brainstorming session output |
| 16 | `16_frontend_spec.md` | Technical Architecture | Frontend specification |
| 17 | `17_test_plan.md` | Quality Assurance | Testing strategy |
| 18 | `18_release_plan.md` | Development Workflow | Release management plan |
| 19 | `19_operational_readiness.md` | Quality Assurance | Operational readiness checklist |
| 20 | `20_metrics_dashboard.md` | Development Workflow | KPI & metrics framework |
| 21 | `21_postmortem.md` | Quality Assurance | Post-implementation review |
| 22 | `22_playtest_usability.md` | Quality Assurance | Usability testing plan |

**Scopes:**
- **MVP** (4 docs): 01, 03, 14, 15
- **Standard** (12 docs): MVP + 02, 05, 08, 09, 10, 11, 16, 17
- **Comprehensive** (22 docs): All templates


**Mode:** You are Claude Code with terminal access. Run commands locally. Be idempotent.

## Flow
1. Ask three questions:
   - starting_point: "greenfield" or "brownfield"
   - audience: "startup", "business", or "enterprise"
   - scope: "mvp" (4 docs), "standard" (12 docs), or "comprehensive" (22 docs)
2. Set PROJECT_NAME from user input (kebab-case).
3. Generate docs from the repo's professional-templates/ into completed-docs/$PROJECT_NAME/.
4. Replace {{DATE}} with today's date (YYYY-MM-DD).
5. Create index.md with links and a summary.
6. Print the output path and open the folder.

## Implementation (run these on acceptance)
- Ensure repo path:
  cd "$(git rev-parse --show-toplevel)"

- Determine template list:
  case "$scope" in
    mvp)        TEMPLATES="01_prd.md 03_generate_tasks.md 14_project_brief.md 15_brainstorming.md" ;;
    standard)   TEMPLATES="01_prd.md 02_adr.md 03_generate_tasks.md 05_market_research.md 08_personas.md 09_user_journeys.md 10_user_stories.md 11_acceptance_criteria.md 14_project_brief.md 15_brainstorming.md 16_frontend_spec.md 17_test_plan.md" ;;
    comprehensive) TEMPLATES="$(find professional-templates -maxdepth 1 -type f -name '*.md' | sed 's#^.*/##' | sort)" ;;
    *)
      echo "Invalid scope: $scope" >&2
      exit 1
      ;;
  esac

- Create target dir:
  OUT="completed-docs/$PROJECT_NAME"
  mkdir -p "$OUT/.metadata"

- Copy and stamp:
  for f in $TEMPLATES; do
    sed "s/{{DATE}}/$(date +%F)/g" "professional-templates/$f" > "$OUT/$f"
  done

- Index:
  {
    echo "# $PROJECT_NAME — Documentation Index"
    echo
    echo "**Generated:** $(date +%F)"
    echo "**Path:** $OUT"
    echo
    echo "## Files"
    for f in $TEMPLATES; do
      echo "- [$f]($f)"
    done
    echo
    echo "## Classification"
    echo "- Starting Point: $starting_point"
    echo "- Audience: $audience"
    echo "- Scope: $scope"
  } > "$OUT/index.md"

- Metadata:
  {
    echo "{"
    echo "  \"starting_point\": \"$starting_point\","
    echo "  \"audience\": \"$audience\","
    echo "  \"scope\": \"$scope\","
    echo "  \"project_name\": \"$PROJECT_NAME\","
    echo "  \"generated_at\": \"$(date -Iseconds)\""
    echo "}"
  } > "$OUT/.metadata/generation.json"

- Finish:
  echo "Generated: $OUT"
