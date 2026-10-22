/**
 * Intent Blueprint Core
 * Template engine for enterprise documentation generation
 */

import Handlebars from 'handlebars';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import { TEMPLATE_DEFINITIONS, validateTemplateCatalog } from './catalog.js';
import { renderSchemaBlueprint } from './renderer.js';
import type { DocumentMetadata, GenerationReceiptV1 } from './schema.js';
import type { EvidenceItem, TraceGraph } from './schema.js';

export * from './schema.js';
export * from './catalog.js';
export * from './modules.js';
export * from './examples.js';
export * from './renderer.js';

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
  evidence?: Array<string | EvidenceItem>;
  assumptions?: string[];
  unknowns?: string[];
  sourceRefs?: string[];
  sourceHashes?: Record<string, string>;
  traceGraph?: TraceGraph;
  includeExamplePacks?: string[];
  generationMode?: 'schema' | 'legacy';
  [key: string]: unknown;
}

export interface GeneratedDocument {
  name: string;
  filename: string;
  content: string;
  category: string;
  metadata?: DocumentMetadata;
  receipt?: GenerationReceiptV1;
}

export interface TemplateInfo {
  id: string;
  name: string;
  filename: string;
  category: string;
  description: string;
}

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
  validateTemplateCatalog(getTemplatesDir());
  return TEMPLATE_DEFINITIONS.map(({ id, name, filename, category, description }) => ({
    id, name, filename, category, description,
  }));
}

function resolveTemplate(templateName: string): TemplateInfo {
  const normalized = templateName.endsWith('.md') ? templateName : `${templateName}.md`;
  const template = listTemplates().find(item => item.filename === normalized || item.id === templateName);

  if (!template) {
    throw new Error(`Unknown template ID: ${templateName}`);
  }

  return template;
}

/**
 * Get templates for a specific scope
 */
export function getTemplatesForScope(scope: 'mvp' | 'standard' | 'comprehensive'): TemplateInfo[] {
  if (!SCOPES.includes(scope)) throw new Error(`Invalid scope: ${scope}. Choose ${SCOPES.join(', ')}.`);
  const allowed = new Set(TEMPLATE_DEFINITIONS.filter(item => item.scopes.includes(scope)).map(item => item.id));
  return listTemplates().filter(item => allowed.has(item.id));
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
  if (!SCOPES.includes(context.scope)) throw new Error(`Invalid scope: ${context.scope}`);
  if (!AUDIENCES.includes(context.audience)) throw new Error(`Invalid audience: ${context.audience}`);
  const info = resolveTemplate(templateName);
  const safeProjectName = context.projectName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'project';

  if (context.generationMode === 'legacy') {
    const template = compileTemplate(info.filename, context.generatedAt);
    return {
      name: info.name,
      filename: `${safeProjectName}-${info.filename}`,
      content: `> [!WARNING]\n> Legacy compatibility output. It may contain illustrative defaults and cannot be approved without migration and evidence review.\n\n${template(context)}`,
      category: info.category,
    };
  }

  const rendered = renderSchemaBlueprint(info.id, context);
  return {
    name: info.name,
    filename: rendered.receipt.output.filename,
    content: rendered.content,
    category: info.category,
    metadata: rendered.metadata,
    receipt: rendered.receipt,
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
export function writeDocuments(
  documents: GeneratedDocument[], outputDir: string, options: { overwrite?: boolean } = {},
): string[] {
  if (!documents.length) throw new Error('No documents to write');
  const destinations = new Set<string>(['index.md']);
  for (const doc of documents) {
    if (!doc.filename || doc.filename !== basename(doc.filename) || !doc.filename.endsWith('.md')) {
      throw new Error(`Invalid document filename: ${doc.filename}`);
    }
    if (destinations.has(doc.filename)) throw new Error(`Duplicate document filename: ${doc.filename}`);
    destinations.add(doc.filename);
    if (doc.receipt) destinations.add(`.metadata/receipts/${doc.filename}.json`);
  }
  if (options.overwrite === false) {
    for (const filename of destinations) {
      if (existsSync(join(outputDir, filename))) throw new Error(`Output already exists: ${filename}. Use --force to overwrite.`);
    }
  }
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const writtenFiles: string[] = [];

  for (const doc of documents) {
    const filePath = join(outputDir, doc.filename);
    writeFileSync(filePath, doc.content);
    writtenFiles.push(filePath);
    if (doc.receipt) {
      const receiptDir = join(outputDir, '.metadata', 'receipts');
      mkdirSync(receiptDir, { recursive: true });
      const receiptPath = join(receiptDir, `${doc.filename}.json`);
      writeFileSync(receiptPath, JSON.stringify(doc.receipt, null, 2) + '\n');
      writtenFiles.push(receiptPath);
    }
  }

  const indexContent = `# Project Documentation

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
