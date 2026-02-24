/**
 * Summarize action tests
 */


import { createSummarizeAction } from './summarize.js';
import type { AIPluginConfig } from '../types/index.js';
import type { AIClient } from '../utils/client.js';
import type { ActionContext } from '@samterminal/core';

describe('SummarizeAction', () => {
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
      const action = createSummarizeAction(() => mockClient, config);

      expect(action.name).toBe('ai:summarize');
      expect(action.description).toBe('Summarize text');
    });
  });

  describe('execute', () => {
    it('should return error when text is missing', async () => {
      const action = createSummarizeAction(() => mockClient, config);

      const result = await action.execute(createContext({}));

      expect(result.success).toBe(false);
      expect(result.error).toBe('Text is required');
    });

    it('should return error when client not configured', async () => {
      const action = createSummarizeAction(() => null, config);

      const result = await action.execute(
        createContext({ text: 'Long text to summarize' })
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('No AI provider configured');
    });

    it('should summarize text successfully', async () => {
      jest.mocked(mockClient.complete).mockResolvedValue({
        id: 'resp-123',
        model: 'gpt-4o',
        provider: 'openai',
        content: [{ type: 'text', text: 'This is a summary.' }],
        usage: { inputTokens: 100, outputTokens: 20, totalTokens: 120 },
        timestamp: Date.now(),
      } as any);

      const action = createSummarizeAction(() => mockClient, config);

      const result = await action.execute(
        createContext({ text: 'Long text to summarize...' })
      );

      expect(result.success).toBe(true);
      expect(result.data.summary).toBe('This is a summary.');
      expect(result.data.model).toBe('gpt-4o');
      expect(result.data.provider).toBe('openai');
    });

    it('should use concise style by default', async () => {
      jest.mocked(mockClient.complete).mockResolvedValue({
        id: 'resp-123',
        model: 'gpt-4o',
        provider: 'openai',
        content: [{ type: 'text', text: 'Summary' }],
        usage: { inputTokens: 100, outputTokens: 20, totalTokens: 120 },
        timestamp: Date.now(),
      } as any);

      const action = createSummarizeAction(() => mockClient, config);

      await action.execute(createContext({ text: 'Long text' }));

      const callArgs = jest.mocked(mockClient.complete).mock.calls[0][0];
      expect(callArgs.messages[0].content).toContain('concise summary');
    });

    it('should support detailed style', async () => {
      jest.mocked(mockClient.complete).mockResolvedValue({
        id: 'resp-123',
        model: 'gpt-4o',
        provider: 'openai',
        content: [{ type: 'text', text: 'Detailed summary' }],
        usage: { inputTokens: 100, outputTokens: 50, totalTokens: 150 },
        timestamp: Date.now(),
      } as any);

      const action = createSummarizeAction(() => mockClient, config);

      await action.execute(
        createContext({ text: 'Long text', style: 'detailed' })
      );

      const callArgs = jest.mocked(mockClient.complete).mock.calls[0][0];
      expect(callArgs.messages[0].content).toContain('detailed summary');
    });

    it('should support bullets style', async () => {
      jest.mocked(mockClient.complete).mockResolvedValue({
        id: 'resp-123',
        model: 'gpt-4o',
        provider: 'openai',
        content: [{ type: 'text', text: '- Point 1\n- Point 2' }],
        usage: { inputTokens: 100, outputTokens: 30, totalTokens: 130 },
        timestamp: Date.now(),
      } as any);

      const action = createSummarizeAction(() => mockClient, config);

      await action.execute(
        createContext({ text: 'Long text', style: 'bullets' })
      );

      const callArgs = jest.mocked(mockClient.complete).mock.calls[0][0];
      expect(callArgs.messages[0].content).toContain('bullet points');
    });

    it('should respect maxLength parameter', async () => {
      jest.mocked(mockClient.complete).mockResolvedValue({
        id: 'resp-123',
        model: 'gpt-4o',
        provider: 'openai',
        content: [{ type: 'text', text: 'Summary' }],
        usage: { inputTokens: 100, outputTokens: 20, totalTokens: 120 },
        timestamp: Date.now(),
      } as any);

      const action = createSummarizeAction(() => mockClient, config);

      await action.execute(
        createContext({ text: 'Long text', maxLength: 50 })
      );

      const callArgs = jest.mocked(mockClient.complete).mock.calls[0][0];
      expect(callArgs.messages[0].content).toContain('50 words');
      expect(callArgs.maxTokens).toBe(75); // 50 * 1.5
    });

    it('should use low temperature for consistency', async () => {
      jest.mocked(mockClient.complete).mockResolvedValue({
        id: 'resp-123',
        model: 'gpt-4o',
        provider: 'openai',
        content: [{ type: 'text', text: 'Summary' }],
        usage: { inputTokens: 100, outputTokens: 20, totalTokens: 120 },
        timestamp: Date.now(),
      } as any);

      const action = createSummarizeAction(() => mockClient, config);

      await action.execute(createContext({ text: 'Long text' }));

      const callArgs = jest.mocked(mockClient.complete).mock.calls[0][0];
      expect(callArgs.temperature).toBe(0.3);
    });

    it('should pass model and provider parameters', async () => {
      jest.mocked(mockClient.complete).mockResolvedValue({
        id: 'resp-123',
        model: 'claude-sonnet-4-20250514',
        provider: 'anthropic',
        content: [{ type: 'text', text: 'Summary' }],
        usage: { inputTokens: 100, outputTokens: 20, totalTokens: 120 },
        timestamp: Date.now(),
      } as any);

      const action = createSummarizeAction(() => mockClient, config);

      await action.execute(
        createContext({
          text: 'Long text',
          model: 'claude-sonnet-4-20250514',
          provider: 'anthropic',
        })
      );

      const callArgs = jest.mocked(mockClient.complete).mock.calls[0][0];
      expect(callArgs.model).toBe('claude-sonnet-4-20250514');
      expect(callArgs.provider).toBe('anthropic');
    });

    it('should handle client errors', async () => {
      jest.mocked(mockClient.complete).mockRejectedValue(new Error('API Error'));

      const action = createSummarizeAction(() => mockClient, config);

      const result = await action.execute(
        createContext({ text: 'Long text' })
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('API Error');
    });

    it('should handle non-Error exceptions', async () => {
      jest.mocked(mockClient.complete).mockRejectedValue('string error');

      const action = createSummarizeAction(() => mockClient, config);

      const result = await action.execute(
        createContext({ text: 'Long text' })
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Summarization failed');
    });
  });
});
