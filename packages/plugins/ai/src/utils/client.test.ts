/**
 * AIClient tests
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import type { AIPluginConfig } from '../types/index.js';

// Create mock functions
const mockOpenAIComplete = jest.fn();
const mockOpenAIStream = jest.fn();
const mockOpenAIEmbed = jest.fn();
const mockAnthropicComplete = jest.fn();
const mockAnthropicStream = jest.fn();
const mockAnthropicCountTokens = jest.fn();

// Mock the client modules with ESM-compatible mocking
jest.unstable_mockModule('./openai.js', () => ({
  createOpenAIClient: jest.fn(() => ({
    complete: mockOpenAIComplete,
    stream: mockOpenAIStream,
    embed: mockOpenAIEmbed,
  })),
  OpenAIClient: jest.fn(),
}));

jest.unstable_mockModule('./anthropic.js', () => ({
  createAnthropicClient: jest.fn(() => ({
    complete: mockAnthropicComplete,
    stream: mockAnthropicStream,
    countTokens: mockAnthropicCountTokens,
  })),
  AnthropicClient: jest.fn(),
}));

// Dynamic imports after mock setup
const { createOpenAIClient } = await import('./openai.js');
const { createAnthropicClient } = await import('./anthropic.js');
const { AIClient, createAIClient } = await import('./client.js');

describe('AIClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create client without any providers', () => {
      const client = new AIClient({});
      expect(client.getAvailableProviders()).toEqual([]);
    });

    it('should initialize OpenAI client when API key provided', () => {
      const client = new AIClient({ openaiApiKey: 'test-key' });
      expect(createOpenAIClient).toHaveBeenCalled();
      expect(client.getOpenAIClient()).not.toBeNull();
    });

    it('should initialize Anthropic client when API key provided', () => {
      const client = new AIClient({ anthropicApiKey: 'test-key' });
      expect(createAnthropicClient).toHaveBeenCalled();
      expect(client.getAnthropicClient()).not.toBeNull();
    });

    it('should initialize both clients when both keys provided', () => {
      const client = new AIClient({
        openaiApiKey: 'openai-key',
        anthropicApiKey: 'anthropic-key',
      });
      expect(client.getAvailableProviders()).toContain('openai');
      expect(client.getAvailableProviders()).toContain('anthropic');
    });
  });

  describe('getAvailableProviders', () => {
    it('should return empty array when no providers configured', () => {
      const client = new AIClient({});
      expect(client.getAvailableProviders()).toEqual([]);
    });

    it('should return openai when OpenAI is configured', () => {
      const client = new AIClient({ openaiApiKey: 'test-key' });
      expect(client.getAvailableProviders()).toContain('openai');
    });

    it('should return anthropic when Anthropic is configured', () => {
      const client = new AIClient({ anthropicApiKey: 'test-key' });
      expect(client.getAvailableProviders()).toContain('anthropic');
    });
  });

  describe('isProviderAvailable', () => {
    it('should return false for unconfigured provider', () => {
      const client = new AIClient({});
      expect(client.isProviderAvailable('openai')).toBe(false);
      expect(client.isProviderAvailable('anthropic')).toBe(false);
    });

    it('should return true for configured OpenAI', () => {
      const client = new AIClient({ openaiApiKey: 'test-key' });
      expect(client.isProviderAvailable('openai')).toBe(true);
    });

    it('should return true for configured Anthropic', () => {
      const client = new AIClient({ anthropicApiKey: 'test-key' });
      expect(client.isProviderAvailable('anthropic')).toBe(true);
    });

    it('should return false for unknown provider', () => {
      const client = new AIClient({ openaiApiKey: 'test-key' });
      expect(client.isProviderAvailable('ollama')).toBe(false);
    });
  });

  describe('complete', () => {
    it('should throw when no provider configured', async () => {
      const client = new AIClient({});

      await expect(
        client.complete({
          messages: [{ role: 'user', content: 'Hello' }],
        })
      ).rejects.toThrow('No AI provider configured');
    });

    it('should throw when OpenAI requested but not configured', async () => {
      const client = new AIClient({ anthropicApiKey: 'test-key' });

      await expect(
        client.complete({
          messages: [{ role: 'user', content: 'Hello' }],
          provider: 'openai',
        })
      ).rejects.toThrow('OpenAI API key not configured');
    });

    it('should throw when Anthropic requested but not configured', async () => {
      const client = new AIClient({ openaiApiKey: 'test-key' });

      await expect(
        client.complete({
          messages: [{ role: 'user', content: 'Hello' }],
          provider: 'anthropic',
        })
      ).rejects.toThrow('Anthropic API key not configured');
    });

    it('should use OpenAI for gpt models', async () => {
      mockOpenAIComplete.mockResolvedValue({
        content: [{ type: 'text', text: 'Hello!' }],
      } as never);

      const client = new AIClient({ openaiApiKey: 'test-key' });

      await client.complete({
        messages: [{ role: 'user', content: 'Hello' }],
        model: 'gpt-4o',
      });

      expect(mockOpenAIComplete).toHaveBeenCalled();
    });

    it('should use Anthropic for claude models', async () => {
      mockAnthropicComplete.mockResolvedValue({
        content: [{ type: 'text', text: 'Hello!' }],
      } as never);

      const client = new AIClient({ anthropicApiKey: 'test-key' });

      await client.complete({
        messages: [{ role: 'user', content: 'Hello' }],
        model: 'claude-sonnet-4-20250514',
      });

      expect(mockAnthropicComplete).toHaveBeenCalled();
    });

    it('should use default provider when no model specified', async () => {
      mockAnthropicComplete.mockResolvedValue({
        content: [{ type: 'text', text: 'Hello!' }],
      } as never);

      const client = new AIClient({
        anthropicApiKey: 'test-key',
        defaultProvider: 'anthropic',
      });

      await client.complete({
        messages: [{ role: 'user', content: 'Hello' }],
      });

      expect(mockAnthropicComplete).toHaveBeenCalled();
    });
  });

  describe('embed', () => {
    it('should throw when OpenAI not configured', async () => {
      const client = new AIClient({ anthropicApiKey: 'test-key' });

      await expect(
        client.embed({ input: 'Hello' })
      ).rejects.toThrow('OpenAI API key not configured');
    });

    it('should throw for non-OpenAI provider', async () => {
      const client = new AIClient({ openaiApiKey: 'test-key' });

      await expect(
        client.embed({ input: 'Hello', provider: 'anthropic' })
      ).rejects.toThrow('does not support embeddings');
    });

    it('should call OpenAI embed', async () => {
      mockOpenAIEmbed.mockResolvedValue({
        embeddings: [[0.1, 0.2, 0.3]],
      } as never);

      const client = new AIClient({ openaiApiKey: 'test-key' });

      await client.embed({ input: 'Hello' });

      expect(mockOpenAIEmbed).toHaveBeenCalledWith({
        input: 'Hello',
        model: undefined,
        dimensions: undefined,
      });
    });
  });

  describe('generate', () => {
    it('should call complete and extract text', async () => {
      mockOpenAIComplete.mockResolvedValue({
        content: [{ type: 'text', text: 'Generated text' }],
      } as never);

      const client = new AIClient({ openaiApiKey: 'test-key' });

      const result = await client.generate({ prompt: 'Write a poem' });

      expect(result).toBe('Generated text');
    });
  });
});

describe('createAIClient', () => {
  it('should create an AIClient instance', () => {
    const client = createAIClient({ openaiApiKey: 'test-key' });
    expect(client).toBeInstanceOf(AIClient);
  });

  it('should pass config to AIClient', () => {
    const config: AIPluginConfig = {
      openaiApiKey: 'test-key',
      defaultMaxTokens: 1000,
    };
    const client = createAIClient(config);
    expect(client.isProviderAvailable('openai')).toBe(true);
  });
});
