// Portions adapted from gstack (https://github.com/garrytan/gstack)
// Original: MIT License, Copyright (c) Garry Tan

/**
 * Documentation quality evaluation tests.
 *
 * Free tier: Static validation (no API key needed)
 * Paid tier: LLM-judge scoring (requires ANTHROPIC_API_KEY)
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const PROJECT_ROOT = path.resolve(__dirname, '..');
const TEMPLATES_DIR = path.join(PROJECT_ROOT, 'professional-templates', 'core');

function getTemplates(): Array<{ name: string; content: string }> {
  if (!fs.existsSync(TEMPLATES_DIR)) return [];
  return fs.readdirSync(TEMPLATES_DIR)
    .filter(f => f.endsWith('.md'))
    .sort()
    .map(f => ({
      name: f,
      content: fs.readFileSync(path.join(TEMPLATES_DIR, f), 'utf8'),
    }));
}

describe('Template static validation (free tier)', () => {
  const templates = getTemplates();

  it('has 22 templates', () => {
    expect(templates.length).toBe(22);
  });

  for (const tmpl of templates) {
    describe(`template: ${tmpl.name}`, () => {
      it('is not empty', () => {
        expect(tmpl.content.trim().length).toBeGreaterThan(0);
      });

      it('has a title (H1 header)', () => {
        expect(tmpl.content).toMatch(/^# .+/m);
      });

      it('has multiple sections (H2 headers)', () => {
        const h2Count = (tmpl.content.match(/^## .+/gm) || []).length;
        expect(h2Count).toBeGreaterThanOrEqual(2);
      });

      it('uses {{DATE}} placeholder (not hardcoded dates)', () => {
        const hasDatePlaceholder = tmpl.content.includes('{{DATE}}');
        expect(hasDatePlaceholder).toBe(true);
      });

      it('has no unresolved non-DATE placeholders', () => {
        // {{DATE}} is expected, but other {{PLACEHOLDER}} tokens should not be present
        const otherPlaceholders = tmpl.content.match(/\{\{(?!DATE\}\})[A-Z_]+\}\}/g);
        expect(otherPlaceholders).toBeNull();
      });

      it('follows naming convention (NN_description.md)', () => {
        expect(tmpl.name).toMatch(/^\d{2}_[a-z_]+\.md$/);
      });
    });
  }
});

// LLM-judge tests — only run when ANTHROPIC_API_KEY is set
const HAS_API_KEY = !!process.env.ANTHROPIC_API_KEY;

describe.skipIf(!HAS_API_KEY)('Template LLM-judge evaluation (paid tier)', () => {
  const templates = getTemplates();

  // Only test a subset to avoid excessive API costs
  const sampled = templates.filter(t =>
    ['01_prd.md', '06_architecture.md', '14_project_brief.md'].includes(t.name)
  );

  for (const tmpl of sampled) {
    it(`${tmpl.name} scores >= 3 on all dimensions`, async () => {
      // Dynamic import to avoid loading SDK when not needed
      const { judge } = await import('./helpers/llm-judge.js');
      const score = await judge(tmpl.name, tmpl.content);

      expect(score.clarity).toBeGreaterThanOrEqual(3);
      expect(score.completeness).toBeGreaterThanOrEqual(3);
      expect(score.actionability).toBeGreaterThanOrEqual(3);
      expect(score.audience_fit).toBeGreaterThanOrEqual(3);
    }, 30000); // 30s timeout for API calls
  }
});
