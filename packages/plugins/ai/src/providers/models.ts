/**
 * AI models provider - list available models
 */

import type { Provider, ProviderContext, ProviderResult } from '@samterminal/core';
import type { AIPluginConfig, AIProvider } from '../types/index.js';
import type { AIClient } from '../utils/client.js';

export interface ModelInfo {
  id: string;
  name: string;
  provider: AIProvider;
  contextWindow: number;
  maxOutputTokens: number;
  supportsVision: boolean;
  supportsTools: boolean;
  inputCostPer1M: number;
  outputCostPer1M: number;
}

const MODELS: ModelInfo[] = [
  // OpenAI Models
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    contextWindow: 128000,
    maxOutputTokens: 16384,
    supportsVision: true,
    supportsTools: true,
    inputCostPer1M: 2.5,
    outputCostPer1M: 10,
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    contextWindow: 128000,
    maxOutputTokens: 16384,
    supportsVision: true,
    supportsTools: true,
    inputCostPer1M: 0.15,
    outputCostPer1M: 0.6,
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'openai',
    contextWindow: 128000,
    maxOutputTokens: 4096,
    supportsVision: true,
    supportsTools: true,
    inputCostPer1M: 10,
    outputCostPer1M: 30,
  },
  {
    id: 'o1',
    name: 'O1',
    provider: 'openai',
    contextWindow: 200000,
    maxOutputTokens: 100000,
    supportsVision: true,
    supportsTools: true,
    inputCostPer1M: 15,
    outputCostPer1M: 60,
  },
  {
    id: 'o1-mini',
    name: 'O1 Mini',
    provider: 'openai',
    contextWindow: 128000,
    maxOutputTokens: 65536,
    supportsVision: false,
    supportsTools: false,
    inputCostPer1M: 3,
    outputCostPer1M: 12,
  },

  // Anthropic Models
  {
    id: 'claude-opus-4-20250514',
    name: 'Claude Opus 4',
    provider: 'anthropic',
    contextWindow: 200000,
    maxOutputTokens: 32000,
    supportsVision: true,
    supportsTools: true,
    inputCostPer1M: 15,
    outputCostPer1M: 75,
  },
  {
    id: 'claude-sonnet-4-20250514',
    name: 'Claude Sonnet 4',
    provider: 'anthropic',
    contextWindow: 200000,
    maxOutputTokens: 64000,
    supportsVision: true,
    supportsTools: true,
    inputCostPer1M: 3,
    outputCostPer1M: 15,
  },
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    contextWindow: 200000,
    maxOutputTokens: 8192,
    supportsVision: true,
    supportsTools: true,
    inputCostPer1M: 3,
    outputCostPer1M: 15,
  },
  {
    id: 'claude-3-5-haiku-20241022',
    name: 'Claude 3.5 Haiku',
    provider: 'anthropic',
    contextWindow: 200000,
    maxOutputTokens: 8192,
    supportsVision: true,
    supportsTools: true,
    inputCostPer1M: 0.8,
    outputCostPer1M: 4,
  },
  {
    id: 'claude-3-opus-20240229',
    name: 'Claude 3 Opus',
    provider: 'anthropic',
    contextWindow: 200000,
    maxOutputTokens: 4096,
    supportsVision: true,
    supportsTools: true,
    inputCostPer1M: 15,
    outputCostPer1M: 75,
  },
];

export interface ModelsQuery {
  provider?: AIProvider;
  supportsVision?: boolean;
  supportsTools?: boolean;
}

export function createModelsProvider(
  getClient: () => AIClient | null,
  config: AIPluginConfig,
): Provider {
  return {
    name: 'ai:models',
    type: 'token',
    description: 'List available AI models',

    async get(context: ProviderContext): Promise<ProviderResult> {
      const query = (context.query ?? {}) as ModelsQuery;

      try {
        const client = getClient();
        const availableProviders = client?.getAvailableProviders() ?? [];

        let models = MODELS.filter((m) => availableProviders.includes(m.provider));

        // Apply filters
        if (query.provider) {
          models = models.filter((m) => m.provider === query.provider);
        }
        if (query.supportsVision !== undefined) {
          models = models.filter((m) => m.supportsVision === query.supportsVision);
        }
        if (query.supportsTools !== undefined) {
          models = models.filter((m) => m.supportsTools === query.supportsTools);
        }

        return {
          success: true,
          data: {
            models,
            availableProviders,
          },
          timestamp: new Date(),
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to list models',
          timestamp: new Date(),
        };
      }
    },
  };
}
