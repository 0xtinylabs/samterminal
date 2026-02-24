/**
 * OpenAI client tests
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Mock the openai module with ESM-compatible mocking
const mockCreate = jest.fn();
const mockEmbeddingsCreate = jest.fn();

jest.unstable_mockModule('openai', () => ({
  default: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockCreate,
      },
    },
    embeddings: {
      create: mockEmbeddingsCreate,
    },
  })),
}));

// Dynamic import after mock setup
const { OpenAIClient, createOpenAIClient } = await import('./openai.js');

describe('OpenAIClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create client with required config', () => {
      const client = new OpenAIClient({ apiKey: 'test-key' });
      expect(client).toBeInstanceOf(OpenAIClient);
    });

    it('should accept optional config parameters', () => {
      const client = new OpenAIClient({
        apiKey: 'test-key',
        organization: 'test-org',
        baseUrl: 'https://custom.api.com',
        timeout: 30000,
      });
      expect(client).toBeInstanceOf(OpenAIClient);
    });
  });

  describe('complete', () => {
    it('should call OpenAI chat completions API', async () => {
      mockCreate.mockResolvedValue({
        id: 'chatcmpl-123',
        model: 'gpt-4o',
        choices: [
          {
            message: {
              content: 'Hello!',
              tool_calls: null,
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 5,
          total_tokens: 15,
        },
      } as never);

      const client = new OpenAIClient({ apiKey: 'test-key' });
      const result = await client.complete({
        messages: [{ role: 'user', content: 'Hello' }],
      });

      expect(mockCreate).toHaveBeenCalled();
      expect(result.id).toBe('chatcmpl-123');
      expect(result.provider).toBe('openai');
      expect(result.content[0]).toEqual({ type: 'text', text: 'Hello!' });
    });

    it('should include system message when provided', async () => {
      mockCreate.mockResolvedValue({
        id: 'chatcmpl-123',
        model: 'gpt-4o',
        choices: [
          {
            message: { content: 'Response' },
            finish_reason: 'stop',
          },
        ],
        usage: { prompt_tokens: 20, completion_tokens: 5, total_tokens: 25 },
      } as never);

      const client = new OpenAIClient({ apiKey: 'test-key' });
      await client.complete({
        messages: [{ role: 'user', content: 'Hello' }],
        system: 'You are a helpful assistant',
      });

      const callArgs = mockCreate.mock.calls[0]?.[0] as Record<string, unknown>;
      expect((callArgs.messages as Array<{ role: string; content: string }>)[0]).toEqual({
        role: 'system',
        content: 'You are a helpful assistant',
      });
    });

    it('should use default model when not specified', async () => {
      mockCreate.mockResolvedValue({
        id: 'chatcmpl-123',
        model: 'gpt-4o',
        choices: [
          {
            message: { content: 'Response' },
            finish_reason: 'stop',
          },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      } as never);

      const client = new OpenAIClient({ apiKey: 'test-key' });
      await client.complete({
        messages: [{ role: 'user', content: 'Hello' }],
      });

      const callArgs = mockCreate.mock.calls[0]?.[0] as Record<string, unknown>;
      expect(callArgs.model).toBe('gpt-4o');
    });

    it('should use custom model when specified', async () => {
      mockCreate.mockResolvedValue({
        id: 'chatcmpl-123',
        model: 'gpt-4-turbo',
        choices: [
          {
            message: { content: 'Response' },
            finish_reason: 'stop',
          },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      } as never);

      const client = new OpenAIClient({ apiKey: 'test-key' });
      await client.complete({
        messages: [{ role: 'user', content: 'Hello' }],
        model: 'gpt-4-turbo',
      });

      const callArgs = mockCreate.mock.calls[0]?.[0] as Record<string, unknown>;
      expect(callArgs.model).toBe('gpt-4-turbo');
    });

    it('should handle tool calls', async () => {
      mockCreate.mockResolvedValue({
        id: 'chatcmpl-123',
        model: 'gpt-4o',
        choices: [
          {
            message: {
              content: null,
              tool_calls: [
                {
                  id: 'call_123',
                  function: {
                    name: 'get_weather',
                    arguments: '{"location":"London"}',
                  },
                },
              ],
            },
            finish_reason: 'tool_calls',
          },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
      } as never);

      const client = new OpenAIClient({ apiKey: 'test-key' });
      const result = await client.complete({
        messages: [{ role: 'user', content: 'What is the weather?' }],
        tools: [
          {
            name: 'get_weather',
            description: 'Get weather for location',
            input_schema: {
              type: 'object',
              properties: {
                location: { type: 'string', description: 'Location' },
              },
            },
          },
        ],
      });

      expect(result.stopReason).toBe('tool_use');
      expect(result.toolCalls).toHaveLength(1);
      expect(result.toolCalls![0].name).toBe('get_weather');
      expect(result.toolCalls![0].input).toEqual({ location: 'London' });
    });

    it('should map stop reasons correctly', async () => {
      mockCreate.mockResolvedValue({
        id: 'chatcmpl-123',
        model: 'gpt-4o',
        choices: [
          {
            message: { content: 'Response' },
            finish_reason: 'length',
          },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 100, total_tokens: 110 },
      } as never);

      const client = new OpenAIClient({ apiKey: 'test-key' });
      const result = await client.complete({
        messages: [{ role: 'user', content: 'Hello' }],
      });

      expect(result.stopReason).toBe('max_tokens');
    });

    it('should convert tool choice correctly', async () => {
      mockCreate.mockResolvedValue({
        id: 'chatcmpl-123',
        model: 'gpt-4o',
        choices: [
          {
            message: { content: 'Response' },
            finish_reason: 'stop',
          },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      } as never);

      const client = new OpenAIClient({ apiKey: 'test-key' });

      // Test 'auto'
      await client.complete({
        messages: [{ role: 'user', content: 'Hello' }],
        toolChoice: 'auto',
      });
      expect((mockCreate.mock.calls[0]?.[0] as Record<string, unknown>).tool_choice).toBe('auto');

      // Test 'none'
      await client.complete({
        messages: [{ role: 'user', content: 'Hello' }],
        toolChoice: 'none',
      });
      expect((mockCreate.mock.calls[1]?.[0] as Record<string, unknown>).tool_choice).toBe('none');

      // Test specific tool
      await client.complete({
        messages: [{ role: 'user', content: 'Hello' }],
        toolChoice: { name: 'my_tool' },
      });
      expect((mockCreate.mock.calls[2]?.[0] as Record<string, unknown>).tool_choice).toEqual({
        type: 'function',
        function: { name: 'my_tool' },
      });
    });
  });

  describe('embed', () => {
    it('should create embeddings', async () => {
      mockEmbeddingsCreate.mockResolvedValue({
        model: 'text-embedding-3-small',
        data: [{ embedding: [0.1, 0.2, 0.3] }],
        usage: { total_tokens: 5 },
      } as never);

      const client = new OpenAIClient({ apiKey: 'test-key' });
      const result = await client.embed({ input: 'Hello world' });

      expect(result.provider).toBe('openai');
      expect(result.embeddings).toHaveLength(1);
      expect(result.embeddings[0]).toEqual([0.1, 0.2, 0.3]);
      expect(result.usage.totalTokens).toBe(5);
    });

    it('should handle array input', async () => {
      mockEmbeddingsCreate.mockResolvedValue({
        model: 'text-embedding-3-small',
        data: [
          { embedding: [0.1, 0.2] },
          { embedding: [0.3, 0.4] },
        ],
        usage: { total_tokens: 10 },
      } as never);

      const client = new OpenAIClient({ apiKey: 'test-key' });
      const result = await client.embed({ input: ['Hello', 'World'] });

      expect(result.embeddings).toHaveLength(2);
    });

    it('should use custom model when specified', async () => {
      mockEmbeddingsCreate.mockResolvedValue({
        model: 'text-embedding-3-large',
        data: [{ embedding: [0.1, 0.2, 0.3] }],
        usage: { total_tokens: 5 },
      } as never);

      const client = new OpenAIClient({ apiKey: 'test-key' });
      await client.embed({
        input: 'Hello',
        model: 'text-embedding-3-large',
      });

      expect(mockEmbeddingsCreate).toHaveBeenCalledWith({
        model: 'text-embedding-3-large',
        input: ['Hello'],
        dimensions: undefined,
      });
    });

    it('should pass dimensions parameter', async () => {
      mockEmbeddingsCreate.mockResolvedValue({
        model: 'text-embedding-3-small',
        data: [{ embedding: [0.1, 0.2] }],
        usage: { total_tokens: 5 },
      } as never);

      const client = new OpenAIClient({ apiKey: 'test-key' });
      await client.embed({
        input: 'Hello',
        dimensions: 256,
      });

      expect(mockEmbeddingsCreate).toHaveBeenCalledWith({
        model: 'text-embedding-3-small',
        input: ['Hello'],
        dimensions: 256,
      });
    });
  });
});

describe('createOpenAIClient', () => {
  it('should create an OpenAIClient instance', () => {
    const client = createOpenAIClient({ apiKey: 'test-key' });
    expect(client).toBeInstanceOf(OpenAIClient);
  });

  it('should pass plugin config to client', () => {
    const client = createOpenAIClient(
      { apiKey: 'test-key' },
      { defaultMaxTokens: 2000 }
    );
    expect(client).toBeInstanceOf(OpenAIClient);
  });
});
