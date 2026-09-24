/**
 * GitHub Action Generator
 * Generates GitHub Action workflows for Blueprint integration
 */

export interface ActionConfig {
  projectName: string;
  scope: 'mvp' | 'standard' | 'comprehensive';
  audience: 'startup' | 'business' | 'enterprise';
  outputDir?: string;
  createIssues?: boolean;
  onPush?: boolean;
  onPR?: boolean;
  onSchedule?: string; // cron expression
}

/**
 * Generate GitHub Action workflow for doc generation
 */
export function generateDocGenAction(config: ActionConfig): string {
  const triggers: string[] = [];

  if (config.onPush) {
    triggers.push(`  push:
    branches: [main]
    paths:
      - 'docs/**'
      - '.github/workflows/blueprint-*.yml'`);
  }

  if (config.onPR) {
    triggers.push(`  pull_request:
    branches: [main]`);
  }

  if (config.onSchedule) {
    triggers.push(`  schedule:
    - cron: '${config.onSchedule}'`);
  }

  triggers.push(`  workflow_dispatch:
    inputs:
      scope:
        description: 'Documentation scope'
        required: false
        default: '${config.scope}'
        type: choice
        options:
          - mvp
          - standard
          - comprehensive`);

  return `# Intent Blueprint Documentation Generator
# Automatically generates and updates project documentation

name: Blueprint Docs

on:
${triggers.join('\n')}

jobs:
  generate-docs:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      issues: write

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Generate Documentation
        run: |
          npx @intentsolutions/blueprint generate \\
            --name "${config.projectName}" \\
            --description "Auto-generated documentation" \\
            --scope \${{ inputs.scope || '${config.scope}' }} \\
            --audience "${config.audience}" \\
            --output "${config.outputDir || 'docs'}"

      - name: Commit Changes
        uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: "docs: update Blueprint documentation"
          file_pattern: "${config.outputDir || 'docs'}/**"
${config.createIssues ? `
      - name: Export to Issues
        if: github.event_name == 'workflow_dispatch'
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
        run: |
          npx @intentsolutions/blueprint export github \\
            --project "${config.projectName}" \\
            --token "$GITHUB_TOKEN" \\
            --owner "\${{ github.repository_owner }}" \\
            --repo "\${{ github.event.repository.name }}"
` : ''}`;
}

/**
 * Generate GitHub Action for doc sync on PR
 */
export function generatePRSyncAction(config: ActionConfig): string {
  return `# Intent Blueprint PR Documentation Check
# Validates documentation is up-to-date on PRs

name: Blueprint PR Check

on:
  pull_request:
    branches: [main]

jobs:
  check-docs:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Check Documentation
        run: |
          # Generate docs to temp directory
          npx @intentsolutions/blueprint generate \\
            --name "${config.projectName}" \\
            --description "Documentation check" \\
            --scope "${config.scope}" \\
            --output ".blueprint-check"

          # Compare with existing docs
          if [ -d "${config.outputDir || 'docs'}" ]; then
            diff -r "${config.outputDir || 'docs'}" ".blueprint-check" || echo "Documentation may need updating"
          fi

          rm -rf .blueprint-check

      - name: Comment on PR
        uses: actions/github-script@v7
        if: failure()
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '📄 **Intent Blueprint**: Documentation may be out of date. Consider regenerating with \`npx @intentsolutions/blueprint generate\`'
            })
`;
}

/**
 * Generate all Blueprint GitHub Actions
 */
export function generateAllActions(config: ActionConfig): Record<string, string> {
  return {
    'blueprint-generate.yml': generateDocGenAction(config),
    'blueprint-pr-check.yml': generatePRSyncAction(config),
  };
}
