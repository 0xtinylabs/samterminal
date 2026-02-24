/**
 * Chat action tests
 */


import {
  createChatAction,
  clearConversation,
  getConversation,
} from './chat.js';
import type { AIPluginConfig, AIDatabaseAdapter, Conversation } from '../types/index.js';
import type { AIClient } from '../utils/client.js';
import type { ActionContext } from '@samterminal/core';

describe('ChatAction', () => {
  let mockClient: AIClient;
  let mockDatabase: AIDatabaseAdapter;
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

    mockDatabase = {
      saveConversation: jest.fn(),
      getConversation: jest.fn(),
      listConversations: jest.fn(),
      deleteConversation: jest.fn(),
      logUsage: jest.fn(),
    };

    config = {
      defaultMaxTokens: 1000,
      defaultTemperature: 0.7,
    };
  });

  afterEach(() => {
    // Clean up any in-memory conversations
    jest.clearAllMocks();
  });

  const createContext = (input: unknown): ActionContext => ({
    input,
    params: {},
    user: undefined,
    metadata: {},
  });

  describe('action metadata', () => {
    it('should have correct name and description', () => {
      const action = createChatAction(
        () => mockClient,
        () => undefined,
        config
      );

      expect(action.name).toBe('ai:chat');
      expect(action.description).toBe('Chat with AI, maintaining conversation history');
    });
  });

  describe('execute', () => {
    it('should return error when message is missing', async () => {
      const action = createChatAction(
        () => mockClient,
        () => undefined,
        config
      );

      const result = await action.execute(createContext({}));

      expect(result.success).toBe(false);
      expect(result.error).toBe('Message is required');
    });

    it('should return error when client not configured', async () => {
      const action = createChatAction(
        () => null,
        () => undefined,
        config
      );

      const result = await action.execute(createContext({ message: 'Hello' }));

      expect(result.success).toBe(false);
      expect(result.error).toBe('No AI provider configured');
    });

    it('should create new conversation and respond', async () => {
      jest.mocked(mockClient.complete).mockResolvedValue({
        id: 'resp-123',
        model: 'gpt-4o',
        provider: 'openai',
        content: [{ type: 'text', text: 'Hello! How can I help?' }],
        usage: { inputTokens: 10, outputTokens: 15, totalTokens: 25 },
        timestamp: Date.now(),
      } as any);

      const action = createChatAction(
        () => mockClient,
        () => undefined,
        config
      );

      const result = await action.execute(createContext({ message: 'Hello' }));

      expect(result.success).toBe(true);
      expect(result.data.message).toBe('Hello! How can I help?');
      expect(result.data.conversationId).toBeDefined();
      expect(result.data.model).toBe('gpt-4o');
      expect(result.data.provider).toBe('openai');
    });

    it('should continue existing conversation from memory', async () => {
      // First message
      jest.mocked(mockClient.complete).mockResolvedValue({
        id: 'resp-1',
        model: 'gpt-4o',
        provider: 'openai',
        content: [{ type: 'text', text: 'Hello!' }],
        usage: { inputTokens: 5, outputTokens: 5, totalTokens: 10 },
        timestamp: Date.now(),
      } as any);

      const action = createChatAction(
        () => mockClient,
        () => undefined,
        config
      );

      const result1 = await action.execute(createContext({ message: 'Hi' }));
      const conversationId = result1.data.conversationId;

      // Clear mock and set up second response
      jest.mocked(mockClient.complete).mockResolvedValue({
        id: 'resp-2',
        model: 'gpt-4o',
        provider: 'openai',
        content: [{ type: 'text', text: 'I remember you said hi!' }],
        usage: { inputTokens: 15, outputTokens: 10, totalTokens: 25 },
        timestamp: Date.now(),
      } as any);

      // Second message with conversation ID
      const result2 = await action.execute(
        createContext({
          message: 'What did I say?',
          conversationId,
        })
      );

      expect(result2.success).toBe(true);
      expect(result2.data.conversationId).toBe(conversationId);

      // Verify history was included in request
      const callArgs = jest.mocked(mockClient.complete).mock.calls[1][0];
      expect(callArgs.messages).toHaveLength(3); // Hi, Hello!, What did I say?
    });

    it('should return error for non-existent conversation', async () => {
      const action = createChatAction(
        () => mockClient,
        () => undefined,
        config
      );

      const result = await action.execute(
        createContext({
          message: 'Hello',
          conversationId: 'non-existent-id',
        })
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should use database adapter when available', async () => {
      const mockConversation: Conversation = {
        id: 'conv-123',
        entries: [
          { id: 'e1', role: 'user', content: 'Previous message', timestamp: Date.now() - 1000 },
          { id: 'e2', role: 'assistant', content: 'Previous response', timestamp: Date.now() - 500 },
        ],
        createdAt: Date.now() - 1000,
        updatedAt: Date.now() - 500,
      };

      jest.mocked(mockDatabase.getConversation).mockResolvedValue(mockConversation);
      jest.mocked(mockClient.complete).mockResolvedValue({
        id: 'resp-123',
        model: 'gpt-4o',
        provider: 'openai',
        content: [{ type: 'text', text: 'New response' }],
        usage: { inputTokens: 20, outputTokens: 10, totalTokens: 30 },
        timestamp: Date.now(),
      } as any);

      const action = createChatAction(
        () => mockClient,
        () => mockDatabase,
        config
      );

      const result = await action.execute(
        createContext({
          message: 'New message',
          conversationId: 'conv-123',
        })
      );

      expect(result.success).toBe(true);
      expect(mockDatabase.getConversation).toHaveBeenCalledWith('conv-123');
      expect(mockDatabase.saveConversation).toHaveBeenCalled();
      expect(mockDatabase.logUsage).toHaveBeenCalled();
    });

    it('should return error when database conversation not found', async () => {
      jest.mocked(mockDatabase.getConversation).mockResolvedValue(null);

      const action = createChatAction(
        () => mockClient,
        () => mockDatabase,
        config
      );

      const result = await action.execute(
        createContext({
          message: 'Hello',
          conversationId: 'non-existent',
        })
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should include history when requested', async () => {
      jest.mocked(mockClient.complete).mockResolvedValue({
        id: 'resp-123',
        model: 'gpt-4o',
        provider: 'openai',
        content: [{ type: 'text', text: 'Response' }],
        usage: { inputTokens: 10, outputTokens: 10, totalTokens: 20 },
        timestamp: Date.now(),
      } as any);

      const action = createChatAction(
        () => mockClient,
        () => undefined,
        config
      );

      const result = await action.execute(
        createContext({
          message: 'Hello',
          includeHistory: true,
        })
      );

      expect(result.success).toBe(true);
      expect(result.data.history).toBeDefined();
      expect(result.data.history).toHaveLength(2);
      expect(result.data.history[0].content).toBe('Hello');
      expect(result.data.history[1].content).toBe('Response');
    });

    it('should pass system prompt', async () => {
      jest.mocked(mockClient.complete).mockResolvedValue({
        id: 'resp-123',
        model: 'gpt-4o',
        provider: 'openai',
        content: [{ type: 'text', text: 'Response' }],
        usage: { inputTokens: 10, outputTokens: 10, totalTokens: 20 },
        timestamp: Date.now(),
      } as any);

      const action = createChatAction(
        () => mockClient,
        () => undefined,
        config
      );

      await action.execute(
        createContext({
          message: 'Hello',
          system: 'You are a helpful assistant',
        })
      );

      const callArgs = jest.mocked(mockClient.complete).mock.calls[0][0];
      expect(callArgs.system).toBe('You are a helpful assistant');
    });

    it('should use custom model and provider', async () => {
      jest.mocked(mockClient.complete).mockResolvedValue({
        id: 'resp-123',
        model: 'claude-sonnet-4-20250514',
        provider: 'anthropic',
        content: [{ type: 'text', text: 'Response' }],
        usage: { inputTokens: 10, outputTokens: 10, totalTokens: 20 },
        timestamp: Date.now(),
      } as any);

      const action = createChatAction(
        () => mockClient,
        () => undefined,
        config
      );

      await action.execute(
        createContext({
          message: 'Hello',
          model: 'claude-sonnet-4-20250514',
          provider: 'anthropic',
        })
      );

      const callArgs = jest.mocked(mockClient.complete).mock.calls[0][0];
      expect(callArgs.model).toBe('claude-sonnet-4-20250514');
      expect(callArgs.provider).toBe('anthropic');
    });

    it('should use config defaults for maxTokens and temperature', async () => {
      jest.mocked(mockClient.complete).mockResolvedValue({
        id: 'resp-123',
        model: 'gpt-4o',
        provider: 'openai',
        content: [{ type: 'text', text: 'Response' }],
        usage: { inputTokens: 10, outputTokens: 10, totalTokens: 20 },
        timestamp: Date.now(),
      } as any);

      const action = createChatAction(
        () => mockClient,
        () => undefined,
        config
      );

      await action.execute(createContext({ message: 'Hello' }));

      const callArgs = jest.mocked(mockClient.complete).mock.calls[0][0];
      expect(callArgs.maxTokens).toBe(1000);
      expect(callArgs.temperature).toBe(0.7);
    });

    it('should override defaults with input values', async () => {
      jest.mocked(mockClient.complete).mockResolvedValue({
        id: 'resp-123',
        model: 'gpt-4o',
        provider: 'openai',
        content: [{ type: 'text', text: 'Response' }],
        usage: { inputTokens: 10, outputTokens: 10, totalTokens: 20 },
        timestamp: Date.now(),
      } as any);

      const action = createChatAction(
        () => mockClient,
        () => undefined,
        config
      );

      await action.execute(
        createContext({
          message: 'Hello',
          maxTokens: 500,
          temperature: 0.5,
        })
      );

      const callArgs = jest.mocked(mockClient.complete).mock.calls[0][0];
      expect(callArgs.maxTokens).toBe(500);
      expect(callArgs.temperature).toBe(0.5);
    });

    it('should handle client errors', async () => {
      jest.mocked(mockClient.complete).mockRejectedValue(new Error('API Error'));

      const action = createChatAction(
        () => mockClient,
        () => undefined,
        config
      );

      const result = await action.execute(createContext({ message: 'Hello' }));

      expect(result.success).toBe(false);
      expect(result.error).toBe('API Error');
    });

    it('should handle non-Error exceptions', async () => {
      jest.mocked(mockClient.complete).mockRejectedValue('string error');

      const action = createChatAction(
        () => mockClient,
        () => undefined,
        config
      );

      const result = await action.execute(createContext({ message: 'Hello' }));

      expect(result.success).toBe(false);
      expect(result.error).toBe('Chat failed');
    });
  });
});

describe('clearConversation', () => {
  it('should clear existing conversation', async () => {
    const mockClient = {
      complete: jest.fn().mockResolvedValue({
        id: 'resp-123',
        model: 'gpt-4o',
        provider: 'openai',
        content: [{ type: 'text', text: 'Hello' }],
        usage: { inputTokens: 5, outputTokens: 5, totalTokens: 10 },
        timestamp: Date.now(),
      }),
    } as unknown as AIClient;

    const action = createChatAction(
      () => mockClient,
      () => undefined,
      {}
    );

    const result = await action.execute({ input: { message: 'Hi' } } as any);
    const conversationId = result.data.conversationId;

    expect(getConversation(conversationId)).toBeDefined();

    const cleared = clearConversation(conversationId);
    expect(cleared).toBe(true);
    expect(getConversation(conversationId)).toBeUndefined();
  });

  it('should return false for non-existent conversation', () => {
    const result = clearConversation('non-existent-id');
    expect(result).toBe(false);
  });
});

describe('getConversation', () => {
  it('should return undefined for non-existent conversation', () => {
    const result = getConversation('non-existent-id');
    expect(result).toBeUndefined();
  });
});
