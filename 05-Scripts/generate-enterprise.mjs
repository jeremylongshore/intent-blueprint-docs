#!/usr/bin/env node
// Enterprise discovery -> canonical schema workbooks and persisted receipts.
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { generateEnterpriseDocuments, writeDocuments, VERSION } from '../packages/cli/dist/index.js';

const args = { out: 'completed-docs', force: false };
for (let i = 2; i < process.argv.length; i++) {
  const key = process.argv[i];
  if (key === '--project') args.project = process.argv[++i];
  else if (key === '--out') args.out = process.argv[++i];
  else if (key === '--force') args.force = true;
  else if (key === '--help' || key === '-h') args.help = true;
  else throw new Error(`Unknown option: ${key}`);
}
try {
  if (args.help || !args.project) {
    console.log('Usage: node scripts/generate-enterprise.mjs --project <name> [--out completed-docs] [--force]');
    process.exit(args.help ? 0 : 1);
  }
  if (!/^[a-zA-Z0-9_][a-zA-Z0-9_-]*$/.test(args.project)) throw new Error('Project must be a simple name using letters, digits, hyphens or underscores');
  const projectDir = resolve(args.out, args.project);
  const intake = readFileSync(join(projectDir, 'enterprise-intake.md'), 'utf8');
  const docs = generateEnterpriseDocuments(args.project, intake);
  const files = writeDocuments(docs, projectDir, { overwrite: args.force });
  const metaDir = join(projectDir, '.metadata');
  mkdirSync(metaDir, { recursive: true });
  writeFileSync(join(metaDir, 'generation-log.json'), JSON.stringify({
    version: 2, generatorVersion: VERSION, project: args.project,
    templates: docs.map(doc => doc.filename), intake: 'enterprise-intake.md',
    receipts: docs.map(doc => `.metadata/receipts/${doc.filename}.json`),
    outDir: projectDir,
  }, null, 2) + '\n');
  console.log(`Generated ${docs.length} enterprise workbooks and ${docs.length} receipts (${files.length} files) in ${projectDir}`);
} catch (error) {
  console.error(`Enterprise generation failed: ${error.message}`);
  process.exitCode = 1;
}
