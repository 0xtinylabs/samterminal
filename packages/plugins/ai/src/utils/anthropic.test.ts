/**
 * Anthropic client tests
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Mock the @anthropic-ai/sdk module with ESM-compatible mocking
const mockMessagesCreate = jest.fn();
const mockCountTokens = jest.fn();
const mockMessagesStream = jest.fn();

jest.unstable_mockModule('@anthropic-ai/sdk', () => ({
  default: jest.fn().mockImplementation(() => ({
    messages: {
      create: mockMessagesCreate,
      countTokens: mockCountTokens,
      stream: mockMessagesStream,
    },
  })),
}));

// Dynamic import after mock setup
const { AnthropicClient, createAnthropicClient } = await import('./anthropic.js');

describe('AnthropicClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create client with required config', () => {
      const client = new AnthropicClient({ apiKey: 'test-key' });
      expect(client).toBeInstanceOf(AnthropicClient);
    });

    it('should accept optional config parameters', () => {
      const client = new AnthropicClient({
        apiKey: 'test-key',
        baseUrl: 'https://custom.api.com',
        timeout: 30000,
      });
      expect(client).toBeInstanceOf(AnthropicClient);
    });
  });

  describe('complete', () => {
    it('should call Anthropic messages API', async () => {
      mockMessagesCreate.mockResolvedValue({
        id: 'msg_123',
        model: 'claude-sonnet-4-20250514',
        content: [{ type: 'text', text: 'Hello!' }],
        stop_reason: 'end_turn',
        usage: {
          input_tokens: 10,
          output_tokens: 5,
        },
      } as never);

      const client = new AnthropicClient({ apiKey: 'test-key' });
      const result = await client.complete({
        messages: [{ role: 'user', content: 'Hello' }],
      });

      expect(mockMessagesCreate).toHaveBeenCalled();
      expect(result.id).toBe('msg_123');
      expect(result.provider).toBe('anthropic');
      expect(result.content[0]).toEqual({ type: 'text', text: 'Hello!' });
    });

    it('should include system message when provided', async () => {
      mockMessagesCreate.mockResolvedValue({
        id: 'msg_123',
        model: 'claude-sonnet-4-20250514',
        content: [{ type: 'text', text: 'Response' }],
        stop_reason: 'end_turn',
        usage: { input_tokens: 20, output_tokens: 5 },
      } as never);

      const client = new AnthropicClient({ apiKey: 'test-key' });
      await client.complete({
        messages: [{ role: 'user', content: 'Hello' }],
        system: 'You are a helpful assistant',
      });

      const callArgs = mockMessagesCreate.mock.calls[0]?.[0] as Record<string, unknown>;
      expect(callArgs.system).toBe('You are a helpful assistant');
    });

    it('should use default model when not specified', async () => {
      mockMessagesCreate.mockResolvedValue({
        id: 'msg_123',
        model: 'claude-sonnet-4-20250514',
        content: [{ type: 'text', text: 'Response' }],
        stop_reason: 'end_turn',
        usage: { input_tokens: 10, output_tokens: 5 },
      } as never);

      const client = new AnthropicClient({ apiKey: 'test-key' });
      await client.complete({
        messages: [{ role: 'user', content: 'Hello' }],
      });

      const callArgs = mockMessagesCreate.mock.calls[0]?.[0] as Record<string, unknown>;
      expect(callArgs.model).toBe('claude-sonnet-4-20250514');
    });

    it('should use custom model when specified', async () => {
      mockMessagesCreate.mockResolvedValue({
        id: 'msg_123',
        model: 'claude-opus-4-20250514',
        content: [{ type: 'text', text: 'Response' }],
        stop_reason: 'end_turn',
        usage: { input_tokens: 10, output_tokens: 5 },
      } as never);

      const client = new AnthropicClient({ apiKey: 'test-key' });
      await client.complete({
        messages: [{ role: 'user', content: 'Hello' }],
        model: 'claude-opus-4-20250514',
      });

      const callArgs = mockMessagesCreate.mock.calls[0]?.[0] as Record<string, unknown>;
      expect(callArgs.model).toBe('claude-opus-4-20250514');
    });

    it('should handle tool use', async () => {
      mockMessagesCreate.mockResolvedValue({
        id: 'msg_123',
        model: 'claude-sonnet-4-20250514',
        content: [
          {
            type: 'tool_use',
            id: 'toolu_123',
            name: 'get_weather',
            input: { location: 'London' },
          },
        ],
        stop_reason: 'tool_use',
        usage: { input_tokens: 10, output_tokens: 20 },
      } as never);

      const client = new AnthropicClient({ apiKey: 'test-key' });
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
      mockMessagesCreate.mockResolvedValue({
        id: 'msg_123',
        model: 'claude-sonnet-4-20250514',
        content: [{ type: 'text', text: 'Response' }],
        stop_reason: 'max_tokens',
        usage: { input_tokens: 10, output_tokens: 100 },
      } as never);

      const client = new AnthropicClient({ apiKey: 'test-key' });
      const result = await client.complete({
        messages: [{ role: 'user', content: 'Hello' }],
      });

      expect(result.stopReason).toBe('max_tokens');
    });

    it('should map stop_sequence correctly', async () => {
      mockMessagesCreate.mockResolvedValue({
        id: 'msg_123',
        model: 'claude-sonnet-4-20250514',
        content: [{ type: 'text', text: 'Response' }],
        stop_reason: 'stop_sequence',
        usage: { input_tokens: 10, output_tokens: 50 },
      } as never);

      const client = new AnthropicClient({ apiKey: 'test-key' });
      const result = await client.complete({
        messages: [{ role: 'user', content: 'Hello' }],
        stopSequences: ['END'],
      });

      expect(result.stopReason).toBe('stop_sequence');
    });

    it('should convert tool choice correctly', async () => {
      mockMessagesCreate.mockResolvedValue({
        id: 'msg_123',
        model: 'claude-sonnet-4-20250514',
        content: [{ type: 'text', text: 'Response' }],
        stop_reason: 'end_turn',
        usage: { input_tokens: 10, output_tokens: 5 },
      } as never);

      const client = new AnthropicClient({ apiKey: 'test-key' });

      // Test 'auto'
      await client.complete({
        messages: [{ role: 'user', content: 'Hello' }],
        toolChoice: 'auto',
      });
      expect((mockMessagesCreate.mock.calls[0]?.[0] as Record<string, unknown>).tool_choice).toEqual({ type: 'auto' });

      // Test specific tool
      await client.complete({
        messages: [{ role: 'user', content: 'Hello' }],
        toolChoice: { name: 'my_tool' },
      });
      expect((mockMessagesCreate.mock.calls[1]?.[0] as Record<string, unknown>).tool_choice).toEqual({
        type: 'tool',
        name: 'my_tool',
      });
    });

    it('should calculate total tokens from usage', async () => {
      mockMessagesCreate.mockResolvedValue({
        id: 'msg_123',
        model: 'claude-sonnet-4-20250514',
        content: [{ type: 'text', text: 'Response' }],
        stop_reason: 'end_turn',
        usage: { input_tokens: 100, output_tokens: 50 },
      } as never);

      const client = new AnthropicClient({ apiKey: 'test-key' });
      const result = await client.complete({
        messages: [{ role: 'user', content: 'Hello' }],
      });

      expect(result.usage.inputTokens).toBe(100);
      expect(result.usage.outputTokens).toBe(50);
      expect(result.usage.totalTokens).toBe(150);
    });
  });

  describe('countTokens', () => {
    it('should count tokens in text', async () => {
      mockCountTokens.mockResolvedValue({
        input_tokens: 25,
      } as never);

      const client = new AnthropicClient({ apiKey: 'test-key' });
      const result = await client.countTokens({
        text: 'Hello, how are you doing today?',
      });

      expect(result).toBe(25);
      expect(mockCountTokens).toHaveBeenCalledWith({
        model: 'claude-sonnet-4-20250514',
        messages: [{ role: 'user', content: 'Hello, how are you doing today?' }],
      });
    });

    it('should use custom model when specified', async () => {
      mockCountTokens.mockResolvedValue({
        input_tokens: 30,
      } as never);

      const client = new AnthropicClient({ apiKey: 'test-key' });
      await client.countTokens({
        text: 'Hello',
        model: 'claude-opus-4-20250514',
      });

      expect(mockCountTokens).toHaveBeenCalledWith({
        model: 'claude-opus-4-20250514',
        messages: [{ role: 'user', content: 'Hello' }],
      });
    });
  });
});

describe('createAnthropicClient', () => {
  it('should create an AnthropicClient instance', () => {
    const client = createAnthropicClient({ apiKey: 'test-key' });
    expect(client).toBeInstanceOf(AnthropicClient);
  });

  it('should pass plugin config to client', () => {
    const client = createAnthropicClient(
      { apiKey: 'test-key' },
      { defaultMaxTokens: 2000 }
    );
    expect(client).toBeInstanceOf(AnthropicClient);
  });
});
