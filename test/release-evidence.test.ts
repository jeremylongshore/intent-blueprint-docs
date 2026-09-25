import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const workflow = readFileSync('.github/workflows/release.yml', 'utf8');
const packedSmoke = readFileSync('scripts/smoke-packed-artifact.mjs', 'utf8');
const receiptBuilder = readFileSync('scripts/create-release-receipt.mjs', 'utf8');
const modernizationAudit = readFileSync('000-docs/011-AT-AUDT-template-system-modernization.md', 'utf8');

describe('release evidence contract', () => {
  it('records a timeless publication evidence contract', () => {
    expect(modernizationAudit).toContain('**Status:** Implemented for v3.0.0; publication is evidenced by the npm registry and GitHub release');
    expect(modernizationAudit).not.toMatch(/(?:publication receipt|release verification) pending/i);
  });

  it('tests and publishes the same packed artifact with provenance', () => {
    expect(workflow).toContain('id-token: write');
    expect(workflow).toContain('npm pack --workspace=@intentsolutions/blueprint --json');
    expect(workflow).toContain('Smoke-test the exact tarball');
    expect(workflow).toContain('scripts/smoke-packed-artifact.mjs');
    expect(packedSmoke).toContain('StdioClientTransport');
    expect(packedSmoke).toContain("node_modules', '.bin', 'blueprint-mcp'");
    expect(workflow).toContain('npm publish "$TARBALL" --access public --provenance');
    expect(workflow).toContain('actions/attest-build-provenance@v2');
  });

  it('emits an SBOM, checksum, receipt, and attached release evidence', () => {
    expect(workflow).toContain('npm sbom --workspace=@intentsolutions/blueprint --sbom-format cyclonedx');
    expect(workflow).toContain('sha256sum "$TARBALL"');
    expect(workflow).toContain('release-receipt.json');
    expect(workflow).toContain('blueprint-sbom.cdx.json');
    expect(workflow).toContain('audit signatures');
    expect(workflow).toContain('PUBLISHED_INTEGRITY');
    expect(receiptBuilder).toContain('artifactSha256');
    expect(receiptBuilder).toContain('packageLockSha256');
    expect(receiptBuilder).toContain("sbom: { path: sbomPath");
    expect(receiptBuilder).toContain('registryIntegrity');
    expect(receiptBuilder).toContain('rollback');
  });

  it('checks generated mirrors before a build can overwrite them', () => {
    expect(workflow.indexOf('Check generated mirrors before build')).toBeLessThan(workflow.indexOf('Build all packages'));
  });
});
