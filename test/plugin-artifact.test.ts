import { describe, expect, it } from 'vitest';
import { mkdtempSync, writeFileSync, readFileSync, readdirSync, rmSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

describe('self-contained skill plugin', () => {
  it('extracts and runs the canonical enterprise engine without checkout dependencies', () => {
    const build = spawnSync('node', ['scripts/build-plugin.mjs'], { encoding: 'utf8' });
    expect(build.status, build.stderr).toBe(0);
    const dir = mkdtempSync(join(tmpdir(), 'blueprint-plugin-test-'));
    try {
      const extracted = spawnSync('unzip', ['-q', resolve('dist/plugin/blueprint-docs.zip'), '-d', join(dir, 'plugin')], { encoding: 'utf8' });
      expect(extracted.status, extracted.stderr).toBe(0);
      const plugin = join(dir, 'plugin');
      const runtime = join(plugin, 'skills/blueprint-docs/runtime/dist/core/blueprint.mjs');
      const run = (args: string[]) => spawnSync('node', [runtime, ...args], { cwd: dir, encoding: 'utf8' });
      const catalog = run(['--list']);
      expect(catalog.status, catalog.stderr).toBe(0);
      expect(JSON.parse(catalog.stdout)).toHaveLength(22);
      const intake = join(dir, 'enterprise-intake.md');
      writeFileSync(intake, '# Discovery\n### 1. Recovery requirement\nA named operator must prove regional recovery.\n');
      const preview = run(['--enterprise-intake', intake, '--project', 'EnterpriseProof']);
      expect(preview.status, preview.stderr).toBe(0);
      expect(JSON.parse(preview.stdout).documents).toHaveLength(22);
      expect(existsSync(join(dir, 'output'))).toBe(false);
      const output = run(['--enterprise-intake', intake, '--project', 'EnterpriseProof', '--output', join(dir, 'output')]);
      expect(output.status, output.stderr).toBe(0);
      expect(readdirSync(join(dir, 'output', '.metadata/receipts'))).toHaveLength(22);
      expect(run(['--enterprise-intake', intake, '--project', 'EnterpriseProof', '--output', join(dir, 'output')]).status).not.toBe(0);
      expect(existsSync(join(plugin, '.mcp.json'))).toBe(false);
      const manifest = JSON.parse(readFileSync(join(plugin, 'plugin.json'), 'utf8'));
      expect(existsSync(join(plugin, manifest.extensions['com.openai'].interface.logo))).toBe(true);
      expect(readFileSync(join(plugin, 'skills/blueprint-docs/runtime/THIRD-PARTY-NOTICES.txt'), 'utf8')).toContain('zod');
    } finally { rmSync(dir, { recursive: true, force: true }); }
  }, 30_000);
});
