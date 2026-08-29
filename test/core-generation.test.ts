import { describe, expect, it } from 'vitest';
import { generateDocument, listTemplates } from '../packages/cli/src/core/index.js';

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
    expect(document.content).toContain('deterministic Blueprint workbook');
    expect(document.content).toContain('generated_at: "2026-08-28T12:00:00.000Z"');
  });

  it('only accepts catalog template IDs', () => {
    expect(() => generateDocument('../../README', context)).toThrow(/Unknown template ID/);
  });

  it('exposes exactly the canonical 22-template set', () => {
    expect(listTemplates()).toHaveLength(22);
  });
});
