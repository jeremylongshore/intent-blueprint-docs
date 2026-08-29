/**
 * Intent Blueprint Core
 * Template engine for enterprise documentation generation
 */

import Handlebars from 'handlebars';
import { readFileSync, readdirSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Types
export interface TemplateContext {
  projectName: string;
  projectDescription: string;
  scope: 'mvp' | 'standard' | 'comprehensive';
  audience: 'startup' | 'business' | 'enterprise';
  projectType?: string;
  techStack?: string[];
  features?: string[];
  timeline?: string;
  team?: string;
  generatedAt?: string;
  owner?: string;
  reviewers?: string[];
  status?: 'draft' | 'in-review' | 'approved';
  evidence?: string[];
  assumptions?: string[];
  unknowns?: string[];
  sourceRefs?: string[];
  [key: string]: unknown;
}

export interface GeneratedDocument {
  name: string;
  filename: string;
  content: string;
  category: string;
}

export interface TemplateInfo {
  id: string;
  name: string;
  filename: string;
  category: string;
  description: string;
}

export interface GenerationReceipt {
  schemaVersion: '1.0';
  templateId: string;
  templateVersion: string;
  generatedAt: string;
  generator: string;
  sourceRefs: string[];
}

// Template categories
const TEMPLATE_CATEGORIES: Record<string, string[]> = {
  'Product & Strategy': ['01_prd.md', '05_market_research.md', '07_competitor_analysis.md', '08_personas.md', '14_project_brief.md'],
  'Technical Architecture': ['02_adr.md', '06_architecture.md', '16_frontend_spec.md', '19_operational_readiness.md'],
  'User Experience': ['09_user_journeys.md', '10_user_stories.md', '11_acceptance_criteria.md'],
  'Development Workflow': ['03_generate_tasks.md', '04_process_task_list.md', '13_risk_register.md', '15_brainstorming.md', '20_metrics_dashboard.md'],
  'Quality Assurance': ['17_test_plan.md', '12_qa_gate.md', '18_release_plan.md', '21_postmortem.md', '22_playtest_usability.md']
};

// Scope mappings
const SCOPE_TEMPLATES: Record<string, string[]> = {
  mvp: ['01_prd.md', '03_generate_tasks.md', '14_project_brief.md', '15_brainstorming.md'],
  standard: [
    '01_prd.md', '02_adr.md', '03_generate_tasks.md', '06_architecture.md',
    '08_personas.md', '09_user_journeys.md', '10_user_stories.md', '11_acceptance_criteria.md',
    '14_project_brief.md', '15_brainstorming.md', '17_test_plan.md', '18_release_plan.md'
  ],
  comprehensive: Object.values(TEMPLATE_CATEGORIES).flat()
};

/**
 * Get the templates directory path
 */
export function getTemplatesDir(): string {
  const possiblePaths = [
    // npm installed location
    join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'templates', 'core'),
    // Development - from packages/cli/src/core/
    join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', 'professional-templates', 'core'),
    // Working directory
    join(process.cwd(), 'professional-templates', 'core'),
    join(process.cwd(), 'templates', 'core'),
  ];

  for (const p of possiblePaths) {
    if (existsSync(p)) {
      return p;
    }
  }

  throw new Error('Templates directory not found. Run from project root or install templates.');
}

/**
 * List all available templates
 */
export function listTemplates(): TemplateInfo[] {
  const templatesDir = getTemplatesDir();
  const files = readdirSync(templatesDir).filter(f => f.endsWith('.md'));

  return files.map(filename => {
    const id = filename.replace('.md', '');
    const name = id.replace(/^\d+_/, '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const category = Object.entries(TEMPLATE_CATEGORIES).find(([, templates]) =>
      templates.includes(filename)
    )?.[0] || 'Other';

    return {
      id,
      name,
      filename,
      category,
      description: `Generate ${name} documentation`
    };
  });
}

function resolveTemplate(templateName: string): TemplateInfo {
  const normalized = templateName.endsWith('.md') ? templateName : `${templateName}.md`;
  const template = listTemplates().find(item => item.filename === normalized || item.id === templateName);

  if (!template) {
    throw new Error(`Unknown template ID: ${templateName}`);
  }

  return template;
}

function yamlList(values: string[] | undefined): string {
  if (!values?.length) return '  []';
  return values.map(value => `  - ${JSON.stringify(value)}`).join('\n');
}

function renderContextEnvelope(
  template: TemplateInfo,
  context: TemplateContext,
): { markdown: string; receipt: GenerationReceipt } {
  const generatedAt = context.generatedAt || new Date().toISOString();
  const receipt: GenerationReceipt = {
    schemaVersion: '1.0',
    templateId: template.id,
    templateVersion: '2.9.0-legacy',
    generatedAt,
    generator: '@intentsolutions/blueprint',
    sourceRefs: context.sourceRefs || [],
  };
  const markdown = `---
blueprint:
  schema_version: "${receipt.schemaVersion}"
  template_id: ${JSON.stringify(receipt.templateId)}
  template_version: ${JSON.stringify(receipt.templateVersion)}
  generated_at: ${JSON.stringify(receipt.generatedAt)}
  generator: ${JSON.stringify(receipt.generator)}
  status: ${JSON.stringify(context.status || 'draft')}
  project: ${JSON.stringify(context.projectName)}
  audience: ${JSON.stringify(context.audience)}
  owner: ${JSON.stringify(context.owner || '')}
  reviewers:
${yamlList(context.reviewers)}
  source_refs:
${yamlList(context.sourceRefs)}
---

> [!IMPORTANT]
> This is a deterministic Blueprint workbook, not a claim that an AI completed the project analysis. Replace illustrative legacy examples with verified project evidence before approval.

## Project context

- **Project:** ${context.projectName}
- **Description:** ${context.projectDescription}
- **Scope:** ${context.scope}
- **Audience:** ${context.audience}
- **Project type:** ${context.projectType || 'Unknown'}
- **Technology constraints:** ${context.techStack?.join(', ') || 'Unknown'}

### Evidence supplied

${context.evidence?.length ? context.evidence.map(item => `- ${item}`).join('\n') : '- None supplied.'}

### Assumptions requiring validation

${context.assumptions?.length ? context.assumptions.map(item => `- ${item}`).join('\n') : '- None recorded.'}

### Known unknowns

${context.unknowns?.length ? context.unknowns.map(item => `- ${item}`).join('\n') : '- None recorded.'}

---
`;

  return { markdown, receipt };
}

/**
 * Get templates for a specific scope
 */
export function getTemplatesForScope(scope: 'mvp' | 'standard' | 'comprehensive'): TemplateInfo[] {
  const scopeTemplates = SCOPE_TEMPLATES[scope];
  return listTemplates().filter(t => scopeTemplates.includes(t.filename));
}

/**
 * Read and compile a template
 */
export function compileTemplate(templateName: string, generatedAt?: string): HandlebarsTemplateDelegate {
  const templatesDir = getTemplatesDir();
  const template = resolveTemplate(templateName);
  const templatePath = join(templatesDir, template.filename);

  const templateContent = readFileSync(templatePath, 'utf-8');
  const generationDate = generatedAt ? new Date(generatedAt) : new Date();
  if (Number.isNaN(generationDate.getTime())) {
    throw new Error(`Invalid generatedAt timestamp: ${generatedAt}`);
  }
  const withDate = templateContent.replace(/\{\{DATE\}\}/g, generationDate.toISOString().split('T')[0]);

  return Handlebars.compile(withDate);
}

/**
 * Generate a single document from a template
 */
export function generateDocument(templateName: string, context: TemplateContext): GeneratedDocument {
  const info = resolveTemplate(templateName);
  const template = compileTemplate(info.filename, context.generatedAt);
  const rendered = template(context);
  const { markdown } = renderContextEnvelope(info, context);
  const safeProjectName = context.projectName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'project';

  return {
    name: info.name,
    filename: `${safeProjectName}-${info.filename}`,
    content: `${markdown}\n${rendered}`,
    category: info.category
  };
}

/**
 * Generate all documents for a scope
 */
export function generateAllDocuments(context: TemplateContext): GeneratedDocument[] {
  const templates = getTemplatesForScope(context.scope);
  return templates.map(t => generateDocument(t.filename, context));
}

/**
 * Write generated documents to disk
 */
export function writeDocuments(documents: GeneratedDocument[], outputDir: string): string[] {
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const writtenFiles: string[] = [];

  for (const doc of documents) {
    const filePath = join(outputDir, doc.filename);
    writeFileSync(filePath, doc.content);
    writtenFiles.push(filePath);
  }

  const indexContent = `# ${documents[0]?.filename.split('-')[0] || 'Project'} Documentation

Generated: ${new Date().toISOString()}

## Documents

${documents.map(d => `- [${d.name}](./${d.filename}) - ${d.category}`).join('\n')}
`;

  const indexPath = join(outputDir, 'index.md');
  writeFileSync(indexPath, indexContent);
  writtenFiles.push(indexPath);

  return writtenFiles;
}

// Export types and utilities
export { Handlebars };
export const SCOPES = ['mvp', 'standard', 'comprehensive'] as const;
export const AUDIENCES = ['startup', 'business', 'enterprise'] as const;
