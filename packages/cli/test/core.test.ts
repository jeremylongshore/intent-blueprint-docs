import { describe, expect, it } from 'vitest';
import { generateAllDocuments, generateDocument, getTemplatesForScope, listTemplates, GenerationReceiptSchema } from '../src/core/index.js';

const context = {
  projectName: 'Atlas Evidence Hub',
  projectDescription: 'A governed evidence registry for release decisions.',
  scope: 'mvp' as const,
  audience: 'enterprise' as const,
  generatedAt: '2026-08-28T12:00:00.000Z',
  owner: 'Platform Council',
  evidence: ['RFC-42'],
  assumptions: ['Identity provider remains unchanged.'],
  unknowns: ['Regional retention policy.'],
  sourceRefs: ['docs/RFC-42.md'],
};

describe('provider-neutral core generation', () => {
  it('binds project context and provenance to a deterministic workbook', () => {
    const document = generateDocument('01_prd', context);
    expect(document.content).toContain('Atlas Evidence Hub');
    expect(document.content).toContain(context.projectDescription);
    expect(document.content).toContain('RFC-42');
    expect(document.content).toContain('Draft for human review');
    expect(document.content).toContain("generatedAt: '2026-08-28T12:00:00.000Z'");
    expect(document.content).toContain('2026-08-28');
    expect(document.content).toContain('| Project | Atlas Evidence Hub | provided |');
    expect(document.content).toContain('**assumed:** Identity provider remains unchanged.');
    expect(document.receipt && GenerationReceiptSchema.parse(document.receipt)).toBeTruthy();
  });

  it('rejects template paths outside the catalog', () => {
    expect(() => generateDocument('../../README', context)).toThrow(/Unknown template ID/);
  });

  it('exposes exactly the canonical 22-template set', () => {
    expect(listTemplates().map(item => item.id)).toEqual([
      '01_prd', '02_adr', '03_generate_tasks', '04_process_task_list',
      '05_market_research', '06_architecture', '07_competitor_analysis', '08_personas',
      '09_user_journeys', '10_user_stories', '11_acceptance_criteria', '12_qa_gate',
      '13_risk_register', '14_project_brief', '15_brainstorming', '16_frontend_spec',
      '17_test_plan', '18_release_plan', '19_operational_readiness', '20_metrics_dashboard',
      '21_postmortem', '22_playtest_usability',
    ]);
  });

  it('keeps high-risk workbooks blank, evidence-labeled, and example-free by default', () => {
    const highRisk = ['05_market_research', '06_architecture', '07_competitor_analysis', '08_personas', '17_test_plan', '18_release_plan', '22_playtest_usability'];
    for (const id of highRisk) {
      const document = generateDocument(id, { ...context, evidence: undefined, assumptions: undefined, unknowns: undefined });
      expect(document.content).toContain('**Evidence state:** Unknown');
      expect(document.content).toContain('examples are excluded');
      expect(document.content).not.toMatch(/Acme|Example Corp|AWS|Kubernetes|React|10,000|99\.9%/i);
      expect(document.content).not.toContain('{{');
    }
  });

  it('requires human approval instead of allowing generation to self-approve', () => {
    expect(() => generateDocument('01_prd', { ...context, status: 'approved' })).toThrow(/human approval/);
  });

  it('renders all 22 through the safe schema path while preserving ID and filename lookup', () => {
    for (const template of listTemplates()) {
      const byId = generateDocument(template.id, context);
      const byFilename = generateDocument(template.filename, context);
      expect(byId.content).toBe(byFilename.content);
      expect(byId.receipt?.templateId).toBe(template.id);
      expect(byId.receipt?.templateVersion).toBe('3.0.0');
      expect(byId.content).not.toContain('Legacy compatibility output');
    }
  });

  it('keeps the historical body behind an explicit, prominent legacy mode', () => {
    const document = generateDocument('01_prd.md', { ...context, generationMode: 'legacy' });
    expect(document.content).toContain('Legacy compatibility output');
    expect(document.receipt).toBeUndefined();
  });

  it('generates the exact compatibility set for every scope', () => {
    const counts = { mvp: 4, standard: 12, comprehensive: 22 } as const;
    for (const [scope, count] of Object.entries(counts)) {
      expect(getTemplatesForScope(scope as keyof typeof counts)).toHaveLength(count);
      expect(generateAllDocuments({ ...context, scope: scope as keyof typeof counts })).toHaveLength(count);
    }
  });

  it('validates and renders structured evidence, source hashes, and lifecycle links', () => {
    const document = generateDocument('01_prd', {
      ...context,
      sourceRefs: ['docs/RFC-42.md'],
      sourceHashes: { 'docs/RFC-42.md': `sha256:${'a'.repeat(64)}` },
      evidence: [{ id: 'E-VERIFIED', claim: 'Release policy is approved', state: 'verified', sourceRefs: ['docs/RFC-42.md'], owner: 'Platform Council' }],
      traceGraph: {
        nodes: [
          { id: 'OBJ-1', documentId: 'DOC-ATLAS.PRD', label: 'Objective' },
          { id: 'REQ-1', documentId: 'DOC-ATLAS.PRD', label: 'Requirement' },
        ],
        edges: [{ from: 'OBJ-1', to: 'REQ-1', type: 'traces-to', rationale: 'Requirement realizes objective' }],
      },
    });
    expect(document.content).toContain('| Release policy is approved | verified | docs/RFC-42.md | Platform Council |');
    expect(document.content).toContain('| OBJ-1 | traces-to | REQ-1 | Requirement realizes objective |');
    expect(document.metadata?.sourceHashes['docs/RFC-42.md']).toMatch(/^sha256:/);
  });

  it('rejects unproven evidence and invalid generation-level trace graphs', () => {
    expect(() => generateDocument('01_prd', {
      ...context,
      evidence: [{ id: 'E-BAD', claim: 'Unsupported verification', state: 'verified', sourceRefs: ['SRC-MISSING'] }],
    })).toThrow(/undeclared source/);
    expect(() => generateDocument('01_prd', {
      ...context,
      traceGraph: {
        nodes: [
          { id: 'OBJ-1', documentId: 'DOC-X.PRD', label: 'Objective' },
          { id: 'TEST-1', documentId: 'DOC-X.PRD', label: 'Test' },
        ],
        edges: [{ from: 'OBJ-1', to: 'TEST-1', type: 'traces-to' }],
      },
    })).toThrow(/cannot trace/);
  });

  it('loads only explicitly requested example packs declared by the template', () => {
    const included = generateDocument('06_architecture', { ...context, includeExamplePacks: ['architecture-model-patterns'] });
    expect(included.content).toContain('## Opt-in illustrative examples');
    expect(included.content).toContain('# Architecture model patterns');
    expect(() => generateDocument('06_architecture', { ...context, includeExamplePacks: ['test-tooling'] })).toThrow(/not declared/);
  });
});
