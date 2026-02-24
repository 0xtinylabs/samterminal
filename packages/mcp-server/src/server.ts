import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import type { ToolDefinition } from './utils.js';

import { tokenTools } from './tools/token.js';
import { walletTools } from './tools/wallet.js';
import { swapTools } from './tools/swap.js';
import { flowTools } from './tools/flow.js';
import { notificationTools } from './tools/notification.js';
import { aiTools } from './tools/ai.js';
import { schedulerTools } from './tools/scheduler.js';
import { chainTools } from './tools/chain.js';
import { pluginTools } from './tools/plugin.js';

const ALL_TOOLS: ToolDefinition[] = [
  ...tokenTools,
  ...walletTools,
  ...swapTools,
  ...flowTools,
  ...notificationTools,
  ...aiTools,
  ...schedulerTools,
  ...chainTools,
  ...pluginTools,
];

const toolMap = new Map<string, ToolDefinition>();
for (const tool of ALL_TOOLS) {
  toolMap.set(tool.name, tool);
}

export function createMcpServer(): Server {
  const server = new Server(
    {
      name: 'SAM Terminal',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: ALL_TOOLS.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const tool = toolMap.get(name);

    if (!tool) {
      return {
        content: [{ type: 'text', text: JSON.stringify({ error: `Unknown tool: ${name}` }) }],
        isError: true,
      };
    }

    try {
      const result = await tool.handler((args as Record<string, unknown>) ?? {});
      return {
        content: [{ type: 'text', text: JSON.stringify(result ?? null, null, 2) }],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: 'text', text: JSON.stringify({ error: message }) }],
        isError: true,
      };
    }
  });

  return server;
}
