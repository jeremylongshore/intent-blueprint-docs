#!/usr/bin/env node

import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const canonical = join(root, 'professional-templates', 'core');
const packaged = join(root, 'packages', 'cli', 'templates', 'core');
const canonicalExamples = join(root, 'example-packs');
const packagedExamples = join(root, 'packages', 'cli', 'example-packs');
const check = process.argv.includes('--check');
const files = readdirSync(canonical).filter(file => file.endsWith('.md')).sort();

if (files.length !== 22) {
  throw new Error(`Expected exactly 22 canonical templates, found ${files.length}`);
}

if (check) {
  const packagedFiles = readdirSync(packaged).filter(file => file.endsWith('.md')).sort();
  const mismatch = files.filter((file, index) =>
    file !== packagedFiles[index]
    || readFileSync(join(canonical, file), 'utf8') !== readFileSync(join(packaged, file), 'utf8'));
  if (mismatch.length || packagedFiles.length !== files.length) {
    throw new Error(`Packaged templates drifted from canonical source: ${mismatch.join(', ') || 'file set mismatch'}`);
  }
  const exampleFiles = readdirSync(canonicalExamples).filter(file => file.endsWith('.md')).sort();
  const packagedExampleFiles = readdirSync(packagedExamples).filter(file => file.endsWith('.md')).sort();
  const exampleMismatch = exampleFiles.filter((file, index) =>
    file !== packagedExampleFiles[index]
    || readFileSync(join(canonicalExamples, file), 'utf8') !== readFileSync(join(packagedExamples, file), 'utf8'));
  if (exampleMismatch.length || packagedExampleFiles.length !== exampleFiles.length) {
    throw new Error(`Packaged example packs drifted from canonical source: ${exampleMismatch.join(', ') || 'file set mismatch'}`);
  }
  console.log('Template package mirror matches the 22-file canonical corpus.');
} else {
  mkdirSync(packaged, { recursive: true });
  for (const file of files) cpSync(join(canonical, file), join(packaged, file));
  rmSync(packagedExamples, { recursive: true, force: true });
  cpSync(canonicalExamples, packagedExamples, { recursive: true });
  console.log(`Synced ${files.length} templates into the publishable package.`);
}
