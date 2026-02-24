/**
 * OpenAI client wrapper with rate limiting
 */

import OpenAI from 'openai';
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
  EmbeddingResponse,
  StreamChunk,
} from '../types/index.js';

export interface OpenAIClientConfig {
  apiKey: string;
  organization?: string;
  baseUrl?: string;
  timeout?: number;
  /** Custom rate limit config (default: ~16 req/s for tier 1) */
  rateLimitConfig?: RateLimiterConfig;
  /** Disable rate limiting (not recommended) */
  disableRateLimiting?: boolean;
}

export class OpenAIClient {
  private client: OpenAI;
  private config: AIPluginConfig;
  private rateLimiter: TokenBucketRateLimiter | null;

  constructor(clientConfig: OpenAIClientConfig, pluginConfig: AIPluginConfig = {}) {
    this.client = new OpenAI({
      apiKey: clientConfig.apiKey,
      organization: clientConfig.organization,
      baseURL: clientConfig.baseUrl,
      timeout: clientConfig.timeout ?? 60000,
    });
    this.config = pluginConfig;

    // Initialize rate limiter (~16 req/s for tier 1)
    if (clientConfig.disableRateLimiting) {
      this.rateLimiter = null;
    } else {
      this.rateLimiter = new TokenBucketRateLimiter(
        clientConfig.rateLimitConfig ?? API_RATE_LIMITS.OPENAI,
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
    const model = params.model ?? this.config.defaultModel ?? 'gpt-4o';
    const maxTokens = params.maxTokens ?? this.config.defaultMaxTokens ?? 4096;
    const temperature = params.temperature ?? this.config.defaultTemperature ?? 0.7;

    // Prepare messages
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

    // Add system message if provided
    if (params.system) {
      messages.push({ role: 'system', content: params.system });
    }

    // Convert messages
    for (const msg of params.messages) {
      messages.push(this.convertMessage(msg));
    }

    // Prepare tools
    const tools = params.tools?.map((tool) => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.input_schema,
      },
    }));

    // Prepare tool choice
    let toolChoice: OpenAI.Chat.ChatCompletionToolChoiceOption | undefined;
    if (params.toolChoice === 'auto') {
      toolChoice = 'auto';
    } else if (params.toolChoice === 'none') {
      toolChoice = 'none';
    } else if (params.toolChoice && 'name' in params.toolChoice) {
      toolChoice = { type: 'function', function: { name: params.toolChoice.name } };
    }

    const response = await this.withRateLimit(() =>
      this.client.chat.completions.create({
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
        top_p: params.topP,
        stop: params.stopSequences,
        tools: tools && tools.length > 0 ? tools : undefined,
        tool_choice: toolChoice,
      }),
    );

    const choice = response.choices[0];
    const message = choice.message;

    // Parse content
    const content: ContentBlock[] = [];
    if (message.content) {
      content.push({ type: 'text', text: message.content });
    }

    // Parse tool calls
    const toolCalls: ToolCall[] = [];
    if (message.tool_calls) {
      for (const call of message.tool_calls) {
        toolCalls.push({
          id: call.id,
          name: call.function.name,
          input: JSON.parse(call.function.arguments),
        });
        content.push({
          type: 'tool_use',
          id: call.id,
          name: call.function.name,
          input: JSON.parse(call.function.arguments),
        });
      }
    }

    // Map stop reason
    let stopReason: CompletionResponse['stopReason'] = 'end_turn';
    if (choice.finish_reason === 'length') {
      stopReason = 'max_tokens';
    } else if (choice.finish_reason === 'stop') {
      stopReason = params.stopSequences ? 'stop_sequence' : 'end_turn';
    } else if (choice.finish_reason === 'tool_calls') {
      stopReason = 'tool_use';
    }

    return {
      id: response.id,
      model: response.model,
      provider: 'openai',
      content,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      stopReason,
      usage: {
        inputTokens: response.usage?.prompt_tokens ?? 0,
        outputTokens: response.usage?.completion_tokens ?? 0,
        totalTokens: response.usage?.total_tokens ?? 0,
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
    const model = params.model ?? this.config.defaultModel ?? 'gpt-4o';
    const maxTokens = params.maxTokens ?? this.config.defaultMaxTokens ?? 4096;
    const temperature = params.temperature ?? this.config.defaultTemperature ?? 0.7;

    // Prepare messages
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

    if (params.system) {
      messages.push({ role: 'system', content: params.system });
    }

    for (const msg of params.messages) {
      messages.push(this.convertMessage(msg));
    }

    const tools = params.tools?.map((tool) => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.input_schema,
      },
    }));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);

    try {
      const stream = await this.withRateLimit(() =>
        this.client.chat.completions.create(
          {
            model,
            messages,
            max_tokens: maxTokens,
            temperature,
            tools: tools && tools.length > 0 ? tools : undefined,
            stream: true,
          },
          { signal: controller.signal },
        ),
      );

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;

        if (delta?.content) {
          yield { type: 'text_delta', text: delta.content };
        }

        if (delta?.tool_calls) {
          for (const call of delta.tool_calls) {
            if (call.function?.name) {
              yield {
                type: 'tool_use_start',
                toolCall: {
                  id: call.id,
                  name: call.function.name,
                },
              };
            }
            if (call.function?.arguments) {
              yield {
                type: 'tool_use_delta',
                toolCall: {
                  input: JSON.parse(call.function.arguments),
                },
              };
            }
          }
        }

        if (chunk.choices[0]?.finish_reason) {
          yield { type: 'message_stop' };
        }
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Create embeddings
   */
  async embed(params: {
    input: string | string[];
    model?: string;
    dimensions?: number;
  }): Promise<EmbeddingResponse> {
    const model = params.model ?? 'text-embedding-3-small';
    const input = Array.isArray(params.input) ? params.input : [params.input];

    const response = await this.withRateLimit(() =>
      this.client.embeddings.create({
        model,
        input,
        dimensions: params.dimensions,
      }),
    );

    return {
      model: response.model,
      provider: 'openai',
      embeddings: response.data.map((d) => d.embedding),
      usage: {
        totalTokens: response.usage.total_tokens,
      },
      timestamp: Date.now(),
    };
  }

  /**
   * Convert message to OpenAI format
   */
  private convertMessage(msg: Message): OpenAI.Chat.ChatCompletionMessageParam {
    if (typeof msg.content === 'string') {
      if (msg.role === 'tool') {
        return {
          role: 'tool',
          content: msg.content,
          tool_call_id: msg.name ?? '',
        };
      }
      return {
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
      };
    }

    // Handle content blocks
    const parts: OpenAI.Chat.ChatCompletionContentPart[] = [];
    const toolCalls: OpenAI.Chat.ChatCompletionMessageToolCall[] = [];

    for (const block of msg.content) {
      if (block.type === 'text') {
        parts.push({ type: 'text', text: block.text });
      } else if (block.type === 'image') {
        if (block.source.type === 'base64') {
          parts.push({
            type: 'image_url',
            image_url: {
              url: `data:${block.source.media_type};base64,${block.source.data}`,
            },
          });
        } else if (block.source.url) {
          parts.push({
            type: 'image_url',
            image_url: { url: block.source.url },
          });
        }
      } else if (block.type === 'tool_use') {
        toolCalls.push({
          id: block.id,
          type: 'function',
          function: {
            name: block.name,
            arguments: JSON.stringify(block.input),
          },
        });
      } else if (block.type === 'tool_result') {
        return {
          role: 'tool',
          content:
            typeof block.content === 'string'
              ? block.content
              : JSON.stringify(block.content),
          tool_call_id: block.tool_use_id,
        };
      }
    }

    if (msg.role === 'assistant' && toolCalls.length > 0) {
      return {
        role: 'assistant' as const,
        content: parts.length > 0 ? (parts[0] as { text: string }).text : null,
        tool_calls: toolCalls,
      };
    }

    // Handle each role type explicitly for proper type inference
    if (msg.role === 'system') {
      const textContent = parts
        .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
        .map((p) => p.text)
        .join('');
      return {
        role: 'system' as const,
        content: textContent || '',
      };
    }

    if (msg.role === 'assistant') {
      // For assistant messages, extract text only
      const textContent = parts
        .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
        .map((p) => p.text)
        .join('');
      return {
        role: 'assistant' as const,
        content: textContent || null,
      };
    }

    // Default to user
    return {
      role: 'user' as const,
      content: parts.length > 0 ? parts : '',
    };
  }
}

/**
 * Create OpenAI client
 */
export function createOpenAIClient(
  config: OpenAIClientConfig,
  pluginConfig?: AIPluginConfig,
): OpenAIClient {
  return new OpenAIClient(config, pluginConfig);
}
