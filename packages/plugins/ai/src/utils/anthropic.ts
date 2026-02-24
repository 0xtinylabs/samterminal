/**
 * Anthropic client wrapper with rate limiting
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  TokenBucketRateLimiter,
  API_RATE_LIMITS,
  type RateLimiterConfig,
} from '@samterminal/core';
import type {
  AIPluginConfig,
  Message,
  Tool,
  CompletionResponse,
  ContentBlock,
  ToolCall,
  StreamChunk,
  TextContent,
  ToolUseContent,
} from '../types/index.js';

export interface AnthropicClientConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  /** Custom rate limit config (default: 50 req/min for tier 1) */
  rateLimitConfig?: RateLimiterConfig;
  /** Disable rate limiting (not recommended) */
  disableRateLimiting?: boolean;
}

export class AnthropicClient {
  private client: Anthropic;
  private config: AIPluginConfig;
  private rateLimiter: TokenBucketRateLimiter | null;

  constructor(clientConfig: AnthropicClientConfig, pluginConfig: AIPluginConfig = {}) {
    this.client = new Anthropic({
      apiKey: clientConfig.apiKey,
      baseURL: clientConfig.baseUrl,
      timeout: clientConfig.timeout ?? 60000,
    });
    this.config = pluginConfig;

    // Initialize rate limiter (50 req/min for tier 1)
    if (clientConfig.disableRateLimiting) {
      this.rateLimiter = null;
    } else {
      this.rateLimiter = new TokenBucketRateLimiter(
        clientConfig.rateLimitConfig ?? API_RATE_LIMITS.ANTHROPIC,
      );
    }
  }

  /**
   * Execute request with rate limiting
   */
  private async withRateLimit<T>(fn: () => Promise<T>): Promise<T> {
    if (this.rateLimiter) {
      return this.rateLimiter.execute(fn);
    }
    return fn();
  }

  /**
   * Create a chat completion
   */
  async complete(params: {
    messages: Message[];
    model?: string;
    system?: string;
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    stopSequences?: string[];
    tools?: Tool[];
    toolChoice?: 'auto' | 'none' | { name: string };
  }): Promise<CompletionResponse> {
    const model = params.model ?? this.config.defaultModel ?? 'claude-sonnet-4-20250514';
    const maxTokens = params.maxTokens ?? this.config.defaultMaxTokens ?? 4096;
    const temperature = params.temperature ?? this.config.defaultTemperature ?? 0.7;

    // Convert messages
    const messages = params.messages.map((msg) => this.convertMessage(msg));

    // Prepare tools
    const tools = params.tools?.map((tool) => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.input_schema,
    }));

    // Prepare tool choice
    let toolChoice: Anthropic.Messages.ToolChoice | undefined;
    if (params.toolChoice === 'auto') {
      toolChoice = { type: 'auto' };
    } else if (params.toolChoice === 'none') {
      toolChoice = { type: 'any' }; // Anthropic doesn't have 'none', use 'any' but no tools
    } else if (params.toolChoice && 'name' in params.toolChoice) {
      toolChoice = { type: 'tool', name: params.toolChoice.name };
    }

    const response = await this.withRateLimit(() =>
      this.client.messages.create({
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
        top_p: params.topP,
        stop_sequences: params.stopSequences,
        system: params.system,
        tools: tools && tools.length > 0 ? tools : undefined,
        tool_choice: toolChoice,
      }),
    );

    // Parse content
    const content: ContentBlock[] = [];
    const toolCalls: ToolCall[] = [];

    for (const block of response.content) {
      if (block.type === 'text') {
        content.push({ type: 'text', text: block.text });
      } else if (block.type === 'tool_use') {
        content.push({
          type: 'tool_use',
          id: block.id,
          name: block.name,
          input: block.input as Record<string, unknown>,
        });
        toolCalls.push({
          id: block.id,
          name: block.name,
          input: block.input as Record<string, unknown>,
        });
      }
    }

    // Map stop reason
    let stopReason: CompletionResponse['stopReason'] = 'end_turn';
    if (response.stop_reason === 'max_tokens') {
      stopReason = 'max_tokens';
    } else if (response.stop_reason === 'stop_sequence') {
      stopReason = 'stop_sequence';
    } else if (response.stop_reason === 'tool_use') {
      stopReason = 'tool_use';
    }

    return {
      id: response.id,
      model: response.model,
      provider: 'anthropic',
      content,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      stopReason,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      },
      timestamp: Date.now(),
    };
  }

  /**
   * Create a streaming chat completion
   */
  async *stream(params: {
    messages: Message[];
    model?: string;
    system?: string;
    maxTokens?: number;
    temperature?: number;
    tools?: Tool[];
  }): AsyncGenerator<StreamChunk> {
    const model = params.model ?? this.config.defaultModel ?? 'claude-sonnet-4-20250514';
    const maxTokens = params.maxTokens ?? this.config.defaultMaxTokens ?? 4096;
    const temperature = params.temperature ?? this.config.defaultTemperature ?? 0.7;

    const messages = params.messages.map((msg) => this.convertMessage(msg));

    const tools = params.tools?.map((tool) => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.input_schema,
    }));

    // Acquire rate limit token before starting stream
    await this.withRateLimit(async () => {});

    const stream = this.client.messages.stream({
      model,
      messages,
      max_tokens: maxTokens,
      temperature,
      system: params.system,
      tools: tools && tools.length > 0 ? tools : undefined,
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta') {
        const delta = event.delta;
        if ('text' in delta) {
          yield { type: 'text_delta', text: delta.text };
        } else if ('partial_json' in delta) {
          yield { type: 'tool_use_delta' };
        }
      } else if (event.type === 'content_block_start') {
        const block = event.content_block;
        if (block.type === 'tool_use') {
          yield {
            type: 'tool_use_start',
            toolCall: {
              id: block.id,
              name: block.name,
            },
          };
        }
      } else if (event.type === 'message_stop') {
        yield { type: 'message_stop' };
      }
    }
  }

  /**
   * Count tokens in text
   */
  async countTokens(params: {
    text: string;
    model?: string;
  }): Promise<number> {
    const model = params.model ?? this.config.defaultModel ?? 'claude-sonnet-4-20250514';

    const response = await this.client.messages.countTokens({
      model,
      messages: [{ role: 'user', content: params.text }],
    });

    return response.input_tokens;
  }

  /**
   * Convert message to Anthropic format
   */
  private convertMessage(msg: Message): Anthropic.Messages.MessageParam {
    if (typeof msg.content === 'string') {
      return {
        role: msg.role === 'tool' ? 'user' : (msg.role as 'user' | 'assistant'),
        content: msg.content,
      };
    }

    // Handle content blocks
    const content: Anthropic.Messages.ContentBlockParam[] = [];

    for (const block of msg.content) {
      if (block.type === 'text') {
        content.push({ type: 'text', text: block.text });
      } else if (block.type === 'image') {
        if (block.source.type === 'base64' && block.source.data) {
          content.push({
            type: 'image',
            source: {
              type: 'base64',
              media_type: block.source.media_type ?? 'image/png',
              data: block.source.data,
            },
          });
        } else if (block.source.type === 'url' && block.source.url) {
          content.push({
            type: 'image',
            source: {
              type: 'url',
              url: block.source.url,
            },
          });
        }
      } else if (block.type === 'tool_use') {
        content.push({
          type: 'tool_use',
          id: block.id,
          name: block.name,
          input: block.input,
        });
      } else if (block.type === 'tool_result') {
        content.push({
          type: 'tool_result',
          tool_use_id: block.tool_use_id,
          content:
            typeof block.content === 'string'
              ? block.content
              : JSON.stringify(block.content),
          is_error: block.is_error,
        });
      }
    }

    return {
      role: msg.role === 'tool' ? 'user' : (msg.role as 'user' | 'assistant'),
      content,
    };
  }
}

/**
 * Create Anthropic client
 */
export function createAnthropicClient(
  config: AnthropicClientConfig,
  pluginConfig?: AIPluginConfig,
): AnthropicClient {
  return new AnthropicClient(config, pluginConfig);
}
