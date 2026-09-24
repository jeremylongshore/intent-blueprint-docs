#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const installDir = resolve(process.argv[2] || '');
if (!process.argv[2]) throw new Error('Usage: smoke-packed-artifact.mjs <consumer-install-directory>');

const blueprint = await import(pathToFileURL(join(installDir, 'node_modules', '@intentsolutions', 'blueprint', 'dist', 'index.js')).href);
const templates = blueprint.listTemplates();
if (templates.length !== 22) throw new Error(`Expected 22 templates, got ${templates.length}`);
const document = blueprint.generateDocument('01_prd', {
  projectName: 'Release Smoke', projectDescription: 'Test the packed artifact.', scope: 'mvp', audience: 'business',
});
if (!document.receipt || document.receipt.templateVersion !== '3.0.0') throw new Error('Schema receipt missing');

const cliPath = join(installDir, 'node_modules', '.bin', 'blueprint');
const cli = spawnSync(cliPath, ['--version'], { encoding: 'utf8' });
if (cli.status !== 0 || cli.stdout.trim() !== blueprint.VERSION) {
  throw new Error(`Packed CLI failed: ${cli.stderr || cli.stdout}`);
}

const sdkRoot = join(installDir, 'node_modules', '@modelcontextprotocol', 'sdk', 'dist', 'esm');
const { Client } = await import(pathToFileURL(join(sdkRoot, 'client', 'index.js')).href);
const { StdioClientTransport } = await import(pathToFileURL(join(sdkRoot, 'client', 'stdio.js')).href);
const transport = new StdioClientTransport({ command: join(installDir, 'node_modules', '.bin', 'blueprint-mcp') });
const client = new Client({ name: 'packed-blueprint-smoke', version: '1.0.0' });
try {
  await client.connect(transport);
  const tools = await client.listTools();
  if (tools.tools.length !== 4) throw new Error(`Expected 4 MCP tools, got ${tools.tools.length}`);
  const response = await client.callTool({
    name: 'blueprint_generate',
    arguments: { projectName: 'Packed MCP', projectDescription: 'Verify the stdio binary.', scope: 'mvp' },
  });
  if (response.isError || !JSON.stringify(response.content).includes('No files were written')) {
    throw new Error('Packed MCP generate preview failed');
  }
} finally {
  await client.close();
}

console.log(`Packed artifact verified: ${templates.length} templates, CLI ${blueprint.VERSION}, 4 MCP tools`);
