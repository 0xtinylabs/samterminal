/**
 * AI embedding provider
 */

import type { Provider, ProviderContext, ProviderResult } from '@samterminal/core';
import type { AIPluginConfig, EmbeddingRequest, EmbeddingResponse } from '../types/index.js';
import type { AIClient } from '../utils/client.js';

export function createEmbeddingProvider(
  getClient: () => AIClient | null,
  config: AIPluginConfig,
): Provider {
  return {
    name: 'ai:embedding',
    type: 'token',
    description: 'Generate text embeddings',

    async get(context: ProviderContext): Promise<ProviderResult> {
      const query = context.query as EmbeddingRequest;

      if (!query.input) {
        return {
          success: false,
          error: 'Input text is required',
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

        const response = await client.embed(query);

        return {
          success: true,
          data: response,
          timestamp: new Date(),
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Embedding failed',
          timestamp: new Date(),
        };
      }
    },
  };
}
