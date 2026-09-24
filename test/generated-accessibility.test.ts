import { describe, expect, it } from 'vitest';
import { generateDocument, listTemplates } from '../packages/cli/src/core/index.js';

describe('generated document accessibility boundary', () => {
  it('keeps all default outputs readable without diagrams or visual-only status', () => {
    for (const template of listTemplates()) {
      const document = generateDocument(template.id, {
        projectName: 'Accessible Blueprint', projectDescription: 'A plain-text verification fixture.',
        scope: 'comprehensive', audience: 'business', generatedAt: '2026-08-28T12:00:00.000Z',
      });
      expect(document.content).not.toContain('```mermaid');
      expect(document.content).not.toMatch(/🟢|🟡|🔴/u);
      expect(document.content).toContain('Evidence state');
      expect(document.content).toContain('| Claim | State | Sources | Owner |');
    }
  });
});
