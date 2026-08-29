import { z } from 'zod';

export const EVIDENCE_STATES = [
  'provided',
  'verified',
  'derived',
  'assumed',
  'unknown',
  'not-applicable',
] as const;

export const RECORD_PREFIXES = [
  'OBJ', 'REQ', 'RISK', 'ADR', 'STORY', 'AC', 'TASK', 'TEST',
  'CTRL', 'REL', 'METRIC', 'INC', 'ACT',
] as const;

export const RecordIdSchema = z.string().regex(
  /^(OBJ|REQ|RISK|ADR|STORY|AC|TASK|TEST|CTRL|REL|METRIC|INC|ACT)-[A-Z0-9][A-Z0-9._-]*$/,
  'Record IDs must use a governed prefix followed by an uppercase stable identifier',
);

export const EvidenceItemSchema = z.object({
  id: z.string().min(1),
  claim: z.string().min(1),
  state: z.enum(EVIDENCE_STATES),
  sourceRefs: z.array(z.string().min(1)).default([]),
  derivation: z.object({
    kind: z.enum(['calculation', 'estimate', 'inference']),
    method: z.string().min(1),
    confidence: z.number().min(0).max(1),
  }).strict().optional(),
  confidence: z.number().min(0).max(1).optional(),
  owner: z.string().min(1).optional(),
  reviewedAt: z.string().datetime().optional(),
  rationale: z.string().min(1).optional(),
}).strict().superRefine((item, context) => {
  if (item.state === 'verified' && item.sourceRefs.length === 0) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['sourceRefs'],
      message: 'Verified evidence requires at least one source reference',
    });
  }
  if (item.state === 'derived' && (!item.derivation || item.sourceRefs.length === 0)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['derivation'],
      message: 'Derived evidence requires a source reference and structured derivation',
    });
  }
  if ((item.state === 'assumed' || item.state === 'unknown') && !item.rationale) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['rationale'],
      message: `${item.state} evidence requires a rationale or next evidence action`,
    });
  }
  if (item.state === 'not-applicable' && (!item.rationale || !item.owner)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['rationale'],
      message: 'Not-applicable evidence requires a rationale and accountable owner',
    });
  }
});

export const HumanReviewSchema = z.object({
  required: z.boolean(),
  status: z.enum(['not-started', 'in-review', 'approved', 'rejected']),
  reviewer: z.string().min(1).optional(),
  reviewedAt: z.string().datetime().optional(),
  decisionRef: z.string().min(1).optional(),
}).strict().superRefine((review, context) => {
  if (review.status === 'approved' && (!review.reviewer || !review.reviewedAt)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Approved documents require reviewer and reviewedAt',
    });
  }
});

export const DocumentMetadataSchema = z.object({
  documentId: z.string().regex(/^DOC-[A-Z0-9][A-Z0-9._-]*$/),
  documentType: z.string().regex(/^[a-z][a-z0-9-]+$/),
  schemaVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
  templateVersion: z.string().min(1),
  status: z.enum(['draft', 'in-review', 'approved', 'superseded']),
  owner: z.string().min(1),
  authors: z.array(z.string().min(1)),
  reviewers: z.array(z.string().min(1)),
  approvers: z.array(z.string().min(1)),
  generatedAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  classification: z.enum(['public', 'internal', 'confidential', 'restricted']),
  sourceRefs: z.array(z.string().min(1)),
  sourceHashes: z.record(z.string().regex(/^sha256:[a-f0-9]{64}$/)),
  assumptions: z.array(z.string().min(1)),
  unknowns: z.array(z.string().min(1)),
  humanReview: HumanReviewSchema,
  relatedArtifacts: z.array(z.string().min(1)),
  reviewDue: z.string().datetime().optional(),
  supersedes: z.array(z.string().regex(/^DOC-[A-Z0-9][A-Z0-9._-]*$/)),
}).strict().superRefine((metadata, context) => {
  const generatedAt = Date.parse(metadata.generatedAt);
  const updatedAt = Date.parse(metadata.updatedAt);
  if (updatedAt < generatedAt) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['updatedAt'], message: 'updatedAt cannot precede generatedAt' });
  }
  if (metadata.reviewDue && Date.parse(metadata.reviewDue) < updatedAt) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['reviewDue'], message: 'reviewDue cannot precede updatedAt' });
  }
  if (metadata.status === 'approved' && (metadata.humanReview.status !== 'approved' || metadata.approvers.length === 0)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['status'], message: 'Approved documents require completed human review and an approver' });
  }
  if (metadata.supersedes.includes(metadata.documentId)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['supersedes'], message: 'A document cannot supersede itself' });
  }
  for (const sourceId of Object.keys(metadata.sourceHashes)) {
    if (!metadata.sourceRefs.includes(sourceId)) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ['sourceHashes', sourceId], message: 'Source hashes must reference a declared source' });
    }
  }
});

export const TemplateSectionSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9-]+$/),
  title: z.string().min(1),
  purpose: z.string().min(1),
  required: z.boolean(),
  module: z.string().regex(/^[a-z][a-z0-9-]+$/).optional(),
}).strict();

export const TemplateDefinitionSchema = z.object({
  id: z.string().regex(/^\d{2}_[a-z_]+$/),
  documentType: z.string().regex(/^[a-z][a-z0-9-]+$/),
  name: z.string().min(1),
  filename: z.string().regex(/^\d{2}_[a-z_]+\.md$/),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  category: z.enum([
    'Product & Strategy',
    'Technical Architecture',
    'User Experience',
    'Development Workflow',
    'Quality Assurance',
  ]),
  description: z.string().min(1),
  purpose: z.string().min(1),
  scopes: z.array(z.enum(['mvp', 'standard', 'comprehensive'])).min(1),
  recordPrefixes: z.array(z.enum(RECORD_PREFIXES)),
  sections: z.array(TemplateSectionSchema).min(2),
  modules: z.array(z.string().regex(/^[a-z][a-z0-9-]+$/)),
  examplePacks: z.array(z.string().regex(/^[a-z][a-z0-9-]+$/)),
  standardsAlignment: z.array(z.string().min(1)),
}).strict().superRefine((definition, context) => {
  const sectionIds = definition.sections.map(section => section.id);
  if (new Set(sectionIds).size !== sectionIds.length) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['sections'],
      message: 'Template section IDs must be unique',
    });
  }
  for (const section of definition.sections) {
    if (section.module && !definition.modules.includes(section.module)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['sections', section.id, 'module'],
        message: `Section references undeclared module: ${section.module}`,
      });
    }
  }
});

export const TraceNodeSchema = z.object({
  id: RecordIdSchema,
  documentId: z.string().regex(/^DOC-[A-Z0-9][A-Z0-9._-]*$/),
  label: z.string().min(1),
}).strict();

export const TraceEdgeSchema = z.object({
  from: RecordIdSchema,
  to: RecordIdSchema,
  type: z.enum(['traces-to', 'relates-to']),
  rationale: z.string().min(1).optional(),
}).strict();

export const LIFECYCLE_EDGE_RULES = {
  OBJ: ['REQ', 'RISK'], REQ: ['ADR', 'STORY', 'AC', 'RISK', 'CTRL'], ADR: ['TASK', 'CTRL'],
  STORY: ['AC', 'TASK'], AC: ['TASK', 'TEST'], RISK: ['CTRL', 'TASK', 'TEST'], CTRL: ['TEST'],
  TASK: ['TEST'], TEST: ['REL'], REL: ['METRIC'], METRIC: ['RISK', 'INC'], INC: ['ACT', 'RISK'],
  ACT: ['TASK', 'TEST'],
} as const;

const ALLOWED_LIFECYCLE_EDGES = Object.fromEntries(
  Object.entries(LIFECYCLE_EDGE_RULES).map(([from, to]) => [from, new Set<string>(to)]),
) as Record<string, ReadonlySet<string>>;

function recordPrefix(id: string): string {
  return id.slice(0, id.indexOf('-'));
}

export const TraceGraphSchema = z.object({
  nodes: z.array(TraceNodeSchema),
  edges: z.array(TraceEdgeSchema),
}).strict().superRefine((graph, context) => {
  const nodeIds = graph.nodes.map(node => node.id);
  const known = new Set(nodeIds);
  if (known.size !== nodeIds.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['nodes'], message: 'Trace node IDs must be unique' });
  }

  const adjacency = new Map<string, string[]>();
  const edgeKeys = new Set<string>();
  graph.edges.forEach((edge, index) => {
    const edgeKey = `${edge.from}|${edge.type}|${edge.to}`;
    if (edgeKeys.has(edgeKey)) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ['edges', index], message: 'Duplicate trace edges are not allowed' });
    }
    edgeKeys.add(edgeKey);
    if (!known.has(edge.from) || !known.has(edge.to)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['edges', index],
        message: 'Trace edges must reference declared nodes',
      });
      return;
    }
    if (edge.from === edge.to) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ['edges', index], message: 'Self edges are not allowed' });
    }
    if (edge.type === 'traces-to') {
      const from = recordPrefix(edge.from);
      const to = recordPrefix(edge.to);
      if (!ALLOWED_LIFECYCLE_EDGES[from]?.has(to)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['edges', index],
          message: `Invalid lifecycle edge: ${from} cannot trace to ${to}`,
        });
      }
      adjacency.set(edge.from, [...(adjacency.get(edge.from) || []), edge.to]);
    }
  });

  const visiting = new Set<string>();
  const visited = new Set<string>();
  const hasCycle = (id: string): boolean => {
    if (visiting.has(id)) return true;
    if (visited.has(id)) return false;
    visiting.add(id);
    for (const next of adjacency.get(id) || []) {
      if (hasCycle(next)) return true;
    }
    visiting.delete(id);
    visited.add(id);
    return false;
  };
  if (nodeIds.some(hasCycle)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['edges'], message: 'Trace lifecycle edges must be acyclic' });
  }
});

export const GenerationReceiptSchema = z.object({
  schemaVersion: z.literal('1.0.0'),
  receiptId: z.string().regex(/^RCPT-[A-F0-9]{16,64}$/),
  operation: z.literal('render'),
  documentId: z.string().regex(/^DOC-[A-Z0-9][A-Z0-9._-]*$/),
  documentHash: z.string().regex(/^sha256:[a-f0-9]{64}$/),
  templateId: z.string().regex(/^\d{2}_[a-z_]+$/),
  templateVersion: z.string().min(1),
  templateHash: z.string().regex(/^sha256:[a-f0-9]{64}$/),
  generatedAt: z.string().datetime(),
  generator: z.object({
    name: z.string().min(1),
    version: z.string().min(1),
    provider: z.string().min(1).optional(),
    model: z.string().min(1).optional(),
  }).strict(),
  contextHash: z.string().regex(/^sha256:[a-f0-9]{64}$/),
  output: z.object({
    filename: z.string().regex(/^[a-z0-9][a-z0-9._-]*\.md$/),
    hash: z.string().regex(/^sha256:[a-f0-9]{64}$/),
  }).strict(),
  inputSources: z.array(z.object({
    ref: z.string().min(1),
    hash: z.string().regex(/^sha256:[a-f0-9]{64}$/).optional(),
  }).strict()),
  transformations: z.array(z.string().min(1)),
  humanReview: HumanReviewSchema,
  derivedFrom: z.array(z.string().min(1)),
  supersedes: z.array(z.string().regex(/^DOC-[A-Z0-9][A-Z0-9._-]*$/)),
  warnings: z.array(z.string().min(1)),
}).strict();

export type EvidenceState = typeof EVIDENCE_STATES[number];
export type EvidenceItem = z.infer<typeof EvidenceItemSchema>;
export type DocumentMetadata = z.infer<typeof DocumentMetadataSchema>;
export type TemplateDefinition = z.infer<typeof TemplateDefinitionSchema>;
export type TraceNode = z.infer<typeof TraceNodeSchema>;
export type TraceEdge = z.infer<typeof TraceEdgeSchema>;
export type TraceGraph = z.infer<typeof TraceGraphSchema>;
export type GenerationReceiptV1 = z.infer<typeof GenerationReceiptSchema>;
