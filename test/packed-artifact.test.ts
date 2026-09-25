import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const cliPackage = JSON.parse(readFileSync('packages/cli/package.json', 'utf8'));

describe('publishable npm artifact', () => {
  it('checks generated mirrors without mutating them during concurrent tests', () => {
    expect(cliPackage.scripts.prepack).toContain('sync-templates.mjs --check');
  });

  it('contains the tested schema renderer, exact corpus, governed examples, and package guidance', () => {
    const result = spawnSync('npm', ['pack', '--workspace=@intentsolutions/blueprint', '--dry-run', '--json'], {
      cwd: process.cwd(), encoding: 'utf8', maxBuffer: 8 * 1024 * 1024,
    });
    expect(result.status, result.stderr).toBe(0);
    const parsed = JSON.parse(result.stdout);
    const record = Array.isArray(parsed) ? parsed[0] : parsed['@intentsolutions/blueprint'];
    expect(record.version).toBe('3.0.0');
    const paths: string[] = record.files.map((file: { path: string }) => file.path);
    expect(paths).toContain('README.md');
    expect(paths).toContain('LICENSE.md');
    expect(paths).toContain('dist/core/catalog.js');
    expect(paths).toContain('dist/core/renderer.js');
    expect(paths).toContain('dist/core/schema.js');
    expect(paths.filter(path => /^templates\/core\/\d{2}_[a-z_]+\.md$/.test(path))).toHaveLength(22);
    expect(paths.filter(path => /^example-packs\/[a-z][a-z0-9-]+\.md$/.test(path))).toHaveLength(20);
  }, 20_000);

  it('runs the built CLI adapter against the typed scope catalog', () => {
    const result = spawnSync('node', ['packages/cli/dist/cli.js', 'list', '--scope', 'mvp'], {
      cwd: process.cwd(), encoding: 'utf8',
    });
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain('Total: 4 templates');
    expect(result.stdout).toContain('Product Requirements Document');
  });
});
