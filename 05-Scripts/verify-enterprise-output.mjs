#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';
import { load } from 'js-yaml';
import { generateEnterpriseDocuments, DocumentMetadataSchema, GenerationReceiptSchema } from '../packages/cli/dist/index.js';

const project = process.argv[2];
const outIndex = process.argv.indexOf('--out');
try {
  if (!project || !/^[a-zA-Z0-9_][a-zA-Z0-9_-]*$/.test(project)) throw new Error('Usage: verify-enterprise-output.mjs <project> [--out <root>]');
  const dir = resolve(outIndex < 0 ? 'completed-docs' : process.argv[outIndex + 1], project);
  const intake = readFileSync(join(dir, 'enterprise-intake.md'), 'utf8');
  const expected = generateEnterpriseDocuments(project, intake);
  const log = JSON.parse(readFileSync(join(dir, '.metadata/generation-log.json'), 'utf8'));
  const sourceHash = `sha256:${createHash('sha256').update(intake).digest('hex')}`;
  if (JSON.stringify(log.templates) !== JSON.stringify(expected.map(doc => doc.filename))) throw new Error('Generated catalog differs from canonical enterprise scope');
  const index = readFileSync(join(dir, 'index.md'), 'utf8');
  for (const doc of expected) {
    const content = readFileSync(join(dir, doc.filename), 'utf8');
    const frontmatter = content.match(/^---\n([\s\S]*?)\n---\n/);
    if (!frontmatter) throw new Error(`Missing schema metadata: ${doc.filename}`);
    const metadata = DocumentMetadataSchema.parse(load(frontmatter[1]).blueprint);
    if (metadata.sourceHashes['enterprise-intake.md'] !== sourceHash || metadata.status !== 'draft') throw new Error(`Intake provenance or draft state mismatch: ${doc.filename}`);
    // The source responses must survive generation, not merely a link to intake.
    const expectedEvidence = doc.content.split('### Evidence\n\n')[1]?.split('\n### Assumptions')[0];
    if (!expectedEvidence || !content.includes(expectedEvidence)) throw new Error(`Missing intake evidence: ${doc.filename}`);
    const receipt = GenerationReceiptSchema.parse(JSON.parse(readFileSync(join(dir, '.metadata/receipts', `${doc.filename}.json`), 'utf8')));
    if (receipt.documentHash !== `sha256:${createHash('sha256').update(content).digest('hex')}` || receipt.documentId !== metadata.documentId) throw new Error(`Receipt mismatch: ${doc.filename}`);
    if (!index.includes(`./${doc.filename}`)) throw new Error(`Missing index entry: ${doc.filename}`);
  }
  console.log(JSON.stringify({ ok: true, workbooks: expected.length, receipts: expected.length, intakeProvenance: true }));
} catch (error) {
  console.error(`Enterprise verification failed: ${error.message}`);
  process.exitCode = 1;
}
