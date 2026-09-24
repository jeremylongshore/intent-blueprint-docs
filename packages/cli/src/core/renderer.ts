import { createHash } from 'node:crypto';
import { dump } from 'js-yaml';
import { TEMPLATE_BY_ID } from './catalog.js';
import { BLUEPRINT_MODULE_BY_ID } from './modules.js';
import { loadExamplePack } from './examples.js';
import { VERSION } from '../version.js';
import {
  DocumentMetadataSchema,
  GenerationReceiptSchema,
  EvidenceItemSchema,
  TraceGraphSchema,
  type EvidenceItem,
  type DocumentMetadata,
  type GenerationReceiptV1,
  type TemplateDefinition,
  type TraceGraph,
} from './schema.js';

export interface SchemaRenderContext {
  projectName: string;
  projectDescription: string;
  scope: 'mvp' | 'standard' | 'comprehensive';
  audience: 'startup' | 'business' | 'enterprise';
  projectType?: string;
  techStack?: string[];
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
}

export interface RenderedBlueprint {
  content: string;
  metadata: DocumentMetadata;
  receipt: GenerationReceiptV1;
}

const hash = (value: string): string => `sha256:${createHash('sha256').update(value).digest('hex')}`;
const stable = (value: unknown): string => {
  const canonicalize = (item: unknown): unknown => {
    if (Array.isArray(item)) return item.map(canonicalize);
    if (item && typeof item === 'object') {
      return Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b)).map(([key, nested]) => [key, canonicalize(nested)]));
    }
    return item;
  };
  return JSON.stringify(canonicalize(value));
};
const slug = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'project';
const documentToken = (value: string): string => value.toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '') || 'PROJECT';

function timestamp(value?: string): string {
  const result = value || new Date().toISOString();
  if (Number.isNaN(Date.parse(result))) throw new Error(`Invalid generatedAt timestamp: ${value}`);
  return new Date(result).toISOString();
}

function bullets(values: string[] | undefined, state: 'assumed' | 'unknown', empty: string): string {
  return values?.length ? values.map(value => `- **${state}:** ${value}`).join('\n') : `- **unknown:** ${empty}`;
}

function evidenceRows(values: Array<string | EvidenceItem> | undefined): { items: EvidenceItem[]; markdown: string } {
  const items = (values || []).map((value, index) => EvidenceItemSchema.parse(
    typeof value === 'string'
      ? { id: `E-${index + 1}`, claim: value, state: 'provided', sourceRefs: [] }
      : value,
  ));
  const markdown = items.length
    ? items.map(item => `- **${item.state}:** ${item.claim}${item.sourceRefs.length ? ` (sources: ${item.sourceRefs.join(', ')})` : ''}`).join('\n')
    : '- **unknown:** No evidence was supplied.';
  return { items, markdown };
}

function renderSections(definition: TemplateDefinition): string {
  return definition.sections.map(item => {
    const module = item.module ? BLUEPRINT_MODULE_BY_ID.get(item.module) : undefined;
    const fields = module?.requiredFields.map(field => `- **${field}:** Unknown — supply evidence or name the next action.`).join('\n');
    return `## ${item.title}\n\n${item.purpose}\n\n**Evidence state:** Unknown — complete this section from provided or verified sources.\n${fields ? `\n${fields}\n` : ''}`;
  }).join('\n');
}

function renderUnusedModules(definition: TemplateDefinition): string {
  const attached = new Set(definition.sections.map(section => section.module).filter(Boolean));
  return definition.modules.filter(id => !attached.has(id)).map(id => {
    const module = BLUEPRINT_MODULE_BY_ID.get(id)!;
    return `## Shared module: ${module.id}\n\n${module.purpose}\n\n${module.requiredFields.map(field => `- **${field}:** Unknown — supply evidence or name the next action.`).join('\n')}\n`;
  }).join('\n');
}

function renderTraceGraph(graph: TraceGraph | undefined): string {
  if (!graph) return '| Unknown | traces-to | Unknown | Establish lifecycle links before approval |';
  const parsed = TraceGraphSchema.parse(graph);
  if (!parsed.edges.length) return '| Unknown | traces-to | Unknown | No lifecycle links were supplied |';
  return parsed.edges.map(edge => `| ${edge.from} | ${edge.type} | ${edge.to} | ${edge.rationale || 'Provided and validated'} |`).join('\n');
}

function renderExamples(definition: TemplateDefinition, requested: string[] | undefined): string {
  if (!requested?.length) return '';
  const unique = [...new Set(requested)];
  for (const id of unique) {
    if (!definition.examplePacks.includes(id)) throw new Error(`Example pack ${id} is not declared for template ${definition.id}`);
  }
  return `\n## Opt-in illustrative examples\n\n> [!WARNING]\n> These examples are illustrative, were explicitly requested, and cannot satisfy project evidence or approval.\n\n${unique.map(loadExamplePack).join('\n\n')}\n`;
}

export function renderSchemaBlueprint(templateId: string, context: SchemaRenderContext): RenderedBlueprint {
  const definition = TEMPLATE_BY_ID.get(templateId);
  if (!definition) throw new Error(`Unknown template ID: ${templateId}`);
  if (!context.projectName.trim() || !context.projectDescription.trim()) {
    throw new Error('projectName and projectDescription are required');
  }
  if (context.status === 'approved') {
    throw new Error('Generation cannot approve a document; a human approval record is required');
  }
  const evidence = evidenceRows(context.evidence);
  const traceGraph = context.traceGraph ? TraceGraphSchema.parse(context.traceGraph) : undefined;
  const declaredSources = new Set(context.sourceRefs || []);
  for (const item of evidence.items) {
    for (const ref of item.sourceRefs) {
      if (!declaredSources.has(ref)) throw new Error(`Evidence ${item.id} references undeclared source: ${ref}`);
      if (item.state === 'verified' && !context.sourceHashes?.[ref]) {
        throw new Error(`Verified evidence ${item.id} requires a matching source hash for ${ref}`);
      }
    }
  }

  const generatedAt = timestamp(context.generatedAt);
  const filename = `${slug(context.projectName)}-${definition.filename}`;
  const documentId = `DOC-${documentToken(context.projectName)}.${documentToken(definition.documentType)}`;
  const metadata = DocumentMetadataSchema.parse({
    documentId,
    documentType: definition.documentType,
    schemaVersion: '1.0.0',
    templateVersion: definition.version,
    status: context.status || 'draft',
    owner: context.owner?.trim() || 'Unassigned',
    authors: [],
    reviewers: context.reviewers || [],
    approvers: [],
    generatedAt,
    updatedAt: generatedAt,
    classification: 'internal',
    sourceRefs: context.sourceRefs || [],
    sourceHashes: context.sourceHashes || {},
    assumptions: context.assumptions || [],
    unknowns: context.unknowns || [],
    humanReview: { required: true, status: context.status === 'in-review' ? 'in-review' : 'not-started' },
    relatedArtifacts: [],
    supersedes: [],
  });

  const frontmatter = dump({ blueprint: metadata }, { noRefs: true, lineWidth: 120, sortKeys: true }).trim();
  const content = `---\n${frontmatter}\n---\n\n# ${definition.name}: ${context.projectName}\n\n> [!IMPORTANT]\n> Draft for human review. Unknowns remain unknown; examples are excluded by default and cannot count as evidence.\n\n## How to use this workbook\n\n1. Replace each **Unknown** with provided, verified, derived, assumed, or not-applicable evidence.\n2. Add a source or next evidence action for every material claim.\n3. Have the named reviewer approve the evidence—not merely the prose.\n\n## Project context\n\n| Field | Value | Evidence state |\n|---|---|---|\n| Project | ${context.projectName} | provided |\n| Description | ${context.projectDescription} | provided |\n| Scope | ${context.scope} | provided |\n| Audience | ${context.audience} | provided |\n| Project type | ${context.projectType || 'Unknown — confirm the project type.'} | ${context.projectType ? 'provided' : 'unknown'} |\n| Technology constraints | ${context.techStack?.length ? context.techStack.join(', ') : 'Unknown — no technology constraint was supplied.'} | ${context.techStack?.length ? 'provided' : 'unknown'} |\n\n### Evidence\n\n${evidence.markdown}\n\n### Assumptions\n\n${bullets(context.assumptions, 'assumed', 'No assumptions were recorded; check for hidden assumptions.')}\n\n### Known unknowns\n\n${bullets(context.unknowns, 'unknown', 'No unknowns were recorded; perform a gap review.')}\n\n${renderSections(definition)}\n${renderUnusedModules(definition)}\n## Evidence register\n\n| Claim | State | Sources | Owner |\n|---|---|---|---|\n${evidence.items.length ? evidence.items.map(item => `| ${item.claim} | ${item.state} | ${item.sourceRefs.join(', ') || 'None supplied'} | ${item.owner || context.owner?.trim() || 'Unassigned'} |`).join('\n') : `| Add each material claim | unknown | Identify a source or validation action | ${context.owner?.trim() || 'Unassigned'} |`}\n\n## Traceability\n\n| From ID | Relationship | To ID | Rationale |\n|---|---|---|---|\n${renderTraceGraph(traceGraph)}\n\n## Human review\n\n- **Required:** Yes\n- **Status:** ${context.status === 'in-review' ? 'In review' : 'Not started'}\n- **Reviewers:** ${context.reviewers?.length ? context.reviewers.join(', ') : 'Unassigned'}\n- **Approval evidence:** Unknown — generation never grants approval.\n${renderExamples(definition, context.includeExamplePacks)}`;

  const contentHash = hash(content);
  const templateHash = hash(stable(definition));
  const contextHash = hash(stable(context));
  const receiptId = `RCPT-${createHash('sha256').update(`${contentHash}|${templateHash}|${contextHash}`).digest('hex').slice(0, 24).toUpperCase()}`;
  const receipt = GenerationReceiptSchema.parse({
    schemaVersion: '1.0.0', receiptId, operation: 'render', documentId,
    documentHash: contentHash, templateId: definition.id, templateVersion: definition.version,
    templateHash, generatedAt, generator: { name: '@intentsolutions/blueprint', version: VERSION },
    contextHash, output: { filename, hash: contentHash },
    inputSources: (context.sourceRefs || []).map(ref => ({ ref })),
    transformations: ['schema-backed-render', context.includeExamplePacks?.length ? 'explicit-illustrative-examples-included' : 'examples-excluded-by-default'],
    humanReview: metadata.humanReview, derivedFrom: [], supersedes: [],
    warnings: metadata.unknowns.length ? ['Known unknowns require resolution or accountable acceptance.'] : [],
  });

  return { content, metadata, receipt };
}
