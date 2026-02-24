/**
 * Unified AI client that supports multiple providers
 */

import type {
  AIPluginConfig,
  AIProvider,
  Message,
  Tool,
  CompletionRequest,
  CompletionResponse,
  EmbeddingRequest,
  EmbeddingResponse,
  StreamChunk,
} from '../types/index.js';
import { detectProvider, getDefaultModel } from '../types/index.js';
import { OpenAIClient, createOpenAIClient } from './openai.js';
import { AnthropicClient, createAnthropicClient } from './anthropic.js';

export class AIClient {
  private openai: OpenAIClient | null = null;
  private anthropic: AnthropicClient | null = null;
  private config: AIPluginConfig;

  constructor(config: AIPluginConfig = {}) {
    this.config = config;

    // Initialize OpenAI client if API key is available
    if (config.openaiApiKey) {
      this.openai = createOpenAIClient(
        {
          apiKey: config.openaiApiKey,
          organization: config.openaiOrgId,
          baseUrl: config.openaiBaseUrl,
          timeout: config.requestTimeout,
        },
        config,
      );
    }

    // Initialize Anthropic client if API key is available
    if (config.anthropicApiKey) {
      this.anthropic = createAnthropicClient(
        {
          apiKey: config.anthropicApiKey,
          baseUrl: config.anthropicBaseUrl,
          timeout: config.requestTimeout,
        },
        config,
      );
    }
  }

  /**
   * Create a chat completion
   */
  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const provider = this.resolveProvider(request.provider, request.model);
    const model = request.model ?? getDefaultModel(provider);

    const params = {
      messages: request.messages,
      model,
      system: request.system,
      maxTokens: request.maxTokens ?? this.config.defaultMaxTokens,
      temperature: request.temperature ?? this.config.defaultTemperature,
      topP: request.topP,
      stopSequences: request.stopSequences,
      tools: request.tools,
      toolChoice: request.toolChoice,
    };

    switch (provider) {
      case 'openai':
        if (!this.openai) {
          throw new Error('OpenAI API key not configured');
        }
        return this.openai.complete(params);

      case 'anthropic':
        if (!this.anthropic) {
          throw new Error('Anthropic API key not configured');
        }
        return this.anthropic.complete(params);

      default:
        throw new Error(`Provider ${provider} not supported`);
    }
  }

  /**
   * Create a streaming chat completion
   */
  async *stream(request: CompletionRequest): AsyncGenerator<StreamChunk> {
    const provider = this.resolveProvider(request.provider, request.model);
    const model = request.model ?? getDefaultModel(provider);

    const params = {
      messages: request.messages,
      model,
      system: request.system,
      maxTokens: request.maxTokens ?? this.config.defaultMaxTokens,
      temperature: request.temperature ?? this.config.defaultTemperature,
      tools: request.tools,
    };

    switch (provider) {
      case 'openai':
        if (!this.openai) {
          throw new Error('OpenAI API key not configured');
        }
        yield* this.openai.stream(params);
        break;

      case 'anthropic':
        if (!this.anthropic) {
          throw new Error('Anthropic API key not configured');
        }
        yield* this.anthropic.stream(params);
        break;

      default:
        throw new Error(`Provider ${provider} not supported for streaming`);
    }
  }

  /**
   * Create embeddings
   */
  async embed(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const provider = request.provider ?? this.config.defaultProvider ?? 'openai';

    switch (provider) {
      case 'openai':
        if (!this.openai) {
          throw new Error('OpenAI API key not configured');
        }
        return this.openai.embed({
          input: request.input,
          model: request.model,
          dimensions: request.dimensions,
        });

      default:
        throw new Error(`Provider ${provider} does not support embeddings`);
    }
  }

  /**
   * Simple text generation
   */
  async generate(params: {
    prompt: string;
    system?: string;
    model?: string;
    provider?: AIProvider;
    maxTokens?: number;
    temperature?: number;
  }): Promise<string> {
    const response = await this.complete({
      messages: [{ role: 'user', content: params.prompt }],
      model: params.model,
      provider: params.provider,
      system: params.system,
      maxTokens: params.maxTokens,
      temperature: params.temperature,
    });

    // Extract text from response
    const textBlocks = response.content.filter((b) => b.type === 'text');
    return textBlocks.map((b) => (b as { type: 'text'; text: string }).text).join('');
  }

  /**
   * Get available providers
   */
  getAvailableProviders(): AIProvider[] {
    const providers: AIProvider[] = [];
    if (this.openai) providers.push('openai');
    if (this.anthropic) providers.push('anthropic');
    return providers;
  }

  /**
   * Check if a provider is available
   */
  isProviderAvailable(provider: AIProvider): boolean {
    switch (provider) {
      case 'openai':
        return this.openai !== null;
      case 'anthropic':
        return this.anthropic !== null;
      default:
        return false;
    }
  }

  /**
   * Get the underlying OpenAI client
   */
  getOpenAIClient(): OpenAIClient | null {
    return this.openai;
  }

  /**
   * Get the underlying Anthropic client
   */
  getAnthropicClient(): AnthropicClient | null {
    return this.anthropic;
  }

  /**
   * Resolve provider from request or model
   */
  private resolveProvider(provider?: AIProvider, model?: string): AIProvider {
    // Explicit provider takes precedence
    if (provider) {
      return provider;
    }

    // Detect from model name
    if (model) {
      return detectProvider(model);
    }

    // Use default provider
    if (this.config.defaultProvider) {
      return this.config.defaultProvider;
    }

    // Fall back to first available provider
    if (this.anthropic) return 'anthropic';
    if (this.openai) return 'openai';

    throw new Error('No AI provider configured');
  }
}

/**
 * Create unified AI client
 */
export function createAIClient(config: AIPluginConfig = {}): AIClient {
  return new AIClient(config);
}
