import { parseTaskRecords } from '../tasks.js';
/**
 * GitHub Exporter
 * Converts Blueprint documents to GitHub artifacts (issues, milestones, templates)
 */

import { GitHubClient } from './client.js';
import type {
  GitHubConfig,
  ExportResult,
  ExportOptions,
  TaskBreakdown,
  ReleasePhase,
  GitHubLabel,
} from './types.js';
import {
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  STANDARD_LABELS,
} from './types.js';
import type { GeneratedDocument, TemplateContext } from '../../core/index.js';

export class GitHubExporter {
  private client: GitHubClient;
  private options: ExportOptions;

  constructor(config: GitHubConfig, options: ExportOptions = {}) {
    this.client = new GitHubClient(config);
    this.options = {
      createLabels: true,
      createMilestones: true,
      createIssues: true,
      createPRTemplates: true,
      dryRun: false,
      ...options,
    };
  }

  /**
   * Export generated documents to GitHub
   */
  async export(
    documents: GeneratedDocument[],
    context: TemplateContext
  ): Promise<ExportResult> {
    const result: ExportResult = {
      success: true,
      created: { issues: 0, milestones: 0, labels: 0, prTemplates: 0 },
      errors: [],
      urls: [],
    };

    // Verify connection
    const verification = await this.client.verify();
    if (!verification.valid) {
      result.success = false;
      result.errors.push(`GitHub connection failed: ${verification.error}`);
      return result;
    }

    // Create labels
    if (this.options.createLabels && !this.options.dryRun) {
      try {
        const allLabels = this.getAllLabels(context.projectName);
        const { created } = await this.client.ensureLabels(allLabels);
        result.created.labels = created;
      } catch (error) {
        result.errors.push(`Failed to create labels: ${error}`);
      }
    }

    // Extract tasks from documents
    const tasks = this.extractTasks(documents);
    const phases = this.extractPhases(documents);

    // Create milestones from release phases
    let milestoneMap: Map<string, number> = new Map();
    if (this.options.createMilestones && phases.length > 0 && !this.options.dryRun) {
      try {
        const milestones = await this.client.createMilestonesFromPhases(phases);
        for (const m of milestones) {
          milestoneMap.set(m.title, m.number);
        }
        result.created.milestones = milestones.length;
      } catch (error) {
        result.errors.push(`Failed to create milestones: ${error}`);
      }
    }

    // Create issues from tasks
    if (this.options.createIssues && tasks.length > 0 && !this.options.dryRun) {
      try {
        const issues = await this.client.createIssuesFromTasks(tasks, {
          labelPrefix: this.options.labelPrefix,
        });
        result.created.issues = issues.length;
        result.urls = issues.map((i) => i.url);
      } catch (error) {
        result.errors.push(`Failed to create issues: ${error}`);
      }
    }

    // Create PR templates
    if (this.options.createPRTemplates && !this.options.dryRun) {
      try {
        const templates = this.generatePRTemplates(context);
        const created = await this.client.createPRTemplates(templates);
        result.created.prTemplates = created;
      } catch (error) {
        result.errors.push(`Failed to create PR templates: ${error}`);
      }
    }

    result.success = result.errors.length === 0;
    return result;
  }

  /**
   * Get all labels to create
   */
  private getAllLabels(projectName: string): GitHubLabel[] {
    const labels: GitHubLabel[] = [...STANDARD_LABELS];

    // Add category labels
    for (const label of Object.values(CATEGORY_LABELS)) {
      labels.push(label);
    }

    // Add priority labels
    for (const label of Object.values(PRIORITY_LABELS)) {
      labels.push(label);
    }

    // Add project-specific label
    if (this.options.labelPrefix) {
      labels.push({
        name: this.options.labelPrefix,
        color: '7057FF',
        description: `${projectName} project`,
      });
    }

    return labels;
  }

  /**
   * Extract tasks from generated documents
   */
  private extractTasks(documents: GeneratedDocument[]): TaskBreakdown[] {
    const tasks: TaskBreakdown[] = [];

    for (const doc of documents) {
      tasks.push(...this.parseTasksFromMarkdown(doc.content, doc.category));
    }

    return tasks;
  }

  /**
   * Parse tasks from markdown content
   */
  private parseTasksFromMarkdown(content: string, category: string): TaskBreakdown[] {
    return parseTaskRecords(content).map(task => ({
      title: task.title, description: task.description, priority: task.priority,
      category, acceptanceCriteria: task.acceptanceCriteria,
    }));
  }

  /**
   * Extract release phases from documents
   */
  private extractPhases(documents: GeneratedDocument[]): ReleasePhase[] {
    const phases: ReleasePhase[] = [];

    for (const doc of documents) {
      if (doc.name.toLowerCase().includes('release')) {
        const extracted = this.parsePhasesFromMarkdown(doc.content);
        phases.push(...extracted);
      }
    }

    return phases;
  }

  /**
   * Parse release phases from markdown
   */
  private parsePhasesFromMarkdown(content: string): ReleasePhase[] {
    const phases: ReleasePhase[] = [];
    const lines = content.split('\n');

    let currentPhase: Partial<ReleasePhase> | null = null;

    for (const line of lines) {
      // Detect phase headers
      const phaseMatch = line.match(/^#{2,3}\s+(phase\s+\d+|sprint\s+\d+|milestone\s+\d+|v?\d+\.\d+)/i);
      if (phaseMatch) {
        if (currentPhase && currentPhase.name) {
          phases.push({
            name: currentPhase.name,
            description: currentPhase.description || '',
            startDate: currentPhase.startDate,
            endDate: currentPhase.endDate,
            tasks: currentPhase.tasks || [],
          });
        }

        currentPhase = { name: phaseMatch[1].trim(), description: '', tasks: [] };
        continue;
      }

      // Parse date ranges
      if (currentPhase && line.match(/\d{4}-\d{2}-\d{2}/)) {
        const dates = line.match(/(\d{4}-\d{2}-\d{2})/g);
        if (dates && dates.length >= 1) {
          currentPhase.startDate = dates[0];
          if (dates.length >= 2) {
            currentPhase.endDate = dates[1];
          }
        }
      }

      // Add description
      if (currentPhase && line.trim() && !line.startsWith('#')) {
        currentPhase.description = (currentPhase.description || '') + line + '\n';
      }
    }

    if (currentPhase && currentPhase.name) {
      phases.push({
        name: currentPhase.name,
        description: currentPhase.description || '',
        startDate: currentPhase.startDate,
        endDate: currentPhase.endDate,
        tasks: currentPhase.tasks || [],
      });
    }

    return phases;
  }

  /**
   * Generate PR templates based on project context
   */
  private generatePRTemplates(context: TemplateContext): Array<{ name: string; content: string }> {
    const templates = [];

    // Default PR template
    templates.push({
      name: 'default',
      content: `## Summary
<!-- Describe your changes in detail -->

## Related Issue
<!-- Link to the issue this PR addresses -->
Closes #

## Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to change)
- [ ] Documentation update

## Testing
<!-- Describe how you tested your changes -->
- [ ] Tests pass locally
- [ ] New tests added for new functionality

## Checklist
- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my code
- [ ] I have commented my code where necessary
- [ ] I have updated the documentation if needed
- [ ] My changes generate no new warnings

---
*Generated by [Intent Blueprint](https://github.com/intent-solutions-io/intent-blueprint-docs) for ${context.projectName}*
`,
    });

    // Feature PR template
    templates.push({
      name: 'feature',
      content: `## Feature: [Feature Name]

### Summary
<!-- Brief description of the feature -->

### User Story
As a [type of user], I want [goal] so that [benefit].

### Implementation Details
<!-- Technical approach taken -->

### Screenshots/Recordings
<!-- If applicable, add screenshots or recordings -->

### Testing
- [ ] Unit tests added
- [ ] Integration tests added
- [ ] Manual testing completed

### Documentation
- [ ] README updated (if needed)
- [ ] API docs updated (if applicable)
- [ ] User guide updated (if applicable)

---
*Generated by Intent Blueprint*
`,
    });

    // Bug fix PR template
    templates.push({
      name: 'bugfix',
      content: `## Bug Fix: [Brief Description]

### Issue
Fixes #[issue number]

### Root Cause
<!-- What caused the bug? -->

### Solution
<!-- How did you fix it? -->

### Testing
- [ ] Regression tests added
- [ ] Edge cases tested
- [ ] Original issue no longer reproducible

### Impact
<!-- What areas might be affected by this change? -->

---
*Generated by Intent Blueprint*
`,
    });

    return templates;
  }

  /**
   * Preview what would be exported (dry run)
   */
  async preview(
    documents: GeneratedDocument[],
    context: TemplateContext
  ): Promise<{
    labels: GitHubLabel[];
    tasks: TaskBreakdown[];
    phases: ReleasePhase[];
    prTemplates: string[];
  }> {
    return {
      labels: this.getAllLabels(context.projectName),
      tasks: this.extractTasks(documents),
      phases: this.extractPhases(documents),
      prTemplates: this.generatePRTemplates(context).map((t) => t.name),
    };
  }
}

/**
 * Quick export function
 */
export async function exportToGitHub(
  config: GitHubConfig,
  documents: GeneratedDocument[],
  context: TemplateContext,
  options?: ExportOptions
): Promise<ExportResult> {
  const exporter = new GitHubExporter(config, options);
  return exporter.export(documents, context);
}
