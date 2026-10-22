import { describe, expect, it } from 'vitest';
import { mkdtempSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { DocGenerator } from '../src/shared/generator.js';
import { DocDelivery } from '../src/shared/delivery.js';

describe('local bot generation and delivery boundaries', () => {
  it('archives canonical workbooks and receipts and cleans up generated files', async () => {
    const temp = mkdtempSync(join(tmpdir(), 'blueprint-bot-test-'));
    try {
      const generator = new DocGenerator(temp);
      const result = await generator.generate({ projectName: 'Bot Proof', projectDescription: 'Local artifact delivery', scope: 'mvp' });
      const entries = spawnSync('unzip', ['-Z1', result.zipPath], { encoding: 'utf8' });
      expect(entries.status).toBe(0);
      expect(entries.stdout).toContain('.metadata/receipts/');
      expect(result.files.filter(file => file.endsWith('.md'))).toHaveLength(5);
      expect(readFileSync(result.files.find(file => file.endsWith('01_prd.md'))!, 'utf8')).toContain('Local artifact delivery');
      generator.cleanup(result.outputDir, result.zipPath);
      expect(existsSync(result.zipPath)).toBe(false);
      expect(existsSync(result.outputDir)).toBe(false);
    } finally { rmSync(temp, { recursive: true, force: true }); }
  });

  it('refuses email delivery without SMTP configuration', async () => {
    const result = await new DocDelivery().sendEmail('unused@example.invalid', 'Proof', '/unused.zip');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Email not configured');
  });
});
