import { describe, expect, it } from 'vitest';
import { mkdtempSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { generateAllDocuments, generateDocument, writeDocuments, getTemplatesForScope } from '../src/core/index.js';
import { generateEnterpriseDocuments } from '../src/core/enterprise.js';
import { GitHubExporter } from '../src/integrations/github/exporter.js';
import { LinearExporter } from '../src/integrations/linear/exporter.js';
import { JiraExporter } from '../src/integrations/jira/exporter.js';
import { parseTaskRecords } from '../src/integrations/tasks.js';
import { InterviewEngine, runAdaptiveInterview } from '../src/interview/index.js';
import { ApiServer } from '../src/enterprise/api/server.js';

const context = { projectName: 'Workflow Proof', projectDescription: 'Project-specific discovery', scope: 'comprehensive' as const, audience: 'enterprise' as const };

describe('enterprise discovery and persisted provenance', () => {
  it('carries distinct intake facts and source hashes through every canonical workbook', () => {
    const intake = '# Enterprise Intake\n### 1. Required controls\nOffline SMS with a named control owner.\n\n---\n';
    const docs = generateEnterpriseDocuments(context.projectName, intake);
    const changed = generateEnterpriseDocuments(context.projectName, intake.replace('Offline SMS', 'Regional residency'));
    expect(docs).toHaveLength(22);
    for (const [index, doc] of docs.entries()) {
      expect(doc.content).toContain('Offline SMS');
      expect(doc.metadata?.sourceRefs).toContain('enterprise-intake.md');
      expect(doc.metadata?.sourceHashes).not.toEqual(changed[index].metadata?.sourceHashes);
      expect(changed[index].content).toContain('Regional residency');
      expect(doc.metadata?.status).toBe('draft');
    }
    expect(() => generateEnterpriseDocuments('Empty', '### 1. Controls\n_(no answer)_\n')).toThrow(/no answered/);
  });

  it('writes verifiable receipts and refuses collisions before changing any file', () => {
    const dir = mkdtempSync(join(tmpdir(), 'blueprint-receipts-test-'));
    try {
      const docs = [generateDocument('01_prd', context)];
      writeDocuments(docs, dir, { overwrite: false });
      const receipt = JSON.parse(readFileSync(join(dir, '.metadata/receipts', `${docs[0].filename}.json`), 'utf8'));
      const content = readFileSync(join(dir, docs[0].filename), 'utf8');
      expect(receipt.documentHash).toBe(`sha256:${createHash('sha256').update(content).digest('hex')}`);
      expect(() => writeDocuments([{ ...docs[0], content: 'changed' }], dir, { overwrite: false })).toThrow(/already exists/);
      expect(readFileSync(join(dir, docs[0].filename), 'utf8')).toBe(content);
      expect(() => writeDocuments([], join(dir, 'empty'))).toThrow(/No documents/);
      expect(existsSync(join(dir, 'empty'))).toBe(false);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
});

describe('export record boundaries', () => {
  const github = new GitHubExporter({ token: 'unused', owner: 'audit', repo: 'unused' });
  const linear = new LinearExporter({ apiKey: 'unused', teamId: 'unused' });
  const jira = new JiraExporter({ baseUrl: 'https://example.invalid', email: 'unused@example.invalid', apiToken: 'unused', projectKey: 'TEST' });

  it('exports zero tasks or invented phases from unfilled workbooks in all three adapters', async () => {
    const docs = generateAllDocuments(context);
    const gh = await github.preview(docs, context);
    const li = await linear.preview(docs);
    const ji = await jira.preview(docs);
    expect(gh.tasks).toHaveLength(0);
    expect(gh.phases).toHaveLength(0);
    expect(li.issues).toHaveLength(0);
    expect(li.cycles).toHaveLength(0);
    expect(ji.stories).toHaveLength(0);
    expect(ji.tasks).toHaveLength(0);
    expect(ji.sprints).toHaveLength(0);
    expect(ji.versions).toHaveLength(0);
  });

  it('preserves explicit task title, priority, description and acceptance criteria', async () => {
    const doc = { name: 'Delivery tasks', category: 'Development', filename: 'tasks.md', content: `## TASK-LOGIN: Add team sign-in\nPriority: high\nUse the existing identity provider.\n### Acceptance criteria\n- [ ] A team member can sign in.\n## Evidence register\n- Unknown\n\n\`\`\`md\n## TASK-EXAMPLE: Never export fenced examples\n\`\`\`\n` };
    const gh = await github.preview([doc], context);
    const li = await linear.preview([doc]);
    const ji = await jira.preview([doc]);
    expect(gh.tasks).toHaveLength(1);
    expect(gh.tasks[0]).toMatchObject({ title: 'Add team sign-in', priority: 'high', acceptanceCriteria: ['A team member can sign in.'] });
    expect(li.issues.map(issue => issue.title)).toEqual(['Add team sign-in']);
    expect(ji.stories.map(story => story.fields.summary)).toEqual(['Add team sign-in']);
    expect(gh.tasks[0].description).toContain('existing identity provider');
    expect(() => parseTaskRecords('## TASK-A: First\n## TASK-A: Second')).toThrow(/Duplicate/);
  });
});

describe('adaptive interview and invalid inputs', () => {
  it('asks newly activated compliance and competitor questions and omits inapplicable frontend questions', async () => {
    const engine = new InterviewEngine();
    const asked: string[] = [];
    await runAdaptiveInterview(engine, async question => {
      asked.push(question.id);
      const answers: Record<string, unknown> = { projectName: 'API Proof', projectDescription: 'An enterprise API for team identity and release evidence. It serves existing internal systems.', projectType: 'API / Backend Service', audience: 'Enterprise - Thorough, compliance-ready', hasCompetitors: true, competitorNames: 'Existing Service', needsCompliance: true, complianceTypes: ['SOC 2'], scope: 'MVP (4 docs) - Just the essentials to get started' };
      if (question.id in answers) return answers[question.id];
      if (question.type === 'confirm') return false;
      if (question.type === 'multiselect') return [];
      if (question.type === 'select') return question.options?.[0];
      if (question.type === 'number') return 1;
      return 'Provided during interview';
    });
    expect(asked).toContain('competitorNames');
    expect(asked).toContain('needsCompliance');
    expect(asked).toContain('complianceTypes');
    expect(asked).not.toContain('hasFrontend');
    expect(engine.getState().isComplete).toBe(true);
    expect(generateDocument('01_prd', engine.toTemplateContext()).content).toContain('complianceTypes: ["SOC 2"]');
  });

  it('rejects invalid scopes and audiences at the library boundary', () => {
    expect(() => getTemplatesForScope('nonsense' as 'mvp')).toThrow(/Invalid scope/);
    expect(() => generateDocument('01_prd', { ...context, audience: 'nonsense' as 'business' })).toThrow(/Invalid audience/);
  });
});

describe('enterprise REST catalog', () => {
  it('serves the canonical catalog, renders evidence-backed drafts, and rejects unsupported registration', async () => {
    const server = new ApiServer({ port: 0, host: '127.0.0.1', logging: false, apiKey: 'fixture-key' });
    await server.start();
    try {
      const address = server.address;
      if (!address || typeof address === 'string') throw new Error('No listening address');
      const base = `http://127.0.0.1:${address.port}`;
      expect((await fetch(`${base}/api/templates`)).status).toBe(401);
      const headers = { 'x-api-key': 'fixture-key', 'content-type': 'application/json' };
      const catalog = await (await fetch(`${base}/api/templates`, { headers })).json();
      expect(catalog.data.total).toBe(22);
      const generated = await (await fetch(`${base}/api/generate`, {
        method: 'POST', headers,
        body: JSON.stringify({ templateId: '01_prd', variables: { ...context, evidence: ['A required regional constraint.'] } }),
      })).json();
      expect(generated.data.content).toContain('A required regional constraint.');
      expect(generated.data.receipt.documentId).toBe(generated.data.metadata.documentId);
      expect((await fetch(`${base}/api/webhooks`, { method: 'POST', headers, body: '{}' })).status).toBe(501);
      expect((await fetch(`${base}/api/generate`, {
        method: 'POST', headers, body: JSON.stringify({ templateId: '01_prd', variables: { ...context, scope: 'invalid' } }),
      })).status).toBe(400);
    } finally { await server.stop(); }
  });
});
