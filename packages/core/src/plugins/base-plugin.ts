/**
 * Base Plugin Class
 * Abstract base class for creating SamTerminal plugins
 */

import type { SamTerminalCore } from '../interfaces/core.interface.js';
import type { SamTerminalPlugin, PluginRegistrationOptions } from '../interfaces/plugin.interface.js';
import type { Action } from '../interfaces/action.interface.js';
import type { Provider } from '../interfaces/provider.interface.js';
import type { Evaluator } from '../interfaces/evaluator.interface.js';
import type { Hook } from '../interfaces/hook.interface.js';
import type { Chain, ChainConfig, PluginMetadata } from '../types/index.js';
import { createLogger, Logger } from '../utils/logger.js';

/**
 * Abstract base class for SamTerminal plugins
 * Provides common functionality and enforces plugin contract
 */
export abstract class BasePlugin implements SamTerminalPlugin {
  /**
   * Plugin name (must be unique)
   */
  abstract readonly name: string;

  /**
   * Plugin version (semver)
   */
  abstract readonly version: string;

  /**
   * Plugin description
   */
  readonly description?: string;

  /**
   * Plugin author
   */
  readonly author?: string;

  /**
   * Core instance reference
   */
  protected core: SamTerminalCore | null = null;

  /**
   * Logger instance
   */
  protected logger: Logger;

  /**
   * Plugin actions
   */
  actions?: Action[];

  /**
   * Plugin providers
   */
  providers?: Provider[];

  /**
   * Plugin evaluators
   */
  evaluators?: Evaluator[];

  /**
   * Plugin hooks
   */
  hooks?: Hook[];

  /**
   * Supported chains
   */
  chains?: Chain[];

  /**
   * Chain configuration
   */
  chainConfig?: ChainConfig;

  /**
   * Required dependencies
   */
  dependencies?: string[];

  /**
   * Optional dependencies
   */
  optionalDependencies?: string[];

  /**
   * Plugin metadata
   */
  metadata?: PluginMetadata;

  constructor() {
    // Logger will be properly initialized after name is set
    this.logger = createLogger({ prefix: 'Plugin' });
  }

  /**
   * Initialize the plugin
   * Called by the core when plugin is loaded
   */
  async init(core: SamTerminalCore): Promise<void> {
    this.core = core;
    this.logger = createLogger({ prefix: this.name });

    this.logger.debug('Initializing plugin...');

    try {
      await this.onInit();
      this.logger.info('Plugin initialized successfully');
    } catch (error) {
      this.logger.error('Plugin initialization failed', error as Error);
      throw error;
    }
  }

  /**
   * Destroy the plugin
   * Called by the core when plugin is unloaded
   */
  async destroy(): Promise<void> {
    this.logger.debug('Destroying plugin...');

    try {
      await this.onDestroy();
      this.core = null;
      this.logger.info('Plugin destroyed successfully');
    } catch (error) {
      this.logger.error('Plugin destruction failed', error as Error);
      throw error;
    }
  }

  /**
   * Override this method to perform plugin initialization
   */
  protected abstract onInit(): Promise<void>;

  /**
   * Override this method to perform cleanup
   */
  protected async onDestroy(): Promise<void> {
    // Default implementation does nothing
  }

  /**
   * Get the core instance
   * @throws Error if core is not initialized
   */
  protected getCore(): SamTerminalCore {
    if (!this.core) {
      throw new Error(`Plugin ${this.name} is not initialized`);
    }
    return this.core;
  }

  /**
   * Check if core is initialized
   */
  protected isInitialized(): boolean {
    return this.core !== null;
  }

  /**
   * Register an action
   */
  protected registerAction(action: Action): void {
    if (!this.actions) {
      this.actions = [];
    }
    this.actions.push(action);
  }

  /**
   * Register a provider
   */
  protected registerProvider(provider: Provider): void {
    if (!this.providers) {
      this.providers = [];
    }
    this.providers.push(provider);
  }

  /**
   * Register an evaluator
   */
  protected registerEvaluator(evaluator: Evaluator): void {
    if (!this.evaluators) {
      this.evaluators = [];
    }
    this.evaluators.push(evaluator);
  }

  /**
   * Register a hook
   */
  protected registerHook(hook: Hook): void {
    if (!this.hooks) {
      this.hooks = [];
    }
    this.hooks.push(hook);
  }

  /**
   * Execute an action from another plugin
   */
  protected async executeAction(
    actionName: string,
    input: unknown,
  ): Promise<unknown> {
    const core = this.getCore();
    return core.runtime.executeAction(actionName, input);
  }

  /**
   * Get data from a provider
   */
  protected async getData(
    providerName: string,
    query: unknown,
  ): Promise<unknown> {
    const core = this.getCore();
    return core.runtime.getData(providerName, query);
  }

  /**
   * Emit an event
   */
  protected async emit<T>(event: string, data: T): Promise<void> {
    const core = this.getCore();
    await core.hooks.emit(event as any, data);
  }

  /**
   * Get plugin info
   */
  getInfo(): PluginMetadata {
    return {
      name: this.name,
      version: this.version,
      description: this.description,
      author: this.author,
      ...this.metadata,
    };
  }
}

/**
 * Plugin factory helper
 * Creates a plugin from a configuration object
 */
export function createPlugin(config: {
  name: string;
  version: string;
  description?: string;
  author?: string;
  dependencies?: string[];
  optionalDependencies?: string[];
  actions?: Action[];
  providers?: Provider[];
  evaluators?: Evaluator[];
  hooks?: Hook[];
  chains?: Chain[];
  chainConfig?: ChainConfig;
  init?: (core: SamTerminalCore) => Promise<void>;
  destroy?: () => Promise<void>;
}): SamTerminalPlugin {
  return {
    name: config.name,
    version: config.version,
    description: config.description,
    author: config.author,
    dependencies: config.dependencies,
    optionalDependencies: config.optionalDependencies,
    actions: config.actions,
    providers: config.providers,
    evaluators: config.evaluators,
    hooks: config.hooks,
    chains: config.chains,
    chainConfig: config.chainConfig,

    async init(core: SamTerminalCore): Promise<void> {
      if (config.init) {
        await config.init(core);
      }
    },

    async destroy(): Promise<void> {
      if (config.destroy) {
        await config.destroy();
      }
    },
  };
}
