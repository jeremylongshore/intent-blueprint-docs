#!/usr/bin/env node

import { readFileSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const rootPackage = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const cliPackage = JSON.parse(readFileSync(join(root, 'packages', 'cli', 'package.json'), 'utf8'));
if (rootPackage.version !== cliPackage.version) {
  throw new Error(`Runtime version drift: root=${rootPackage.version}, cli=${cliPackage.version}`);
}
for (const path of ['.claude-plugin/plugin.json', '.codex-plugin/plugin.json', 'gemini-extension.json']) {
  const manifest = JSON.parse(readFileSync(join(root, path), 'utf8'));
  if (manifest.version !== cliPackage.version) {
    throw new Error(`Adapter version drift in ${path}: ${manifest.version} != ${cliPackage.version}`);
  }
}
const installTarget = `@intentsolutions/blueprint@${cliPackage.version}`;
for (const path of ['.mcp.json', '.cursor/mcp.json', 'gemini-extension.json', 'README.md', '000-docs/004-DR-SPEC-mcp-server-integration.md']) {
  if (!readFileSync(join(root, path), 'utf8').includes(installTarget)) {
    throw new Error(`Adapter install target drift in ${path}: expected ${installTarget}`);
  }
}
const skill = readFileSync(join(root, 'skills', 'blueprint-docs', 'SKILL.md'), 'utf8');
if (!skill.includes(`version: "${cliPackage.version}"`)) throw new Error('Portable skill version drift');
if (!readFileSync(join(root, 'CLAUDE.md'), 'utf8').includes(`Release:** v${cliPackage.version}`)) throw new Error('CLAUDE.md release drift');
const runtimeDir = join(root, 'packages', 'cli', 'src');
const hardcoded = readdirSync(runtimeDir, { recursive: true })
  .filter(file => typeof file === 'string' && file.endsWith('.ts') && !['version.ts', 'core/catalog.ts'].includes(file))
  .filter(file => {
    const content = readFileSync(join(runtimeDir, file), 'utf8');
    return content.includes(`'${cliPackage.version}'`) || content.includes(`"${cliPackage.version}"`);
  });
if (hardcoded.length) {
  throw new Error(`Runtime version must come from src/version.ts; hardcoded in: ${hardcoded.join(', ')}`);
}
const releaseRun = process.env.GITHUB_REF_TYPE === 'tag';
const tag = releaseRun ? process.env.GITHUB_REF_NAME : process.argv[2];
if (tag && tag !== `v${cliPackage.version}`) {
  throw new Error(`Release tag ${tag} does not match package version v${cliPackage.version}`);
}
if (releaseRun && tag) {
  const taggedSha = spawnSync('git', ['rev-list', '-n', '1', tag], { cwd: root, encoding: 'utf8' });
  if (taggedSha.status !== 0 || taggedSha.stdout.trim() !== process.env.GITHUB_SHA) {
    throw new Error(`Release tag ${tag} does not point to the workflow source SHA`);
  }
  const published = spawnSync('npm', ['view', `@intentsolutions/blueprint@${cliPackage.version}`, 'version', '--json'], { encoding: 'utf8' });
  if (published.status === 0 && published.stdout.trim() && published.stdout.trim() !== 'null') {
    throw new Error(`@intentsolutions/blueprint@${cliPackage.version} is already published`);
  }
  const lookupOutput = `${published.stdout}\n${published.stderr}`;
  if (published.status !== 0 && !/E404|is not in this registry|No match found/i.test(lookupOutput)) {
    throw new Error(`Unable to verify npm version availability: ${lookupOutput.trim()}`);
  }
}
console.log(`Release version verified: ${cliPackage.version}`);
