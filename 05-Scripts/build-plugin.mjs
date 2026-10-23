#!/usr/bin/env node
import { build } from 'esbuild';
import { cpSync, mkdirSync, readFileSync, writeFileSync, readdirSync, existsSync, rmSync } from 'node:fs';
import { resolve, join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'dist', 'plugin');
const stage = join(out, 'blueprint-docs');
rmSync(stage, { recursive: true, force: true });
mkdirSync(stage, { recursive: true });
for (const path of ['skills', '.codex-plugin', '.claude-plugin', 'plugin.json', 'assets', 'examples', 'professional-templates', 'README.md', 'CONTRIBUTING.md', '000-docs', 'LICENSE', 'SECURITY.md']) {
  cpSync(join(root, path), join(stage, path), { recursive: true });
}
// Catalogs belong to the distribution root, not inside the plugin ZIP.
rmSync(join(stage, '.claude-plugin/marketplace.json'), { force: true });
const runtime = join(stage, 'skills/blueprint-docs/runtime');
const result = await build({
  entryPoints: [join(root, '05-Scripts/plugin-runtime.ts')],
  outfile: join(runtime, 'dist/core/blueprint.mjs'), bundle: true,
  platform: 'node', target: 'node20', format: 'esm', metafile: true,
  banner: { js: "import { createRequire as blueprintCreateRequire } from 'node:module'; const require = blueprintCreateRequire(import.meta.url);" },
});
mkdirSync(join(runtime, 'dist'), { recursive: true });
writeFileSync(join(runtime, 'dist/package.json'), JSON.stringify({ version: JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version }) + '\n');
cpSync(join(root, 'professional-templates/core'), join(runtime, 'templates/core'), { recursive: true });
cpSync(join(root, 'example-packs'), join(runtime, 'example-packs'), { recursive: true });

// Retain license notices for third-party code included by the bundler.
const packageDirs = new Set();
for (const input of Object.keys(result.metafile.inputs)) {
  if (!input.includes('node_modules/')) continue;
  let dir = dirname(resolve(root, input));
  while (dir.startsWith(root) && !existsSync(join(dir, 'package.json'))) dir = dirname(dir);
  if (existsSync(join(dir, 'package.json'))) packageDirs.add(dir);
}
const notices = [];
for (const dir of [...packageDirs].sort()) {
  const manifest = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
  const licenses = readdirSync(dir).filter(file => /^(licen[sc]e|copying|notice)(\.|$)/i.test(file));
  notices.push(`# ${manifest.name}@${manifest.version} (${manifest.license || 'see notice'})\n\n${licenses.map(file => readFileSync(join(dir, file), 'utf8')).join('\n')}`);
}
writeFileSync(join(runtime, 'THIRD-PARTY-NOTICES.txt'), notices.join('\n\n---\n\n') + '\n');

for (const [path, catalog] of [
  ['.agents/plugins/marketplace.json', {
    name: 'intent-blueprint', interface: { displayName: 'Intent Blueprint' },
    plugins: [{ name: 'blueprint-docs', source: { source: 'local', path: './blueprint-docs' },
      policy: { installation: 'AVAILABLE', authentication: 'ON_INSTALL' }, category: 'Productivity' }],
  }],
  ['.claude-plugin/marketplace.json', {
    name: 'intent-blueprint', owner: { name: 'intentsolutions.io LLC' },
    plugins: [{ name: 'blueprint-docs', source: './blueprint-docs' }],
  }],
]) {
  mkdirSync(dirname(join(out, path)), { recursive: true });
  writeFileSync(join(out, path), JSON.stringify(catalog, null, 2) + '\n');
}

const zip = join(out, 'blueprint-docs.zip');
rmSync(zip, { force: true });
const zipped = spawnSync('zip', ['-qr', zip, '.'], { cwd: stage, encoding: 'utf8' });
if (zipped.status !== 0) throw new Error(`ZIP packaging failed: ${zipped.stderr}`);
writeFileSync(`${zip}.sha256`, `${createHash('sha256').update(readFileSync(zip)).digest('hex')}  ${basename(zip)}\n`);
console.log(`Plugin: ${stage}\nSubmission ZIP: ${zip}`);
