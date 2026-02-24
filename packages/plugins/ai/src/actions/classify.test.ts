/**
 * Classify action tests
 */


import { createClassifyAction } from './classify.js';
import type { AIPluginConfig } from '../types/index.js';
import type { AIClient } from '../utils/client.js';
import type { ActionContext } from '@samterminal/core';

describe('ClassifyAction', () => {
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

    config = {};
  });

  const createContext = (input: unknown): ActionContext => ({
    input,
    params: {},
    user: undefined,
    metadata: {},
  });

  describe('action metadata', () => {
    it('should have correct name and description', () => {
      const action = createClassifyAction(() => mockClient, config);

      expect(action.name).toBe('ai:classify');
      expect(action.description).toBe('Classify text into categories');
    });
  });

  describe('execute', () => {
    it('should return error when text is missing', async () => {
      const action = createClassifyAction(() => mockClient, config);

      const result = await action.execute(
        createContext({ labels: ['positive', 'negative'] })
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Text is required');
    });

    it('should return error when labels are missing', async () => {
      const action = createClassifyAction(() => mockClient, config);

      const result = await action.execute(
        createContext({ text: 'Some text' })
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Labels are required');
    });

    it('should return error when labels array is empty', async () => {
      const action = createClassifyAction(() => mockClient, config);

      const result = await action.execute(
        createContext({ text: 'Some text', labels: [] })
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Labels are required');
    });

    it('should return error when client not configured', async () => {
      const action = createClassifyAction(() => null, config);

      const result = await action.execute(
        createContext({
          text: 'Some text',
          labels: ['positive', 'negative'],
        })
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('No AI provider configured');
    });

    it('should classify text successfully', async () => {
      jest.mocked(mockClient.complete).mockResolvedValue({
        id: 'resp-123',
        model: 'gpt-4o',
        provider: 'openai',
        content: [{ type: 'text', text: 'positive: 0.85' }],
        timestamp: Date.now(),
      } as any);

      const action = createClassifyAction(() => mockClient, config);

      const result = await action.execute(
        createContext({
          text: 'I love this product!',
          labels: ['positive', 'negative', 'neutral'],
        })
      );

      expect(result.success).toBe(true);
      expect(result.data.classifications).toHaveLength(1);
      expect(result.data.classifications[0].label).toBe('positive');
      expect(result.data.classifications[0].confidence).toBe(0.85);
    });

    it('should handle multi-label classification', async () => {
      jest.mocked(mockClient.complete).mockResolvedValue({
        id: 'resp-123',
        model: 'gpt-4o',
        provider: 'openai',
        content: [{ type: 'text', text: 'sports: 0.9\ntechnology: 0.7' }],
        timestamp: Date.now(),
      } as any);

      const action = createClassifyAction(() => mockClient, config);

      const result = await action.execute(
        createContext({
          text: 'Tech companies sponsor sports events',
          labels: ['sports', 'technology', 'politics'],
          multiLabel: true,
        })
      );

      expect(result.success).toBe(true);
      expect(result.data.classifications).toHaveLength(2);
      expect(result.data.classifications[0].label).toBe('sports');
      expect(result.data.classifications[1].label).toBe('technology');
    });

    it('should sort classifications by confidence', async () => {
      jest.mocked(mockClient.complete).mockResolvedValue({
        id: 'resp-123',
        model: 'gpt-4o',
        provider: 'openai',
        content: [{ type: 'text', text: 'low: 0.3\nhigh: 0.9\nmedium: 0.6' }],
        timestamp: Date.now(),
      } as any);

      const action = createClassifyAction(() => mockClient, config);

      const result = await action.execute(
        createContext({
          text: 'Test text',
          labels: ['low', 'medium', 'high'],
          multiLabel: true,
        })
      );

      expect(result.success).toBe(true);
      expect(result.data.classifications[0].confidence).toBe(0.9);
      expect(result.data.classifications[1].confidence).toBe(0.6);
      expect(result.data.classifications[2].confidence).toBe(0.3);
    });

    it('should normalize label case', async () => {
      jest.mocked(mockClient.complete).mockResolvedValue({
        id: 'resp-123',
        model: 'gpt-4o',
        provider: 'openai',
        content: [{ type: 'text', text: 'POSITIVE: 0.8' }],
        timestamp: Date.now(),
      } as any);

      const action = createClassifyAction(() => mockClient, config);

      const result = await action.execute(
        createContext({
          text: 'Great!',
          labels: ['positive', 'negative'],
        })
      );

      expect(result.success).toBe(true);
      expect(result.data.classifications[0].label).toBe('positive');
    });

    it('should clamp confidence to 0-1 range', async () => {
      jest.mocked(mockClient.complete).mockResolvedValue({
        id: 'resp-123',
        model: 'gpt-4o',
        provider: 'openai',
        content: [{ type: 'text', text: 'positive: 1.5\nnegative: 0.05' }],
        timestamp: Date.now(),
      } as any);

      const action = createClassifyAction(() => mockClient, config);

      const result = await action.execute(
        createContext({
          text: 'Test',
          labels: ['positive', 'negative'],
          multiLabel: true,
        })
      );

      expect(result.success).toBe(true);
      expect(result.data.classifications).toHaveLength(2);
      // Value > 1 should be clamped to 1
      expect(result.data.classifications[0].confidence).toBe(1);
      expect(result.data.classifications[1].confidence).toBe(0.05);
    });

    it('should filter out invalid labels', async () => {
      jest.mocked(mockClient.complete).mockResolvedValue({
        id: 'resp-123',
        model: 'gpt-4o',
        provider: 'openai',
        content: [{ type: 'text', text: 'invalid: 0.9\npositive: 0.7' }],
        timestamp: Date.now(),
      } as any);

      const action = createClassifyAction(() => mockClient, config);

      const result = await action.execute(
        createContext({
          text: 'Test',
          labels: ['positive', 'negative'],
          multiLabel: true,
        })
      );

      expect(result.success).toBe(true);
      expect(result.data.classifications).toHaveLength(1);
      expect(result.data.classifications[0].label).toBe('positive');
    });

    it('should use low temperature for consistency', async () => {
      jest.mocked(mockClient.complete).mockResolvedValue({
        id: 'resp-123',
        model: 'gpt-4o',
        provider: 'openai',
        content: [{ type: 'text', text: 'positive: 0.8' }],
        timestamp: Date.now(),
      } as any);

      const action = createClassifyAction(() => mockClient, config);

      await action.execute(
        createContext({
          text: 'Test',
          labels: ['positive', 'negative'],
        })
      );

      const callArgs = jest.mocked(mockClient.complete).mock.calls[0][0];
      expect(callArgs.temperature).toBe(0.1);
    });

    it('should handle client errors', async () => {
      jest.mocked(mockClient.complete).mockRejectedValue(new Error('API Error'));

      const action = createClassifyAction(() => mockClient, config);

      const result = await action.execute(
        createContext({
          text: 'Test',
          labels: ['positive', 'negative'],
        })
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('API Error');
    });

    it('should handle non-Error exceptions', async () => {
      jest.mocked(mockClient.complete).mockRejectedValue('string error');

      const action = createClassifyAction(() => mockClient, config);

      const result = await action.execute(
        createContext({
          text: 'Test',
          labels: ['positive', 'negative'],
        })
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Classification failed');
    });
  });
});
