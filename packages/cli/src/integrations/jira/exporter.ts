/**
 * Jira Exporter
 * High-level export operations for Blueprint documents to Jira
 */

import { JiraClient } from './client.js';
import type {
  JiraConfig,
  JiraIssue,
  JiraSprint,
  JiraVersion,
  JiraComponent,
  JiraTaskBreakdown,
  JiraStoryItem,
  JiraExportResult,
  JiraExportOptions,
} from './types.js';
import { PRIORITY_MAP, STANDARD_LABELS, CATEGORY_COMPONENTS } from './types.js';

export class JiraExporter {
  private client: JiraClient;
  private projectKey: string;

  constructor(config: JiraConfig) {
    this.client = new JiraClient(config);
    this.projectKey = config.projectKey;
  }

  /**
   * Export Blueprint documents to Jira
   */
  async export(
    documents: Array<{ name: string; content: string }>,
    options: JiraExportOptions = {}
  ): Promise<JiraExportResult> {
    const result: JiraExportResult = {
      epics: [],
      stories: [],
      tasks: [],
      sprints: [],
      versions: [],
      components: [],
      errors: [],
    };

    // Dry run - just preview
    if (options.dryRun) {
      return this.preview(documents, options);
    }

    try {
      // Verify connection
      await this.client.verify();

      // Sync components if requested
      if (options.syncComponents !== false) {
        const componentNames = Object.values(CATEGORY_COMPONENTS);
        result.components = await this.client.ensureComponents(componentNames);
      }

      // Create versions from release phases if requested
      if (options.createVersions) {
        const phases = this.extractReleasePhases(documents);
        for (const phase of phases) {
          try {
            const version = await this.client.createVersion({
              name: phase.name,
              projectKey: this.projectKey,
              description: phase.description,
              releaseDate: phase.endDate,
            });
            result.versions.push(version);
          } catch (error) {
            result.errors.push(`Failed to create version "${phase.name}": ${error}`);
          }
        }
      }

      // Get board for sprint creation
      let boardId = options.boardId;
      if (options.createSprints && !boardId) {
        const boards = await this.client.getBoards();
        const scrumBoard = boards.find(b => b.type === 'scrum');
        if (scrumBoard) {
          boardId = scrumBoard.id;
        }
      }

      // Create sprints from release phases if requested
      if (options.createSprints && boardId) {
        const phases = this.extractReleasePhases(documents);
        for (const phase of phases) {
          try {
            const sprint = await this.client.createSprint({
              name: phase.name,
              boardId,
              startDate: phase.startDate,
              endDate: phase.endDate,
              goal: phase.description,
            });
            result.sprints.push(sprint);
          } catch (error) {
            result.errors.push(`Failed to create sprint "${phase.name}": ${error}`);
          }
        }
      }

      // Create Epic if requested
      let epicKey: string | undefined;
      if (options.createEpic && options.epicName) {
        try {
          const epic = await this.client.createIssue({
            summary: options.epicName,
            description: this.extractDescription(documents),
            issueType: 'Epic',
            projectKey: this.projectKey,
            labels: options.addLabels ? ['blueprint'] : undefined,
          });
          result.epics.push(epic);
          epicKey = epic.key;
        } catch (error) {
          result.errors.push(`Failed to create epic: ${error}`);
        }
      }

      // Extract and create issues from task breakdowns
      const taskBreakdowns = this.extractTaskBreakdowns(documents);

      for (let i = 0; i < taskBreakdowns.length; i++) {
        const breakdown = taskBreakdowns[i];
        const sprint = result.sprints[i];

        const { stories, tasks } = await this.createIssuesFromBreakdown(breakdown, {
          epicKey,
          sprintId: sprint?.id,
          addLabels: options.addLabels,
        });

        result.stories.push(...stories);
        result.tasks.push(...tasks);
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
    options: JiraExportOptions = {}
  ): Promise<JiraExportResult> {
    const result: JiraExportResult = {
      epics: [],
      stories: [],
      tasks: [],
      sprints: [],
      versions: [],
      components: [],
      errors: [],
    };

    // Preview components
    if (options.syncComponents !== false) {
      const componentNames = Object.values(CATEGORY_COMPONENTS);
      result.components = componentNames.map((name, i) => ({
        id: `preview-component-${i}`,
        name,
        projectKey: this.projectKey,
      }));
    }

    // Preview versions
    if (options.createVersions) {
      const phases = this.extractReleasePhases(documents);
      result.versions = phases.map((phase, i) => ({
        id: `preview-version-${i}`,
        name: phase.name,
        description: phase.description,
        released: false,
        releaseDate: phase.endDate,
        projectKey: this.projectKey,
      }));
    }

    // Preview sprints
    if (options.createSprints) {
      const phases = this.extractReleasePhases(documents);
      result.sprints = phases.map((phase, i) => ({
        id: i + 1,
        name: phase.name,
        state: 'future' as const,
        startDate: phase.startDate,
        endDate: phase.endDate,
        boardId: options.boardId || 0,
        goal: phase.description,
      }));
    }

    // Preview epic
    if (options.createEpic && options.epicName) {
      result.epics.push(this.createPreviewIssue('PREVIEW-0', options.epicName, 'Epic'));
    }

    // Preview stories and tasks
    const taskBreakdowns = this.extractTaskBreakdowns(documents);
    let issueNum = 1;

    for (const breakdown of taskBreakdowns) {
      for (const story of breakdown.stories) {
        result.stories.push(this.createPreviewIssue(`PREVIEW-${issueNum}`, story.summary, 'Story'));
        issueNum++;

        if (story.tasks) {
          for (const task of story.tasks) {
            result.tasks.push(this.createPreviewIssue(`PREVIEW-${issueNum}`, task.summary, 'Sub-task'));
            issueNum++;
          }
        }
      }
    }

    return result;
  }

  /**
   * Create a preview issue object
   */
  private createPreviewIssue(key: string, summary: string, type: string): JiraIssue {
    return {
      id: key,
      key,
      self: '#',
      fields: {
        summary,
        issuetype: { id: '0', name: type, subtask: type === 'Sub-task', hierarchyLevel: 0 },
        status: { id: '0', name: 'To Do', statusCategory: { id: 2, key: 'new', name: 'To Do' } },
        project: { id: '0', key: this.projectKey, name: this.projectKey },
      },
    };
  }

  /**
   * Extract project description from documents
   */
  private extractDescription(documents: Array<{ name: string; content: string }>): string {
    const prd = documents.find(d =>
      d.name.toLowerCase().includes('prd') ||
      d.name.toLowerCase().includes('product')
    );

    if (prd) {
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
        return summaryLines.join('\n').slice(0, 1000);
      }
    }

    return documents[0]?.content.slice(0, 1000) || '';
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
      const phaseRegex = /##?\s*(phase|sprint|cycle|milestone|release)\s*(\d+|[ivx]+)?[:\s-]*([^\n]*)/gi;
      let match;

      while ((match = phaseRegex.exec(doc.content)) !== null) {
        const phaseName = match[3]?.trim() || `${match[1]} ${match[2] || ''}`.trim();
        const dateRegex = /(\d{4}-\d{2}-\d{2})/g;
        const contentAfterHeader = doc.content.slice(match.index, match.index + 500);
        const dates = contentAfterHeader.match(dateRegex);

        // Extract description (first non-header line after the phase header)
        const descLines = contentAfterHeader.split('\n').slice(1, 4);
        const description = descLines.find(l => l.trim() && !l.startsWith('#'))?.trim();

        phases.push({
          name: phaseName,
          startDate: dates?.[0],
          endDate: dates?.[1],
          description,
        });
      }
    }

    // If no phases found, create default phases
    if (phases.length === 0) {
      const now = new Date();
      phases.push(
        {
          name: 'Sprint 1 - Foundation',
          startDate: now.toISOString().split('T')[0],
          endDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        },
        {
          name: 'Sprint 2 - Core Features',
          startDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        }
      );
    }

    return phases;
  }

  /**
   * Extract task breakdowns from documents
   */
  private extractTaskBreakdowns(documents: Array<{ name: string; content: string }>): JiraTaskBreakdown[] {
    const breakdowns: JiraTaskBreakdown[] = [];

    for (const doc of documents) {
      const stories = this.parseStoriesFromMarkdown(doc.content);

      if (stories.length > 0) {
        breakdowns.push({ stories });
      }
    }

    return breakdowns;
  }

  /**
   * Parse stories from markdown content
   */
  private parseStoriesFromMarkdown(content: string): JiraStoryItem[] {
    const stories: JiraStoryItem[] = [];
    const lines = content.split('\n');
    let currentStory: JiraStoryItem | null = null;

    for (const line of lines) {
      // Match task items: - [ ] Task or * [ ] Task or - Task
      const taskMatch = line.match(/^[\s]*[-*]\s*(?:\[[ x]\])?\s*(.+)/);

      if (taskMatch) {
        const taskText = taskMatch[1].trim();
        const indent = line.match(/^(\s*)/)?.[1].length || 0;

        // Extract priority
        const priority = this.extractPriority(taskText);
        const storyPoints = this.extractStoryPoints(taskText);
        const labels = this.extractLabels(taskText);
        const summary = this.cleanTaskTitle(taskText);

        if (indent < 4 && summary.length > 3) {
          // Top-level item = Story
          currentStory = {
            summary,
            priority,
            storyPoints,
            labels,
            tasks: [],
          };
          stories.push(currentStory);
        } else if (currentStory && indent >= 4 && summary.length > 3) {
          // Indented item = Sub-task
          currentStory.tasks = currentStory.tasks || [];
          currentStory.tasks.push({
            summary,
            priority,
          });
        }
      }
    }

    // Also look for numbered lists as stories
    const numberedRegex = /^\d+\.\s+(.+)/gm;
    let match;
    while ((match = numberedRegex.exec(content)) !== null) {
      const taskText = match[1].trim();
      if (taskText.length > 3 && !stories.some(s => s.summary === taskText)) {
        stories.push({
          summary: this.cleanTaskTitle(taskText),
          priority: this.extractPriority(taskText),
          storyPoints: this.extractStoryPoints(taskText),
          labels: this.extractLabels(taskText),
        });
      }
    }

    return stories;
  }

  /**
   * Extract priority from task text
   */
  private extractPriority(text: string): 'Highest' | 'High' | 'Medium' | 'Low' | 'Lowest' | undefined {
    const lower = text.toLowerCase();
    if (lower.includes('[p0]') || lower.includes('[urgent]') || lower.includes('[highest]')) return 'Highest';
    if (lower.includes('[p1]') || lower.includes('[high]')) return 'High';
    if (lower.includes('[p2]') || lower.includes('[medium]')) return 'Medium';
    if (lower.includes('[p3]') || lower.includes('[low]')) return 'Low';
    if (lower.includes('[lowest]')) return 'Lowest';
    return undefined;
  }

  /**
   * Extract story points from task text
   */
  private extractStoryPoints(text: string): number | undefined {
    // Match patterns like [3pt], [5sp], [8 points]
    const match = text.match(/\[(\d+)\s*(?:pt|sp|points?)\]/i);
    return match ? parseInt(match[1], 10) : undefined;
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
      .replace(/\[(urgent|highest|high|medium|low|lowest)\]/gi, '')
      .replace(/\[\d+\s*(?:pt|sp|points?)\]/gi, '')
      .replace(/\[(feature|bug|tech-debt|research|design|devops|security|testing|documentation)\]/gi, '')
      .replace(/[🔴🟠🟡🟢]/gu, '')
      .trim();
  }

  /**
   * Create issues from a task breakdown
   */
  private async createIssuesFromBreakdown(
    breakdown: JiraTaskBreakdown,
    options: {
      epicKey?: string;
      sprintId?: number;
      addLabels?: boolean;
    }
  ): Promise<{ stories: JiraIssue[]; tasks: JiraIssue[] }> {
    const stories: JiraIssue[] = [];
    const tasks: JiraIssue[] = [];

    for (const story of breakdown.stories) {
      try {
        const labels = options.addLabels
          ? [...STANDARD_LABELS.slice(0, 1), ...(story.labels || [])]
          : story.labels;

        const storyIssue = await this.client.createIssue({
          summary: story.summary,
          description: story.description,
          issueType: 'Story',
          projectKey: this.projectKey,
          priority: story.priority,
          labels,
        });

        // Link to epic
        if (options.epicKey) {
          await this.client.linkToEpic(storyIssue.key, options.epicKey);
        }

        // Add to sprint
        if (options.sprintId) {
          await this.client.addToSprint(options.sprintId, [storyIssue.key]);
        }

        stories.push(storyIssue);

        // Create subtasks
        if (story.tasks) {
          for (const task of story.tasks) {
            try {
              const taskIssue = await this.client.createIssue({
                summary: task.summary,
                description: task.description,
                issueType: 'Sub-task',
                projectKey: this.projectKey,
                parentKey: storyIssue.key,
                priority: task.priority,
              });
              tasks.push(taskIssue);
            } catch (error) {
              // Continue on subtask creation failure
            }
          }
        }
      } catch (error) {
        // Continue on story creation failure
      }
    }

    return { stories, tasks };
  }
}

/**
 * Export documents to Jira (convenience function)
 */
export async function exportToJira(
  config: JiraConfig,
  documents: Array<{ name: string; content: string }>,
  options: JiraExportOptions = {}
): Promise<JiraExportResult> {
  const exporter = new JiraExporter(config);
  return exporter.export(documents, options);
}
