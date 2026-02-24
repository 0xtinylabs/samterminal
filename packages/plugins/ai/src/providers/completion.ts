/**
 * AI completion provider
 */

import type { Provider, ProviderContext, ProviderResult } from '@samterminal/core';
import type {
  AIPluginConfig,
  CompletionRequest,
  CompletionResponse,
} from '../types/index.js';
import type { AIClient } from '../utils/client.js';

export function createCompletionProvider(
  getClient: () => AIClient | null,
  config: AIPluginConfig,
): Provider {
  return {
    name: 'ai:completion',
    type: 'token',
    description: 'Get AI chat completion',

    async get(context: ProviderContext): Promise<ProviderResult> {
      const query = context.query as CompletionRequest;

      if (!query.messages || query.messages.length === 0) {
        return {
          success: false,
          error: 'Messages are required',
          timestamp: new Date(),
        };
      }

      try {
        const client = getClient();
        if (!client) {
          return {
            success: false,
            error: 'No AI provider configured',
            timestamp: new Date(),
          };
        }

        const response = await client.complete(query);

        return {
          success: true,
          data: response,
          timestamp: new Date(),
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Completion failed',
          timestamp: new Date(),
        };
      }
    },
  };
}
