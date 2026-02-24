/**
 * AI Plugin for SamTerminal
 *
 * Provides AI/LLM capabilities via OpenAI, Anthropic, and other providers
 */

import type { SamTerminalPlugin, SamTerminalCore, Action, Provider } from '@samterminal/core';
import type { AIPluginConfig, AIDatabaseAdapter } from './types/index.js';
import { createAIClient, AIClient } from './utils/client.js';
import { createCompletionProvider } from './providers/completion.js';
import { createEmbeddingProvider } from './providers/embedding.js';
import { createModelsProvider } from './providers/models.js';
import { createGenerateAction } from './actions/generate.js';
import { createSummarizeAction } from './actions/summarize.js';
import { createClassifyAction } from './actions/classify.js';
import { createExtractAction } from './actions/extract.js';
import { createChatAction } from './actions/chat.js';

export interface AIPluginOptions extends AIPluginConfig {
  /** Optional database adapter for conversation persistence */
  database?: AIDatabaseAdapter;
}

export class AIPlugin implements SamTerminalPlugin {
  readonly name = '@samterminal/plugin-ai';
  readonly version = '1.0.0';
  readonly description = 'AI/LLM capabilities via OpenAI, Anthropic, and more';
  readonly author = 'SamTerminal Team';

  private core: SamTerminalCore | null = null;
  private config: AIPluginConfig;
  private database?: AIDatabaseAdapter;
  private client: AIClient | null = null;

  actions: Action[] = [];
  providers: Provider[] = [];

  constructor(options: AIPluginOptions = {}) {
    this.config = {
      defaultProvider: options.defaultProvider ?? 'anthropic',
      defaultModel: options.defaultModel,
      openaiApiKey: options.openaiApiKey ?? process.env.OPENAI_API_KEY,
      openaiOrgId: options.openaiOrgId ?? process.env.OPENAI_ORG_ID,
      openaiBaseUrl: options.openaiBaseUrl,
      anthropicApiKey: options.anthropicApiKey ?? process.env.ANTHROPIC_API_KEY,
      anthropicBaseUrl: options.anthropicBaseUrl,
      ollamaBaseUrl: options.ollamaBaseUrl ?? process.env.OLLAMA_BASE_URL,
      defaultMaxTokens: options.defaultMaxTokens ?? 4096,
      defaultTemperature: options.defaultTemperature ?? 0.7,
      requestTimeout: options.requestTimeout ?? 60000,
      retry: options.retry ?? {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 10000,
      },
    };

    this.database = options.database;
  }

  async init(core: SamTerminalCore): Promise<void> {
    this.core = core;

    // Initialize AI client
    this.client = createAIClient(this.config);

    // Check if any provider is available
    const availableProviders = this.client.getAvailableProviders();
    if (availableProviders.length === 0) {
      console.warn(
        '[@samterminal/plugin-ai] No AI providers configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY.',
      );
    }

    // Create providers
    this.providers = [
      createCompletionProvider(() => this.client, this.config),
      createEmbeddingProvider(() => this.client, this.config),
      createModelsProvider(() => this.client, this.config),
    ];

    // Create actions
    this.actions = [
      createGenerateAction(() => this.client, this.config),
      createSummarizeAction(() => this.client, this.config),
      createClassifyAction(() => this.client, this.config),
      createExtractAction(() => this.client, this.config),
      createChatAction(
        () => this.client,
        () => this.database,
        this.config,
      ),
    ];

    // Register providers and actions with core
    for (const provider of this.providers) {
      core.services.registerProvider(provider, this.name);
    }

    for (const action of this.actions) {
      core.services.registerAction(action, this.name);
    }

    core.events.emit('plugin:loaded', { plugin: this.name });
  }

  async destroy(): Promise<void> {
    this.client = null;

    if (this.core) {
      this.core.services.unregisterPlugin(this.name);
      this.core.events.emit('plugin:unloaded', { plugin: this.name });
    }

    this.core = null;
    this.providers = [];
    this.actions = [];
  }

  /**
   * Get the AI client instance
   */
  getClient(): AIClient | null {
    return this.client;
  }

  /**
   * Get the database adapter
   */
  getDatabase(): AIDatabaseAdapter | undefined {
    return this.database;
  }

  /**
   * Update configuration at runtime
   */
  updateConfig(config: Partial<AIPluginConfig>): void {
    this.config = { ...this.config, ...config };

    // Reinitialize client with new config
    this.client = createAIClient(this.config);
  }

  /**
   * Set database adapter at runtime
   */
  setDatabase(database: AIDatabaseAdapter): void {
    this.database = database;
  }

  /**
   * Quick generate text
   */
  async generate(prompt: string, options?: Partial<AIPluginConfig>): Promise<string> {
    if (!this.client) {
      throw new Error('AI plugin not initialized');
    }

    return this.client.generate({
      prompt,
      model: options?.defaultModel ?? this.config.defaultModel,
      provider: options?.defaultProvider ?? this.config.defaultProvider,
      maxTokens: options?.defaultMaxTokens ?? this.config.defaultMaxTokens,
      temperature: options?.defaultTemperature ?? this.config.defaultTemperature,
    });
  }

  /**
   * Get available providers
   */
  getAvailableProviders(): string[] {
    return this.client?.getAvailableProviders() ?? [];
  }
}

/**
 * Create a new AIPlugin instance
 */
export function createAIPlugin(options?: AIPluginOptions): AIPlugin {
  return new AIPlugin(options);
}
