/**
 * Completion provider tests
 */


import { createCompletionProvider } from './completion.js';
import type { AIPluginConfig } from '../types/index.js';
import type { AIClient } from '../utils/client.js';
import type { ProviderContext } from '@samterminal/core';

describe('CompletionProvider', () => {
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
      const provider = createCompletionProvider(() => mockClient, config);

      expect(provider.name).toBe('ai:completion');
      expect(provider.type).toBe('token');
    });
  });

  describe('get', () => {
    it('should return error when messages are missing', async () => {
      const provider = createCompletionProvider(() => mockClient, config);

      const result = await provider.get(createContext({}));

      expect(result.success).toBe(false);
      expect(result.error).toBe('Messages are required');
    });

    it('should return error when messages array is empty', async () => {
      const provider = createCompletionProvider(() => mockClient, config);

      const result = await provider.get(createContext({ messages: [] }));

      expect(result.success).toBe(false);
      expect(result.error).toBe('Messages are required');
    });

    it('should return error when client not configured', async () => {
      const provider = createCompletionProvider(() => null, config);

      const result = await provider.get(
        createContext({
          messages: [{ role: 'user', content: 'Hello' }],
        })
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('No AI provider configured');
    });

    it('should return completion response', async () => {
      const mockResponse = {
        id: 'resp-123',
        model: 'gpt-4o',
        provider: 'openai',
        content: [{ type: 'text', text: 'Hello!' }],
        stopReason: 'end_turn',
        usage: { inputTokens: 10, outputTokens: 5, totalTokens: 15 },
        timestamp: Date.now(),
      };

      jest.mocked(mockClient.complete).mockResolvedValue(mockResponse as any);

      const provider = createCompletionProvider(() => mockClient, config);

      const result = await provider.get(
        createContext({
          messages: [{ role: 'user', content: 'Hello' }],
        })
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse);
    });

    it('should pass all request parameters to client', async () => {
      jest.mocked(mockClient.complete).mockResolvedValue({
        id: 'resp-123',
        content: [{ type: 'text', text: 'Response' }],
      } as any);

      const provider = createCompletionProvider(() => mockClient, config);

      await provider.get(
        createContext({
          messages: [{ role: 'user', content: 'Hello' }],
          model: 'gpt-4-turbo',
          system: 'You are helpful',
          maxTokens: 1000,
          temperature: 0.5,
        })
      );

      expect(mockClient.complete).toHaveBeenCalledWith({
        messages: [{ role: 'user', content: 'Hello' }],
        model: 'gpt-4-turbo',
        system: 'You are helpful',
        maxTokens: 1000,
        temperature: 0.5,
      });
    });

    it('should handle client errors', async () => {
      jest.mocked(mockClient.complete).mockRejectedValue(new Error('API Error'));

      const provider = createCompletionProvider(() => mockClient, config);

      const result = await provider.get(
        createContext({
          messages: [{ role: 'user', content: 'Hello' }],
        })
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('API Error');
    });

    it('should handle non-Error exceptions', async () => {
      jest.mocked(mockClient.complete).mockRejectedValue('string error');

      const provider = createCompletionProvider(() => mockClient, config);

      const result = await provider.get(
        createContext({
          messages: [{ role: 'user', content: 'Hello' }],
        })
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Completion failed');
    });
  });
});
