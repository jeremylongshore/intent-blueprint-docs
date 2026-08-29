import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const readme = fs.readFileSync(path.resolve(__dirname, '..', 'README.md'), 'utf8');
const firstScreen = readme.split('\n').slice(0, 20).join('\n');
const opening = readme.split('\n').slice(0, 18).join('\n');

describe('README 30-second path', () => {
  it('states the outcome, audience, deliverable, and next action above the fold', () => {
    expect(firstScreen).toContain('Turn a rough idea into a clear project plan');
    expect(firstScreen).toMatch(/founders, product owners, agencies, and engineering teams/i);
    expect(firstScreen).toContain('## Start in 30 seconds — no install');
    expect(firstScreen).toContain('Use the blueprint-docs skill in this repository');
    expect(firstScreen).toContain('project brief');
    expect(firstScreen.split(/\s+/).length).toBeLessThanOrEqual(150);
  });

  it('does not lead with implementation jargon', () => {
    expect(opening).not.toMatch(/\b(MCP|canonical|adapter|provenance|deterministic)\b/);
  });

  it('sets an honest review boundary', () => {
    expect(firstScreen).toMatch(/draft for review/i);
    expect(firstScreen).toMatch(/evidence, assumptions, and unknowns/i);
  });
});
