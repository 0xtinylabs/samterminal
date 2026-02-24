/**
 * Models provider tests
 */


import { createModelsProvider } from './models.js';
import type { AIPluginConfig } from '../types/index.js';
import type { AIClient } from '../utils/client.js';
import type { ProviderContext } from '@samterminal/core';

describe('ModelsProvider', () => {
  let mockClient: AIClient;
  let config: AIPluginConfig;

  beforeEach(() => {
    mockClient = {
      complete: jest.fn(),
      stream: jest.fn(),
      embed: jest.fn(),
      generate: jest.fn(),
      getAvailableProviders: jest.fn().mockReturnValue(['openai', 'anthropic']),
      isProviderAvailable: jest.fn(),
      getOpenAIClient: jest.fn(),
      getAnthropicClient: jest.fn(),
    } as unknown as AIClient;

    config = {
      defaultProvider: 'openai',
    };
  });

  const createContext = (query: unknown): ProviderContext => ({
    query,
    params: {},
    user: undefined,
    metadata: {},
  });

  describe('provider metadata', () => {
    it('should have correct name and type', () => {
      const provider = createModelsProvider(() => mockClient, config);

      expect(provider.name).toBe('ai:models');
      expect(provider.type).toBe('token');
    });
  });

  describe('get', () => {
    it('should return all available models', async () => {
      const provider = createModelsProvider(() => mockClient, config);

      const result = await provider.get(createContext({}));

      expect(result.success).toBe(true);
      expect(result.data.models.length).toBeGreaterThan(0);
      expect(result.data.availableProviders).toContain('openai');
      expect(result.data.availableProviders).toContain('anthropic');
    });

    it('should filter by provider', async () => {
      const provider = createModelsProvider(() => mockClient, config);

      const result = await provider.get(createContext({ provider: 'openai' }));

      expect(result.success).toBe(true);
      expect(result.data.models.every((m: any) => m.provider === 'openai')).toBe(true);
    });

    it('should filter by vision support', async () => {
      const provider = createModelsProvider(() => mockClient, config);

      const result = await provider.get(createContext({ supportsVision: true }));

      expect(result.success).toBe(true);
      expect(result.data.models.every((m: any) => m.supportsVision === true)).toBe(true);
    });

    it('should filter by tools support', async () => {
      const provider = createModelsProvider(() => mockClient, config);

      const result = await provider.get(createContext({ supportsTools: true }));

      expect(result.success).toBe(true);
      expect(result.data.models.every((m: any) => m.supportsTools === true)).toBe(true);
    });

    it('should combine multiple filters', async () => {
      const provider = createModelsProvider(() => mockClient, config);

      const result = await provider.get(
        createContext({
          provider: 'anthropic',
          supportsVision: true,
        })
      );

      expect(result.success).toBe(true);
      expect(
        result.data.models.every(
          (m: any) => m.provider === 'anthropic' && m.supportsVision === true
        )
      ).toBe(true);
    });

    it('should only return models for available providers', async () => {
      jest.mocked(mockClient.getAvailableProviders).mockReturnValue(['openai']);

      const provider = createModelsProvider(() => mockClient, config);

      const result = await provider.get(createContext({}));

      expect(result.success).toBe(true);
      expect(result.data.models.every((m: any) => m.provider === 'openai')).toBe(true);
    });

    it('should handle no client gracefully', async () => {
      const provider = createModelsProvider(() => null, config);

      const result = await provider.get(createContext({}));

      expect(result.success).toBe(true);
      expect(result.data.models).toHaveLength(0);
      expect(result.data.availableProviders).toHaveLength(0);
    });

    it('should return model metadata', async () => {
      const provider = createModelsProvider(() => mockClient, config);

      const result = await provider.get(createContext({ provider: 'openai' }));

      expect(result.success).toBe(true);

      const gpt4o = result.data.models.find((m: any) => m.id === 'gpt-4o');
      expect(gpt4o).toBeDefined();
      expect(gpt4o.name).toBe('GPT-4o');
      expect(gpt4o.contextWindow).toBe(128000);
      expect(gpt4o.maxOutputTokens).toBe(16384);
      expect(gpt4o.supportsVision).toBe(true);
      expect(gpt4o.supportsTools).toBe(true);
      expect(gpt4o.inputCostPer1M).toBeDefined();
      expect(gpt4o.outputCostPer1M).toBeDefined();
    });

    it('should handle errors gracefully', async () => {
      jest.mocked(mockClient.getAvailableProviders).mockImplementation(() => {
        throw new Error('Provider error');
      });

      const provider = createModelsProvider(() => mockClient, config);

      const result = await provider.get(createContext({}));

      expect(result.success).toBe(false);
      expect(result.error).toBe('Provider error');
    });
  });
});
