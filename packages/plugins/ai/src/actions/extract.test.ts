/**
 * Extract action tests
 */


import { createExtractAction } from './extract.js';
import type { AIPluginConfig } from '../types/index.js';
import type { AIClient } from '../utils/client.js';
import type { ActionContext } from '@samterminal/core';

describe('ExtractAction', () => {
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
      const action = createExtractAction(() => mockClient, config);

      expect(action.name).toBe('ai:extract');
      expect(action.description).toBe('Extract structured data from text');
    });
  });

  describe('execute', () => {
    it('should return error when text is missing', async () => {
      const action = createExtractAction(() => mockClient, config);

      const result = await action.execute(
        createContext({
          schema: { name: { type: 'string' } },
        })
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Text is required');
    });

    it('should return error when schema is missing', async () => {
      const action = createExtractAction(() => mockClient, config);

      const result = await action.execute(
        createContext({ text: 'Some text' })
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Schema is required');
    });

    it('should return error when schema is empty', async () => {
      const action = createExtractAction(() => mockClient, config);

      const result = await action.execute(
        createContext({ text: 'Some text', schema: {} })
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Schema is required');
    });

    it('should return error when client not configured', async () => {
      const action = createExtractAction(() => null, config);

      const result = await action.execute(
        createContext({
          text: 'Some text',
          schema: { name: { type: 'string' } },
        })
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('No AI provider configured');
    });

    it('should extract data successfully', async () => {
      jest.mocked(mockClient.complete).mockResolvedValue({
        id: 'resp-123',
        model: 'gpt-4o',
        provider: 'openai',
        content: [],
        toolCalls: [
          {
            id: 'call_123',
            name: 'extract_data',
            input: { name: 'John Doe', email: 'john@example.com' },
          },
        ],
        timestamp: Date.now(),
      } as any);

      const action = createExtractAction(() => mockClient, config);

      const result = await action.execute(
        createContext({
          text: 'Contact John Doe at john@example.com',
          schema: {
            name: { type: 'string', description: 'Person name' },
            email: { type: 'string', description: 'Email address' },
          },
        })
      );

      expect(result.success).toBe(true);
      expect(result.data.data).toEqual({
        name: 'John Doe',
        email: 'john@example.com',
      });
    });

    it('should create tool with correct schema', async () => {
      jest.mocked(mockClient.complete).mockResolvedValue({
        id: 'resp-123',
        model: 'gpt-4o',
        provider: 'openai',
        content: [],
        toolCalls: [
          {
            id: 'call_123',
            name: 'extract_data',
            input: {},
          },
        ],
        timestamp: Date.now(),
      } as any);

      const action = createExtractAction(() => mockClient, config);

      const schema = {
        name: { type: 'string' as const, description: 'Name' },
        age: { type: 'number' as const, description: 'Age' },
      };

      await action.execute(
        createContext({ text: 'Test text', schema })
      );

      const callArgs = jest.mocked(mockClient.complete).mock.calls[0][0];
      expect(callArgs.tools).toHaveLength(1);
      expect(callArgs.tools![0].name).toBe('extract_data');
      expect(callArgs.tools![0].input_schema.properties).toEqual(schema);
      expect(callArgs.tools![0].input_schema.required).toEqual(['name', 'age']);
    });

    it('should force tool usage', async () => {
      jest.mocked(mockClient.complete).mockResolvedValue({
        id: 'resp-123',
        model: 'gpt-4o',
        provider: 'openai',
        content: [],
        toolCalls: [
          {
            id: 'call_123',
            name: 'extract_data',
            input: {},
          },
        ],
        timestamp: Date.now(),
      } as any);

      const action = createExtractAction(() => mockClient, config);

      await action.execute(
        createContext({
          text: 'Test',
          schema: { name: { type: 'string' } },
        })
      );

      const callArgs = jest.mocked(mockClient.complete).mock.calls[0][0];
      expect(callArgs.toolChoice).toEqual({ name: 'extract_data' });
    });

    it('should use low temperature for accuracy', async () => {
      jest.mocked(mockClient.complete).mockResolvedValue({
        id: 'resp-123',
        model: 'gpt-4o',
        provider: 'openai',
        content: [],
        toolCalls: [
          {
            id: 'call_123',
            name: 'extract_data',
            input: {},
          },
        ],
        timestamp: Date.now(),
      } as any);

      const action = createExtractAction(() => mockClient, config);

      await action.execute(
        createContext({
          text: 'Test',
          schema: { name: { type: 'string' } },
        })
      );

      const callArgs = jest.mocked(mockClient.complete).mock.calls[0][0];
      expect(callArgs.temperature).toBe(0.1);
    });

    it('should handle no tool calls in response', async () => {
      jest.mocked(mockClient.complete).mockResolvedValue({
        id: 'resp-123',
        model: 'gpt-4o',
        provider: 'openai',
        content: [{ type: 'text', text: 'I could not extract the data' }],
        timestamp: Date.now(),
      } as any);

      const action = createExtractAction(() => mockClient, config);

      const result = await action.execute(
        createContext({
          text: 'Random text',
          schema: { name: { type: 'string' } },
        })
      );

      expect(result.success).toBe(true);
      expect(result.data.data).toEqual({});
    });

    it('should pass model and provider parameters', async () => {
      jest.mocked(mockClient.complete).mockResolvedValue({
        id: 'resp-123',
        model: 'claude-sonnet-4-20250514',
        provider: 'anthropic',
        content: [],
        toolCalls: [
          {
            id: 'call_123',
            name: 'extract_data',
            input: { name: 'Test' },
          },
        ],
        timestamp: Date.now(),
      } as any);

      const action = createExtractAction(() => mockClient, config);

      await action.execute(
        createContext({
          text: 'Test',
          schema: { name: { type: 'string' } },
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

      const action = createExtractAction(() => mockClient, config);

      const result = await action.execute(
        createContext({
          text: 'Test',
          schema: { name: { type: 'string' } },
        })
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('API Error');
    });

    it('should handle non-Error exceptions', async () => {
      jest.mocked(mockClient.complete).mockRejectedValue('string error');

      const action = createExtractAction(() => mockClient, config);

      const result = await action.execute(
        createContext({
          text: 'Test',
          schema: { name: { type: 'string' } },
        })
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Extraction failed');
    });
  });
});
