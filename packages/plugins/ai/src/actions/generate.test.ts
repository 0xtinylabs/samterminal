/**
 * Generate action tests
 */


import { createGenerateAction } from './generate.js';
import type { AIPluginConfig } from '../types/index.js';
import type { AIClient } from '../utils/client.js';
import type { ActionContext } from '@samterminal/core';

describe('GenerateAction', () => {
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
      defaultMaxTokens: 1000,
      defaultTemperature: 0.7,
    };
  });

  const createContext = (input: unknown): ActionContext => ({
    input,
    params: {},
    user: undefined,
    metadata: {},
  });

  describe('action metadata', () => {
    it('should have correct name and description', () => {
      const action = createGenerateAction(() => mockClient, config);

      expect(action.name).toBe('ai:generate');
      expect(action.description).toBe('Generate text from a prompt');
    });
  });

  describe('execute', () => {
    it('should return error when prompt is missing', async () => {
      const action = createGenerateAction(() => mockClient, config);

      const result = await action.execute(createContext({}));

      expect(result.success).toBe(false);
      expect(result.error).toBe('Prompt is required');
    });

    it('should return error when client not configured', async () => {
      const action = createGenerateAction(() => null, config);

      const result = await action.execute(createContext({ prompt: 'Hello' }));

      expect(result.success).toBe(false);
      expect(result.error).toBe('No AI provider configured');
    });

    it('should generate text successfully', async () => {
      jest.mocked(mockClient.complete).mockResolvedValue({
        id: 'resp-123',
        model: 'gpt-4o',
        provider: 'openai',
        content: [{ type: 'text', text: 'Generated response' }],
        usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
        timestamp: Date.now(),
      } as any);

      const action = createGenerateAction(() => mockClient, config);

      const result = await action.execute(
        createContext({ prompt: 'Write a poem' })
      );

      expect(result.success).toBe(true);
      expect(result.data.text).toBe('Generated response');
      expect(result.data.model).toBe('gpt-4o');
      expect(result.data.provider).toBe('openai');
    });

    it('should pass parameters to client', async () => {
      jest.mocked(mockClient.complete).mockResolvedValue({
        id: 'resp-123',
        model: 'gpt-4-turbo',
        provider: 'openai',
        content: [{ type: 'text', text: 'Response' }],
        usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
        timestamp: Date.now(),
      } as any);

      const action = createGenerateAction(() => mockClient, config);

      await action.execute(
        createContext({
          prompt: 'Hello',
          model: 'gpt-4-turbo',
          provider: 'openai',
          system: 'You are helpful',
          maxTokens: 500,
          temperature: 0.5,
        })
      );

      expect(mockClient.complete).toHaveBeenCalledWith({
        messages: [{ role: 'user', content: 'Hello' }],
        model: 'gpt-4-turbo',
        provider: 'openai',
        system: 'You are helpful',
        maxTokens: 500,
        temperature: 0.5,
      });
    });

    it('should use default config values when not specified', async () => {
      jest.mocked(mockClient.complete).mockResolvedValue({
        id: 'resp-123',
        model: 'gpt-4o',
        provider: 'openai',
        content: [{ type: 'text', text: 'Response' }],
        usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
        timestamp: Date.now(),
      } as any);

      const action = createGenerateAction(() => mockClient, config);

      await action.execute(createContext({ prompt: 'Hello' }));

      expect(mockClient.complete).toHaveBeenCalledWith(
        expect.objectContaining({
          maxTokens: 1000,
          temperature: 0.7,
        })
      );
    });

    it('should handle multiple text blocks', async () => {
      jest.mocked(mockClient.complete).mockResolvedValue({
        id: 'resp-123',
        model: 'gpt-4o',
        provider: 'openai',
        content: [
          { type: 'text', text: 'First part. ' },
          { type: 'text', text: 'Second part.' },
        ],
        usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
        timestamp: Date.now(),
      } as any);

      const action = createGenerateAction(() => mockClient, config);

      const result = await action.execute(
        createContext({ prompt: 'Write something' })
      );

      expect(result.success).toBe(true);
      expect(result.data.text).toBe('First part. Second part.');
    });

    it('should handle client errors', async () => {
      jest.mocked(mockClient.complete).mockRejectedValue(new Error('API Error'));

      const action = createGenerateAction(() => mockClient, config);

      const result = await action.execute(
        createContext({ prompt: 'Hello' })
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('API Error');
    });

    it('should handle non-Error exceptions', async () => {
      jest.mocked(mockClient.complete).mockRejectedValue('string error');

      const action = createGenerateAction(() => mockClient, config);

      const result = await action.execute(
        createContext({ prompt: 'Hello' })
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Generation failed');
    });
  });
});
