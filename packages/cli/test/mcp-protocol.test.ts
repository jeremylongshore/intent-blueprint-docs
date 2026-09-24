import { afterEach, describe, expect, it } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createMcpServer } from '../src/mcp/index.js';

const open: Array<{ close(): Promise<void> }> = [];

afterEach(async () => {
  await Promise.allSettled(open.splice(0).map(item => item.close()));
});

async function connectedClient(): Promise<Client> {
  const server = createMcpServer();
  const client = new Client({ name: 'blueprint-protocol-test', version: '1.0.0' });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  open.push(client, server);
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  return client;
}

describe('MCP protocol boundary', () => {
  it('negotiates and exposes exactly four tools', async () => {
    const client = await connectedClient();
    const response = await client.listTools();
    expect(response.tools.map(tool => tool.name).sort()).toEqual([
      'blueprint_customize', 'blueprint_generate', 'blueprint_interview', 'blueprint_list_templates',
    ]);
    const customize = response.tools.find(tool => tool.name === 'blueprint_customize');
    expect(customize?.inputSchema.required).toContain('projectDescription');
  });

  it('previews schema-backed output without writing by default', async () => {
    const client = await connectedClient();
    const response = await client.callTool({
      name: 'blueprint_generate',
      arguments: { projectName: 'Protocol Proof', projectDescription: 'Verify MCP behavior.', scope: 'mvp' },
    });
    expect(response.isError).not.toBe(true);
    expect(response.content[0]).toMatchObject({ type: 'text' });
    expect(response.content[0]).toHaveProperty('text', expect.stringContaining('No files were written'));
    expect(response.content[0]).toHaveProperty('text', expect.stringContaining('Draft for human review'));
  });

  it('returns a structured tool error for invalid catalog paths', async () => {
    const client = await connectedClient();
    const response = await client.callTool({
      name: 'blueprint_customize',
      arguments: { templateId: '../../README', projectName: 'Unsafe', projectDescription: 'Reject traversal.', customFields: {} },
    });
    expect(response.isError).toBe(true);
    expect(response.content[0]).toHaveProperty('text', expect.stringContaining('Unknown template ID'));
  });
});
