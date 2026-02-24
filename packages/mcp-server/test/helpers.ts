/**
 * E2E Test Helpers
 *
 * Sets up an in-process MCP server with mock gRPC backends and Core,
 * then connects an MCP Client to exercise tools end-to-end.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createMcpServer } from '../src/server.js';

export interface TestContext {
  server: Server;
  client: Client;
  cleanup: () => Promise<void>;
}

/**
 * Create a connected MCP client+server pair using in-memory transport.
 */
export async function setupTestContext(): Promise<TestContext> {
  const server = createMcpServer();
  const client = new Client({ name: 'test-client', version: '1.0.0' });

  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

  await server.connect(serverTransport);
  await client.connect(clientTransport);

  return {
    server,
    client,
    cleanup: async () => {
      await client.close();
      await server.close();
    },
  };
}

/**
 * Call a tool and return the parsed JSON result.
 */
export async function callTool(
  client: Client,
  name: string,
  args: Record<string, unknown> = {},
): Promise<{ result: unknown; isError: boolean }> {
  const response = await client.callTool({ name, arguments: args });

  const textContent = (response.content as Array<{ type: string; text: string }>).find(
    (c) => c.type === 'text',
  );

  const parsed = textContent ? JSON.parse(textContent.text) : null;
  return { result: parsed, isError: response.isError ?? false };
}

/**
 * List all tools from the server.
 */
export async function listTools(
  client: Client,
): Promise<Array<{ name: string; description: string }>> {
  const response = await client.listTools();
  return response.tools.map((t) => ({ name: t.name, description: t.description ?? '' }));
}
