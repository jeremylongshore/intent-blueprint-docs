/**
 * Linear Exporter
 * High-level export operations for Blueprint documents to Linear
 */

import { LinearClient } from './client.js';
import type {
  LinearConfig,
  LinearProject,
  LinearCycle,
  LinearIssue,
  LinearLabel,
  LinearTaskBreakdown,
  LinearTaskItem,
  LinearExportResult,
  LinearExportOptions,
  PRIORITY_MAP,
} from './types.js';
import { STANDARD_LABELS, CATEGORY_LABELS } from './types.js';

export class LinearExporter {
  private client: LinearClient;
  private teamId: string;

  constructor(config: LinearConfig) {
    this.client = new LinearClient(config);
    this.teamId = config.teamId;
  }

  /**
   * Export Blueprint documents to Linear
   */
  async export(
    documents: Array<{ name: string; content: string }>,
    options: LinearExportOptions = {}
  ): Promise<LinearExportResult> {
    const result: LinearExportResult = {
      cycles: [],
      issues: [],
      labels: [],
      errors: [],
    };

    // Dry run - just preview
    if (options.dryRun) {
      return this.preview(documents, options);
    }

    try {
      // Verify connection
      await this.client.verify();

      // Sync labels if requested
      if (options.syncLabels !== false) {
        const allLabels = [...STANDARD_LABELS, ...CATEGORY_LABELS];
        result.labels = await this.client.ensureLabels(allLabels);
      }

      // Create project if requested
      if (options.createProject && options.projectName) {
        result.project = await this.client.createProject({
          name: options.projectName,
          description: this.extractDescription(documents),
          teamIds: [this.teamId],
          state: 'planned',
        });
      }

      // Extract and create cycles from release phases
      if (options.createCycles !== false) {
        const phases = this.extractReleasePhases(documents);
        result.cycles = await this.createCyclesFromPhases(phases);
      }

      // Extract and create issues from task breakdowns
      const taskBreakdowns = this.extractTaskBreakdowns(documents);
      const labelMap = this.buildLabelMap(result.labels);

      for (const breakdown of taskBreakdowns) {
        // Find matching cycle for this phase
        const cycle = result.cycles.find(c =>
          c.name?.toLowerCase().includes(breakdown.phase.toLowerCase())
        );

        const issues = await this.createIssuesFromBreakdown(breakdown, {
          projectId: result.project?.id,
          cycleId: cycle?.id,
          labelMap,
        });
        result.issues.push(...issues);
      }

    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : String(error));
    }

    return result;
  }

  /**
   * Preview what would be created (dry run)
   */
  async preview(
    documents: Array<{ name: string; content: string }>,
    options: LinearExportOptions = {}
  ): Promise<LinearExportResult> {
    const result: LinearExportResult = {
      cycles: [],
      issues: [],
      labels: [],
      errors: [],
    };

    // Preview labels
    if (options.syncLabels !== false) {
      const allLabels = [...STANDARD_LABELS, ...CATEGORY_LABELS];
      result.labels = allLabels.map((l, i) => ({
        id: `preview-label-${i}`,
        name: l.name,
        color: l.color,
        teamId: this.teamId,
      }));
    }

    // Preview project
    if (options.createProject && options.projectName) {
      result.project = {
        id: 'preview-project',
        name: options.projectName,
        description: this.extractDescription(documents),
        state: 'planned',
        teamIds: [this.teamId],
      };
    }

    // Preview cycles
    if (options.createCycles !== false) {
      const phases = this.extractReleasePhases(documents);
      result.cycles = phases.map((phase, i) => ({
        id: `preview-cycle-${i}`,
        number: i + 1,
        name: phase.name,
        startsAt: phase.startDate || new Date().toISOString(),
        endsAt: phase.endDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        teamId: this.teamId,
      }));
    }

    // Preview issues
    const taskBreakdowns = this.extractTaskBreakdowns(documents);
    let issueNum = 1;

    for (const breakdown of taskBreakdowns) {
      for (const task of breakdown.tasks) {
        result.issues.push({
          id: `preview-issue-${issueNum}`,
          identifier: `PREVIEW-${issueNum}`,
          title: task.title,
          description: task.description,
          priority: this.mapPriority(task.priority),
          estimate: task.estimate,
          state: { id: 'preview-state', name: 'Backlog' },
          labels: (task.labels || []).map(l => ({
            id: `preview-label-${l}`,
            name: l,
            color: '#888888',
          })),
          url: '#',
        });
        issueNum++;

        // Add subtasks
        if (task.subtasks) {
          for (const subtask of task.subtasks) {
            result.issues.push({
              id: `preview-issue-${issueNum}`,
              identifier: `PREVIEW-${issueNum}`,
              title: subtask.title,
              description: subtask.description,
              priority: this.mapPriority(subtask.priority),
              estimate: subtask.estimate,
              state: { id: 'preview-state', name: 'Backlog' },
              labels: [],
              url: '#',
            });
            issueNum++;
          }
        }
      }
    }

    return result;
  }

  /**
   * Extract project description from documents
   */
  private extractDescription(documents: Array<{ name: string; content: string }>): string {
    // Look for PRD or overview document
    const prd = documents.find(d =>
      d.name.toLowerCase().includes('prd') ||
      d.name.toLowerCase().includes('product')
    );

    if (prd) {
      // Extract first paragraph or executive summary
      const lines = prd.content.split('\n');
      const summaryStart = lines.findIndex(l =>
        l.toLowerCase().includes('summary') ||
        l.toLowerCase().includes('overview')
      );

      if (summaryStart !== -1) {
        const summaryLines: string[] = [];
        for (let i = summaryStart + 1; i < lines.length && i < summaryStart + 10; i++) {
          if (lines[i].startsWith('#')) break;
          if (lines[i].trim()) summaryLines.push(lines[i]);
        }
        return summaryLines.join('\n').slice(0, 500);
      }
    }

    return documents[0]?.content.slice(0, 500) || '';
  }

  /**
   * Extract release phases from documents
   */
  private extractReleasePhases(documents: Array<{ name: string; content: string }>): Array<{
    name: string;
    startDate?: string;
    endDate?: string;
    description?: string;
  }> {
    const phases: Array<{ name: string; startDate?: string; endDate?: string; description?: string }> = [];

    for (const doc of documents) {
      // Look for release plan sections
      const phaseRegex = /##?\s*(phase|sprint|cycle|milestone)\s*(\d+|[ivx]+)?[:\s-]*([^\n]*)/gi;
      let match;

      while ((match = phaseRegex.exec(doc.content)) !== null) {
        const phaseName = match[3]?.trim() || `${match[1]} ${match[2] || ''}`.trim();

        // Try to extract dates
        const dateRegex = /(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4})/g;
        const contentAfterHeader = doc.content.slice(match.index, match.index + 500);
        const dates = contentAfterHeader.match(dateRegex);

        phases.push({
          name: phaseName,
          startDate: dates?.[0],
          endDate: dates?.[1],
        });
      }
    }

    // If no phases found, create default phases
    if (phases.length === 0) {
      const now = new Date();
      phases.push(
        {
          name: 'Phase 1 - Foundation',
          startDate: now.toISOString(),
          endDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          name: 'Phase 2 - Core Features',
          startDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000).toISOString(),
        }
      );
    }

    return phases;
  }

  /**
   * Extract task breakdowns from documents
   */
  private extractTaskBreakdowns(documents: Array<{ name: string; content: string }>): LinearTaskBreakdown[] {
    const breakdowns: LinearTaskBreakdown[] = [];

    for (const doc of documents) {
      const tasks = this.parseTasksFromMarkdown(doc.content);

      if (tasks.length > 0) {
        // Try to determine the phase from document context
        const phaseMatch = doc.content.match(/##?\s*(phase|sprint|cycle)\s*(\d+|[ivx]+)?/i);
        const phase = phaseMatch ? phaseMatch[0].replace(/^#+\s*/, '') : 'Backlog';

        breakdowns.push({
          phase,
          tasks,
        });
      }
    }

    return breakdowns;
  }

  /**
   * Parse tasks from markdown content
   */
  private parseTasksFromMarkdown(content: string): LinearTaskItem[] {
    const tasks: LinearTaskItem[] = [];
    const lines = content.split('\n');
    let currentTask: LinearTaskItem | null = null;

    for (const line of lines) {
      // Match task items: - [ ] Task or * [ ] Task or - Task
      const taskMatch = line.match(/^[\s]*[-*]\s*(?:\[[ x]\])?\s*(.+)/);

      if (taskMatch) {
        const taskText = taskMatch[1].trim();

        // Determine indentation level for subtasks
        const indent = line.match(/^(\s*)/)?.[1].length || 0;

        // Extract priority from markers like [P1], [HIGH], etc.
        const priority = this.extractPriority(taskText);

        // Extract estimate from markers like [2h], [3d], [5pt], etc.
        const estimate = this.extractEstimate(taskText);

        // Extract labels from markers like [feature], [bug], etc.
        const labels = this.extractLabels(taskText);

        // Clean task title
        const title = this.cleanTaskTitle(taskText);

        if (indent < 4 && title.length > 3) {
          // Top-level task
          currentTask = {
            title,
            priority,
            estimate,
            labels,
            subtasks: [],
          };
          tasks.push(currentTask);
        } else if (currentTask && indent >= 4 && title.length > 3) {
          // Subtask
          currentTask.subtasks = currentTask.subtasks || [];
          currentTask.subtasks.push({
            title,
            priority,
            estimate,
          });
        }
      }
    }

    // Also look for numbered lists
    const numberedRegex = /^\d+\.\s+(.+)/gm;
    let match;
    while ((match = numberedRegex.exec(content)) !== null) {
      const taskText = match[1].trim();
      if (taskText.length > 3 && !tasks.some(t => t.title === taskText)) {
        tasks.push({
          title: this.cleanTaskTitle(taskText),
          priority: this.extractPriority(taskText),
          estimate: this.extractEstimate(taskText),
          labels: this.extractLabels(taskText),
        });
      }
    }

    return tasks;
  }

  /**
   * Extract priority from task text
   */
  private extractPriority(text: string): 'urgent' | 'high' | 'medium' | 'low' | 'none' {
    const lower = text.toLowerCase();
    if (lower.includes('[p0]') || lower.includes('[urgent]') || lower.includes('🔴')) return 'urgent';
    if (lower.includes('[p1]') || lower.includes('[high]') || lower.includes('🟠')) return 'high';
    if (lower.includes('[p2]') || lower.includes('[medium]') || lower.includes('🟡')) return 'medium';
    if (lower.includes('[p3]') || lower.includes('[low]') || lower.includes('🟢')) return 'low';
    return 'none';
  }

  /**
   * Map priority string to Linear priority number
   */
  private mapPriority(priority: 'urgent' | 'high' | 'medium' | 'low' | 'none'): number {
    const map: Record<string, number> = {
      urgent: 1,
      high: 2,
      medium: 3,
      low: 4,
      none: 0,
    };
    return map[priority] || 0;
  }

  /**
   * Extract estimate from task text
   */
  private extractEstimate(text: string): number | undefined {
    // Match patterns like [2h], [3d], [5pt], [1w]
    const match = text.match(/\[(\d+)(h|d|pt|w)\]/i);
    if (!match) return undefined;

    const value = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();

    // Convert to points (assuming 1 point = 1 hour, 1 day = 8 hours)
    switch (unit) {
      case 'h': return value;
      case 'd': return value * 8;
      case 'w': return value * 40;
      case 'pt': return value;
      default: return value;
    }
  }

  /**
   * Extract labels from task text
   */
  private extractLabels(text: string): string[] {
    const labels: string[] = [];
    const labelRegex = /\[(feature|bug|tech-debt|research|design|devops|security|testing|documentation)\]/gi;
    let match;

    while ((match = labelRegex.exec(text)) !== null) {
      labels.push(match[1].toLowerCase());
    }

    return labels;
  }

  /**
   * Clean task title by removing markers
   */
  private cleanTaskTitle(text: string): string {
    return text
      .replace(/\[p[0-3]\]/gi, '')
      .replace(/\[(urgent|high|medium|low)\]/gi, '')
      .replace(/\[\d+(h|d|pt|w)\]/gi, '')
      .replace(/\[(feature|bug|tech-debt|research|design|devops|security|testing|documentation)\]/gi, '')
      .replace(/[🔴🟠🟡🟢]/gu, '')
      .trim();
  }

  /**
   * Build label ID map from labels
   */
  private buildLabelMap(labels: LinearLabel[]): Map<string, string> {
    const map = new Map<string, string>();
    for (const label of labels) {
      map.set(label.name.toLowerCase(), label.id);
    }
    return map;
  }

  /**
   * Create cycles from release phases
   */
  private async createCyclesFromPhases(phases: Array<{
    name: string;
    startDate?: string;
    endDate?: string;
  }>): Promise<LinearCycle[]> {
    const cycles: LinearCycle[] = [];
    let currentDate = new Date();

    for (const phase of phases) {
      const startsAt = phase.startDate || currentDate.toISOString();
      const endsAt = phase.endDate || new Date(new Date(startsAt).getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();

      try {
        const cycle = await this.client.createCycle({
          name: phase.name,
          teamId: this.teamId,
          startsAt,
          endsAt,
        });
        cycles.push(cycle);
        currentDate = new Date(endsAt);
      } catch (error) {
        // Cycle creation may fail if dates overlap - continue
        console.warn(`Could not create cycle "${phase.name}": ${error}`);
      }
    }

    return cycles;
  }

  /**
   * Create issues from a task breakdown
   */
  private async createIssuesFromBreakdown(
    breakdown: LinearTaskBreakdown,
    options: {
      projectId?: string;
      cycleId?: string;
      labelMap: Map<string, string>;
    }
  ): Promise<LinearIssue[]> {
    const tasks = breakdown.tasks.map(task => ({
      title: task.title,
      description: task.description,
      priority: this.mapPriority(task.priority),
      estimate: task.estimate,
      labels: task.labels,
      subtasks: task.subtasks?.map(st => ({
        title: st.title,
        description: st.description,
        priority: this.mapPriority(st.priority),
        estimate: st.estimate,
      })),
    }));

    // Map label names to IDs
    const labelIds = breakdown.tasks
      .flatMap(t => t.labels || [])
      .filter((v, i, a) => a.indexOf(v) === i)
      .map(name => options.labelMap.get(name.toLowerCase()))
      .filter((id): id is string => !!id);

    return this.client.createIssuesFromTasks(tasks, {
      projectId: options.projectId,
      cycleId: options.cycleId,
      labelIds: labelIds.length > 0 ? labelIds : undefined,
    });
  }
}

/**
 * Export documents to Linear (convenience function)
 */
export async function exportToLinear(
  config: LinearConfig,
  documents: Array<{ name: string; content: string }>,
  options: LinearExportOptions = {}
): Promise<LinearExportResult> {
  const exporter = new LinearExporter(config);
  return exporter.export(documents, options);
}
