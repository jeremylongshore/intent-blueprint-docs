import { describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';

describe('enterprise script integration', () => {
  it('uses intake content, preserves files on collision, and detects edited output', () => {
    const root = mkdtempSync(join(tmpdir(), 'blueprint-enterprise-test-'));
    const project = join(root, 'Proof');
    mkdirSync(project);
    writeFileSync(join(project, 'enterprise-intake.md'), '# Intake\n### 1. Identity\nRequire team SSO with an accountable owner.\n\n---\n');
    const generate = () => spawnSync('node', [resolve('scripts/generate-enterprise.mjs'), '--project', 'Proof', '--out', root], { encoding: 'utf8' });
    const verify = () => spawnSync('node', [resolve('scripts/verify-enterprise-output.mjs'), 'Proof', '--out', root], { encoding: 'utf8' });
    try {
      const first = generate();
      expect(first.status, first.stderr).toBe(0);
      expect(verify().status).toBe(0);
      const filename = readdirSync(project).find(file => file.endsWith('01_prd.md'))!;
      const before = readFileSync(join(project, filename), 'utf8');
      expect(before).toContain('Require team SSO');
      expect(generate().status).not.toBe(0);
      expect(readFileSync(join(project, filename), 'utf8')).toBe(before);
      writeFileSync(join(project, filename), before + '\nUnreviewed edit.\n');
      expect(verify().status).not.toBe(0);
    } finally { rmSync(root, { recursive: true, force: true }); }
  }, 15_000);

  it('rejects invalid CLI options without creating output', () => {
    const parent = mkdtempSync(join(tmpdir(), 'blueprint-invalid-cli-'));
    try {
      const result = spawnSync('node', ['packages/cli/dist/cli.js', 'generate', '--name', 'Proof', '--description', 'A project', '--scope', 'nonsense', '--output', join(parent, 'output')], { encoding: 'utf8' });
      expect(result.status).not.toBe(0);
      expect(readdirSync(parent)).toHaveLength(0);
    } finally { rmSync(parent, { recursive: true, force: true }); }
  });
});
