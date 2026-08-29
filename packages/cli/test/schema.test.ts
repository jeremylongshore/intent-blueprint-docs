import { describe, expect, it } from 'vitest';
import {
  DocumentMetadataSchema,
  EvidenceItemSchema,
  LIFECYCLE_EDGE_RULES,
  RECORD_PREFIXES,
  RecordIdSchema,
  TemplateDefinitionSchema,
  TraceGraphSchema,
} from '../src/core/schema.js';

describe('evidence and metadata contracts', () => {
  it('accepts each governed evidence state', () => {
    const variants = [
      { id: 'E-1', claim: 'Supplied by owner', state: 'provided' },
      { id: 'E-2', claim: 'Confirmed by RFC', state: 'verified', sourceRefs: ['RFC-42'] },
      { id: 'E-3', claim: 'Calculated value', state: 'derived', sourceRefs: ['SRC-1'], derivation: { kind: 'calculation', method: 'A + B', confidence: 0.8 } },
      { id: 'E-4', claim: 'Pending validation', state: 'assumed', rationale: 'Owner has not confirmed it' },
      { id: 'E-5', claim: 'Not known', state: 'unknown', rationale: 'Interview the service owner' },
      { id: 'E-6', claim: 'Does not apply', state: 'not-applicable', rationale: 'No browser UI', owner: 'Product Council' },
    ];
    variants.forEach(item => expect(EvidenceItemSchema.parse(item).state).toBe(item.state));
  });

  it('rejects unsupported and unsubstantiated evidence states', () => {
    expect(() => EvidenceItemSchema.parse({ id: 'E-1', claim: 'Maybe', state: 'fabricated' })).toThrow();
    expect(() => EvidenceItemSchema.parse({ id: 'E-2', claim: 'Verified?', state: 'verified' })).toThrow(/source reference/);
    expect(() => EvidenceItemSchema.parse({ id: 'E-3', claim: 'Derived?', state: 'derived' })).toThrow(/derivation/);
  });

  it('requires the complete shared document metadata contract', () => {
    const metadata = DocumentMetadataSchema.parse({
      documentId: 'DOC-ATLAS.PRD', documentType: 'prd', schemaVersion: '1.0.0',
      templateVersion: '3.0.0', status: 'draft', owner: 'Product Council', authors: [],
      reviewers: [], approvers: [], generatedAt: '2026-08-28T12:00:00.000Z',
      updatedAt: '2026-08-28T12:00:00.000Z', classification: 'internal', sourceRefs: [],
      sourceHashes: {}, assumptions: [], unknowns: [],
      humanReview: { required: true, status: 'not-started' }, relatedArtifacts: [], supersedes: [],
    });
    expect(metadata.documentId).toBe('DOC-ATLAS.PRD');
  });
});

describe('record IDs and lifecycle graph', () => {
  it('rejects broken record IDs', () => {
    expect(RecordIdSchema.safeParse('requirement-1').success).toBe(false);
    expect(RecordIdSchema.safeParse('REQ-1').success).toBe(true);
  });

  it('accepts every governed record prefix', () => {
    const prefixes = ['OBJ', 'REQ', 'RISK', 'ADR', 'STORY', 'AC', 'TASK', 'TEST', 'CTRL', 'REL', 'METRIC', 'INC', 'ACT'];
    prefixes.forEach(prefix => expect(RecordIdSchema.parse(`${prefix}-1`)).toBe(`${prefix}-1`));
  });

  it('accepts a valid objective-to-release trace', () => {
    const ids = ['OBJ-1', 'REQ-1', 'STORY-1', 'AC-1', 'TASK-1', 'TEST-1', 'REL-1'];
    expect(TraceGraphSchema.parse({
      nodes: ids.map(id => ({ id, documentId: 'DOC-ATLAS.PRD', label: id })),
      edges: ids.slice(0, -1).map((from, index) => ({ from, to: ids[index + 1], type: 'traces-to' })),
    }).edges).toHaveLength(6);
  });

  it('rejects missing nodes, invalid lifecycle edges, and cycles', () => {
    const nodes = [
      { id: 'OBJ-1', documentId: 'DOC-X.PRD', label: 'Goal' },
      { id: 'TEST-1', documentId: 'DOC-X.TEST', label: 'Test' },
    ];
    expect(() => TraceGraphSchema.parse({ nodes, edges: [{ from: 'OBJ-1', to: 'TEST-1', type: 'traces-to' }] }))
      .toThrow(/cannot trace/);
    expect(() => TraceGraphSchema.parse({ nodes, edges: [{ from: 'OBJ-1', to: 'REQ-MISSING', type: 'traces-to' }] }))
      .toThrow(/declared nodes/);
    expect(() => TraceGraphSchema.parse({ nodes, edges: [{ from: 'OBJ-1', to: 'OBJ-1', type: 'relates-to' }] }))
      .toThrow(/Self edges/);
  });

  it('enforces every allowed and disallowed lifecycle prefix pair', () => {
    for (const from of RECORD_PREFIXES) {
      for (const to of RECORD_PREFIXES) {
        const graph = {
          nodes: [
            { id: `${from}-1`, documentId: 'DOC-X.GRAPH', label: from },
            { id: `${to}-2`, documentId: 'DOC-X.GRAPH', label: to },
          ],
          edges: [{ from: `${from}-1`, to: `${to}-2`, type: 'traces-to' }],
        };
        const allowed = (LIFECYCLE_EDGE_RULES[from as keyof typeof LIFECYCLE_EDGE_RULES] as readonly string[]).includes(to);
        expect(TraceGraphSchema.safeParse(graph).success, `${from} -> ${to}`).toBe(allowed);
      }
    }
  });

  it('rejects a cycle even when every individual edge type is allowed', () => {
    const ids = ['RISK-1', 'CTRL-1', 'TEST-1', 'REL-1', 'METRIC-1'];
    expect(() => TraceGraphSchema.parse({
      nodes: ids.map(id => ({ id, documentId: 'DOC-X.GRAPH', label: id })),
      edges: [
        { from: 'RISK-1', to: 'CTRL-1', type: 'traces-to' },
        { from: 'CTRL-1', to: 'TEST-1', type: 'traces-to' },
        { from: 'TEST-1', to: 'REL-1', type: 'traces-to' },
        { from: 'REL-1', to: 'METRIC-1', type: 'traces-to' },
        { from: 'METRIC-1', to: 'RISK-1', type: 'traces-to' },
      ],
    })).toThrow(/acyclic/);
  });

  it('rejects duplicate lifecycle edges', () => {
    const nodes = [
      { id: 'OBJ-1', documentId: 'DOC-X.GRAPH', label: 'Goal' },
      { id: 'REQ-1', documentId: 'DOC-X.GRAPH', label: 'Requirement' },
    ];
    const edge = { from: 'OBJ-1', to: 'REQ-1', type: 'traces-to' };
    expect(() => TraceGraphSchema.parse({ nodes, edges: [edge, edge] })).toThrow(/Duplicate/);
  });
});

describe('template definition contract', () => {
  it('rejects undeclared reusable modules', () => {
    expect(() => TemplateDefinitionSchema.parse({
      id: '01_prd', documentType: 'prd', name: 'PRD', filename: '01_prd.md',
      version: '3.0.0', category: 'Product & Strategy', description: 'Product requirements', purpose: 'Define product requirements', scopes: ['mvp'],
      recordPrefixes: ['OBJ', 'REQ'], modules: [], examplePacks: [], standardsAlignment: [],
      sections: [
        { id: 'summary', title: 'Summary', purpose: 'Frame the product', required: true },
        { id: 'evidence', title: 'Evidence', purpose: 'Record sources', required: true, module: 'evidence-register' },
      ],
    })).toThrow(/undeclared module/);
  });
});
