/**
 * Embedding provider tests
 */


import { createEmbeddingProvider } from './embedding.js';
import type { AIPluginConfig } from '../types/index.js';
import type { AIClient } from '../utils/client.js';
import type { ProviderContext } from '@samterminal/core';

describe('EmbeddingProvider', () => {
  let mockClient: AIClient;
  let config: AIPluginConfig;

  beforeEach(() => {
    mockClient = {
      complete: jest.fn(),
      stream: jest.fn(),
      embed: jest.fn(),
      generate: jest.fn(),
      getAvailableProviders: jest.fn(),
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
      const provider = createEmbeddingProvider(() => mockClient, config);

      expect(provider.name).toBe('ai:embedding');
      expect(provider.type).toBe('token');
    });
  });

  describe('get', () => {
    it('should return error when input is missing', async () => {
      const provider = createEmbeddingProvider(() => mockClient, config);

      const result = await provider.get(createContext({}));

      expect(result.success).toBe(false);
      expect(result.error).toBe('Input text is required');
    });

    it('should return error when client not configured', async () => {
      const provider = createEmbeddingProvider(() => null, config);

      const result = await provider.get(createContext({ input: 'Hello' }));

      expect(result.success).toBe(false);
      expect(result.error).toBe('No AI provider configured');
    });

    it('should return embedding response for single input', async () => {
      const mockResponse = {
        model: 'text-embedding-3-small',
        provider: 'openai',
        embeddings: [[0.1, 0.2, 0.3]],
        usage: { totalTokens: 5 },
        timestamp: Date.now(),
      };

      jest.mocked(mockClient.embed).mockResolvedValue(mockResponse as any);

      const provider = createEmbeddingProvider(() => mockClient, config);

      const result = await provider.get(createContext({ input: 'Hello' }));

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse);
    });

    it('should return embedding response for array input', async () => {
      const mockResponse = {
        model: 'text-embedding-3-small',
        provider: 'openai',
        embeddings: [
          [0.1, 0.2, 0.3],
          [0.4, 0.5, 0.6],
        ],
        usage: { totalTokens: 10 },
        timestamp: Date.now(),
      };

      jest.mocked(mockClient.embed).mockResolvedValue(mockResponse as any);

      const provider = createEmbeddingProvider(() => mockClient, config);

      const result = await provider.get(
        createContext({ input: ['Hello', 'World'] })
      );

      expect(result.success).toBe(true);
      expect(result.data.embeddings).toHaveLength(2);
    });

    it('should pass all request parameters to client', async () => {
      jest.mocked(mockClient.embed).mockResolvedValue({
        embeddings: [[0.1, 0.2]],
      } as any);

      const provider = createEmbeddingProvider(() => mockClient, config);

      await provider.get(
        createContext({
          input: 'Hello',
          model: 'text-embedding-3-large',
          dimensions: 256,
        })
      );

      expect(mockClient.embed).toHaveBeenCalledWith({
        input: 'Hello',
        model: 'text-embedding-3-large',
        dimensions: 256,
      });
    });

    it('should handle client errors', async () => {
      jest.mocked(mockClient.embed).mockRejectedValue(new Error('API Error'));

      const provider = createEmbeddingProvider(() => mockClient, config);

      const result = await provider.get(createContext({ input: 'Hello' }));

      expect(result.success).toBe(false);
      expect(result.error).toBe('API Error');
    });

    it('should handle non-Error exceptions', async () => {
      jest.mocked(mockClient.embed).mockRejectedValue('string error');

      const provider = createEmbeddingProvider(() => mockClient, config);

      const result = await provider.get(createContext({ input: 'Hello' }));

      expect(result.success).toBe(false);
      expect(result.error).toBe('Embedding failed');
    });
  });
});
