/**
 * Onboarding Plugin for SamTerminal
 *
 * Provides user onboarding flows, profile management, and progress tracking
 */

import type { SamTerminalPlugin, SamTerminalCore, Action, Provider } from '@samterminal/core';
import type {
  OnboardingPluginConfig,
  OnboardingDatabaseAdapter,
  OnboardingFlow,
} from './types/index.js';
import { InMemoryStorage, createInMemoryStorage } from './utils/storage.js';
import { FlowEngine, createFlowEngine } from './utils/flow-engine.js';
import { createDefaultFlow } from './utils/index.js';
import { createUserProvider } from './providers/user.js';
import { createProgressProvider } from './providers/progress.js';
import { createFlowProvider } from './providers/flow.js';
import { createCreateUserAction } from './actions/create-user.js';
import { createUpdateUserAction } from './actions/update-user.js';
import { createStartFlowAction } from './actions/start-flow.js';
import { createCompleteStepAction } from './actions/complete-step.js';

export interface OnboardingPluginOptions extends OnboardingPluginConfig {
  /** Database adapter (uses in-memory if not provided) */
  database?: OnboardingDatabaseAdapter;

  /** Initialize with default flow */
  initDefaultFlow?: boolean;
}

export class OnboardingPlugin implements SamTerminalPlugin {
  readonly name = '@samterminal/plugin-onboarding';
  readonly version = '1.0.0';
  readonly description = 'User onboarding flows and profile management';
  readonly author = 'SamTerminal Team';

  private core: SamTerminalCore | null = null;
  private config: OnboardingPluginConfig;
  private database: OnboardingDatabaseAdapter;
  private flowEngine: FlowEngine;
  private inMemoryStorage: InMemoryStorage | null = null;

  actions: Action[] = [];
  providers: Provider[] = [];

  constructor(options: OnboardingPluginOptions = {}) {
    this.config = {
      defaultFlowId: options.defaultFlowId,
      autoStart: options.autoStart ?? true,
      allowSkipRequired: options.allowSkipRequired ?? false,
      requireEmailVerification: options.requireEmailVerification ?? false,
      requireWallet: options.requireWallet ?? false,
      sessionTimeout: options.sessionTimeout ?? 30 * 60 * 1000, // 30 minutes
      maxRetries: options.maxRetries ?? 3,
      validators: options.validators,
    };

    // Use provided database or create in-memory storage
    if (options.database) {
      this.database = options.database;
    } else {
      this.inMemoryStorage = createInMemoryStorage();
      this.database = this.inMemoryStorage;
    }

    // Create flow engine
    this.flowEngine = createFlowEngine(this.database, this.config);

    // Initialize default flow if requested
    if (options.initDefaultFlow !== false) {
      this.initializeDefaultFlow();
    }
  }

  private async initializeDefaultFlow(): Promise<void> {
    const defaultFlowDef = createDefaultFlow();

    try {
      const existingFlows = await this.database.listFlows();
      if (existingFlows.length === 0) {
        const flow = await this.database.createFlow(defaultFlowDef);
        if (!this.config.defaultFlowId) {
          this.config.defaultFlowId = flow.id;
        }
      } else if (!this.config.defaultFlowId) {
        // Use first active flow as default
        const activeFlow = existingFlows.find((f) => f.active);
        if (activeFlow) {
          this.config.defaultFlowId = activeFlow.id;
        }
      }
    } catch (_error) {
      // Ignore errors during initialization
    }
  }

  async init(core: SamTerminalCore): Promise<void> {
    this.core = core;

    // Create providers
    this.providers = [
      createUserProvider(() => this.database, this.config),
      createProgressProvider(
        () => this.database,
        () => this.flowEngine,
        this.config,
      ),
      createFlowProvider(() => this.database, this.config),
    ];

    // Create actions
    this.actions = [
      createCreateUserAction(() => this.database, this.config),
      createUpdateUserAction(() => this.database, this.config),
      createStartFlowAction(
        () => this.database,
        () => this.flowEngine,
        this.config,
      ),
      createCompleteStepAction(
        () => this.database,
        () => this.flowEngine,
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
    if (this.core) {
      this.core.services.unregisterPlugin(this.name);
      this.core.events.emit('plugin:unloaded', { plugin: this.name });
    }

    this.core = null;
    this.providers = [];
    this.actions = [];
  }

  /**
   * Get the database adapter
   */
  getDatabase(): OnboardingDatabaseAdapter {
    return this.database;
  }

  /**
   * Get the flow engine
   */
  getFlowEngine(): FlowEngine {
    return this.flowEngine;
  }

  /**
   * Get configuration
   */
  getConfig(): OnboardingPluginConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<OnboardingPluginConfig>): void {
    this.config = { ...this.config, ...config };
    this.flowEngine = createFlowEngine(this.database, this.config);
  }

  /**
   * Set database adapter
   */
  setDatabase(database: OnboardingDatabaseAdapter): void {
    this.database = database;
    this.flowEngine = createFlowEngine(this.database, this.config);
  }

  /**
   * Create a custom flow
   */
  async createFlow(
    flow: Omit<OnboardingFlow, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<OnboardingFlow> {
    return this.database.createFlow(flow);
  }

  /**
   * Get default flow ID
   */
  getDefaultFlowId(): string | undefined {
    return this.config.defaultFlowId;
  }

  /**
   * Set default flow ID
   */
  setDefaultFlowId(flowId: string): void {
    this.config.defaultFlowId = flowId;
  }

  /**
   * Clear in-memory storage (for testing)
   */
  clearStorage(): void {
    if (this.inMemoryStorage) {
      this.inMemoryStorage.clear();
    }
  }
}

/**
 * Create a new OnboardingPlugin instance
 */
export function createOnboardingPlugin(options?: OnboardingPluginOptions): OnboardingPlugin {
  return new OnboardingPlugin(options);
}
