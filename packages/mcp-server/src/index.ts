import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createMcpServer } from './server.js';
import { shutdownCore, closeAllGrpcClients } from './utils.js';

async function main(): Promise<void> {
  const server = createMcpServer();
  const transport = new StdioServerTransport();

  process.on('SIGINT', async () => {
    await shutdown(server);
  });

  process.on('SIGTERM', async () => {
    await shutdown(server);
  });

  await server.connect(transport);
}

async function shutdown(server: ReturnType<typeof createMcpServer>): Promise<void> {
  await shutdownCore();
  closeAllGrpcClients();
  await server.close();
  process.exit(0);
}

main().catch((error) => {
  console.error('Failed to start MCP server:', error);
  process.exit(1);
});
