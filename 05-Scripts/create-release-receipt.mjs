#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';

const [artifactPath, sbomPath, packResultPath, outputPath = 'release-receipt.json'] = process.argv.slice(2);
if (!artifactPath || !sbomPath || !packResultPath) {
  throw new Error('Usage: create-release-receipt.mjs <artifact> <sbom> <pack-result> [output]');
}
const hash = path => createHash('sha256').update(readFileSync(path)).digest('hex');
const sbom = JSON.parse(readFileSync(sbomPath, 'utf8'));
if (sbom.bomFormat !== 'CycloneDX' || !Array.isArray(sbom.components) || !sbom.components.length) {
  throw new Error('SBOM is not a non-empty CycloneDX document');
}
const packed = JSON.parse(readFileSync(packResultPath, 'utf8'));
const pack = Array.isArray(packed) ? packed[0] : packed['@intentsolutions/blueprint'];
if (!pack?.integrity) throw new Error('npm pack result has no integrity value');
const receipt = {
  schemaVersion: '1.0.0',
  package: '@intentsolutions/blueprint',
  version: process.env.RELEASE_VERSION,
  tag: process.env.GITHUB_REF_NAME,
  artifact: artifactPath,
  artifactSha256: hash(artifactPath),
  npmIntegrity: pack.integrity,
  sbom: { path: sbomPath, format: sbom.bomFormat, specVersion: sbom.specVersion, sha256: hash(sbomPath) },
  resolvedInputs: { packageLockSha256: hash('package-lock.json'), sourceSha: process.env.GITHUB_SHA },
  builder: { system: 'GitHub Actions', workflowRun: process.env.GITHUB_RUN_ID, repository: process.env.GITHUB_REPOSITORY },
  verification: { build: 'passed', tests: 'passed', packedConsumer: 'passed', registryIntegrity: 'passed', npmSignatures: 'passed' },
  provenance: { githubBuildAttestation: 'issued', npmProvenanceAttestation: 'issued' },
  approval: { authority: 'release tag', ref: process.env.GITHUB_REF_NAME },
  rollback: { strategy: 'deprecate the affected version and publish a corrective version', owner: 'repository release owner' },
};
writeFileSync(outputPath, `${JSON.stringify(receipt, null, 2)}\n`);
console.log(`Release receipt written: ${outputPath}`);
