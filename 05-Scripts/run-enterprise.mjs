#!/usr/bin/env node
// Orchestrates enterprise flow: intake (interactive or from file) → generate 22 docs.
// Usage:
//   node scripts/run-enterprise.mjs --project <name> [--answers /path/file] [--force]
import { spawn } from 'child_process';
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';

function parseArgs(argv) {
  const args = { force: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--project') args.project = argv[++i];
    else if (a === '--answers') args.answers = argv[++i];
    else if (a === '--force') args.force = true;
    else if (a === '--help' || a === '-h') args.help = true;
  }
  return args;
}

function sh(cmd, args, opts={}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: opts.stdio ?? 'inherit', shell: false });
    p.on('error', reject);
    p.on('close', (code) => code === 0 ? resolve() : reject(new Error(`${cmd} ${args.join(' ')} exited ${code}`)));
  });
}

async function ensureTemplates() {
  const dir = path.join(process.cwd(), 'professional-templates');
  const md = await findMdRecursive(dir);
  if (md.length < 22) throw new Error(`Expected 22 templates; found ${md.length}`);
}

async function findMdRecursive(dir) {
  const results = [];
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...await findMdRecursive(full));
    else if (entry.name.endsWith('.md')) results.push(full);
  }
  return results;
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help || !args.project) {
    console.log(`Usage:
  node scripts/run-enterprise.mjs --project <name> [--answers /path/file] [--force]`);
    process.exit(args.help ? 0 : 1);
  }

  if (!/^[a-zA-Z0-9_][a-zA-Z0-9_-]*$/.test(args.project)) throw new Error('Invalid project name');
  if (!args.force && fs.existsSync(path.join('completed-docs', args.project, '.metadata/generation-log.json'))) throw new Error('Output exists; use --force to replace it');
  await ensureTemplates();

  // Step 1: Enterprise intake
  const intakeOut = path.join(process.cwd(), 'completed-docs', args.project, 'enterprise-intake.md');
  const cliArgs = ['form-system/enterprise-cli.js', '--project', args.project];
  console.log(`\n📥 Running enterprise intake → ${intakeOut}`);
  if (args.answers) {
    if (!fs.existsSync(args.answers)) throw new Error(`Answers file not found: ${args.answers}`);
    await new Promise((resolve, reject) => {
      const p = spawn('node', cliArgs, { stdio: ['pipe','inherit','inherit'] });
      fs.createReadStream(args.answers).pipe(p.stdin);
      p.on('error', reject);
      p.on('close', (code) => code === 0 ? resolve() : reject(new Error(`enterprise-cli exited ${code}`)));
    });
  } else {
    await sh('node', cliArgs);
  }
  if (!fs.existsSync(intakeOut)) throw new Error('Intake did not produce enterprise-intake.md');

  // Step 2: Generate full suite
  const genArgs = ['scripts/generate-enterprise.mjs', '--project', args.project];
  if (args.force) genArgs.push('--force');
  console.log('\n🧱 Generating enterprise docs…');
  await sh('node', genArgs);

  await sh('node', ['scripts/verify-enterprise-output.mjs', args.project]);

  // Step 3: Quick audit
  const outDir = path.join(process.cwd(), 'completed-docs', args.project);
  const files = await fsp.readdir(outDir);
  const docs = files.filter(f => f.endsWith('.md'));
  const hasIndex = files.includes('index.md');
  const hasLog = fs.existsSync(path.join(outDir, '.metadata', 'generation-log.json'));

  console.log(`\n✅ Done:
  - Output dir: completed-docs/${args.project}
  - Markdown files: ${docs.length}
  - index.md: ${hasIndex ? 'present' : 'missing'}
  - generation-log.json: ${hasLog ? 'present' : 'missing'}`);

  if (!hasIndex || !hasLog || docs.length < 23) {
    console.error('⚠️ Audit warning: Expected 22 docs + index.md + log.');
    process.exit(3);
  }
}
main().catch(err => { console.error('❌ Runner error:', err.message); process.exit(1); });
