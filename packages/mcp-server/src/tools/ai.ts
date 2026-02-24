import { getGrpcClient, callGrpc, getCore, type ToolDefinition } from '../utils.js';
import type * as grpc from '@grpc/grpc-js';

function getAIClient(): grpc.Client {
  return getGrpcClient('ai', 'ai.proto', 'ai', 'AIService');
}

export const aiTools: ToolDefinition[] = [
  {
    name: 'sam_ai_generate',
    description: 'Generate text using AI. Useful for trading analysis, market summaries, strategy suggestions, and natural language responses.',
    inputSchema: {
      type: 'object',
      properties: {
        messages: {
          type: 'array',
          description: 'Chat messages array. Each message: { role: "SYSTEM"|"USER"|"ASSISTANT"|"TOOL", content: "..." }',
          items: {
            type: 'object',
            properties: {
              role: { type: 'string', enum: ['ASSISTANT', 'SYSTEM', 'TOOL', 'USER'] },
              content: { type: 'string' },
            },
            required: ['role', 'content'],
          },
        },
        temperature: { type: 'number', description: 'Temperature for generation (0.0-1.0, default: 0.7)' },
        apikey: { type: 'string', description: 'Optional API key override' },
      },
      required: ['messages'],
    },
    handler: async (args) => {
      const client = getAIClient();
      return callGrpc(client, 'generateText', {
        messages: args.messages,
        temperature: args.temperature,
        apikey: args.apikey,
      });
    },
  },
  {
    name: 'sam_ai_generate_json',
    description: 'Generate structured JSON output using AI. Useful for extracting structured data, creating trading parameters, or generating configuration objects.',
    inputSchema: {
      type: 'object',
      properties: {
        messages: {
          type: 'array',
          description: 'Chat messages array. Each message: { role: "SYSTEM"|"USER"|"ASSISTANT"|"TOOL", content: "..." }',
          items: {
            type: 'object',
            properties: {
              role: { type: 'string', enum: ['ASSISTANT', 'SYSTEM', 'TOOL', 'USER'] },
              content: { type: 'string' },
            },
            required: ['role', 'content'],
          },
        },
        temperature: { type: 'number', description: 'Temperature for generation (0.0-1.0, default: 0.7)' },
        apikey: { type: 'string', description: 'Optional API key override' },
      },
      required: ['messages'],
    },
    handler: async (args) => {
      const client = getAIClient();
      return callGrpc(client, 'generateJSON', {
        messages: args.messages,
        temperature: args.temperature,
        apikey: args.apikey,
      });
    },
  },
  {
    name: 'sam_ai_chat',
    description: 'Multi-turn AI chat conversation. Maintains context across messages for ongoing discussions about trading strategies, market analysis, etc.',
    inputSchema: {
      type: 'object',
      properties: {
        message: { type: 'string', description: 'User message for the chat' },
        context: { type: 'string', description: 'Optional context or system prompt to set the AI behavior' },
      },
      required: ['message'],
    },
    handler: async (args) => {
      const core = await getCore();
      return core.runtime.executeAction('ai:chat', {
        message: args.message,
        system: args.context,
      });
    },
  },
];
