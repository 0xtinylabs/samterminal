/**
 * SamTerminal Core
 * A plugin-based framework for building Web3 agents and automation
 *
 * @packageDocumentation
 */

import { EventEmitter } from 'events';
import type {
  SamTerminalCore,
  CoreConfig,
  RuntimeEngine,
  FlowEngine,
  PluginManager,
  ChainManager,
  ServiceRegistry,
} from './interfaces/core.interface.js';
import type { HookManager } from './interfaces/hook.interface.js';
import type { SamTerminalPlugin } from './interfaces/plugin.interface.js';
import type { Agent, AgentConfig } from './types/index.js';
import { RuntimeEngineImpl, createRuntimeEngine } from './runtime/engine.js';
import { createLogger } from './utils/logger.js';

const logger = createLogger({ prefix: 'SamTerminal' });

/**
 * SamTerminal Version
 */
export const VERSION = '1.0.0';

/**
 * SamTerminal Core Implementation
 */
class SamTerminalCoreImpl implements SamTerminalCore {
  readonly config: CoreConfig;
  private runtimeEngine: RuntimeEngineImpl;
  readonly events: EventEmitter;
  private initialized = false;
  private started = false;

  constructor(config?: CoreConfig) {
    this.config = config ?? {};
    this.runtimeEngine = createRuntimeEngine(config);
    this.events = this.runtimeEngine.getEvents();
  }

  /**
   * Runtime engine
   */
  get runtime(): RuntimeEngine {
    return this.runtimeEngine;
  }

  /**
   * Flow engine
   */
  get flow(): FlowEngine {
    return this.runtimeEngine.getFlowEngine();
  }

  /**
   * Hook manager
   */
  get hooks(): HookManager {
    return this.runtimeEngine.getHooksService();
  }

  /**
   * Service registry
   */
  get services(): ServiceRegistry {
    return this.runtimeEngine.getServiceRegistry();
  }

  /**
   * Plugin manager
   */
  get plugins(): PluginManager {
    const lifecycle = this.runtimeEngine.getPluginLifecycle();
    const registry = lifecycle.getRegistry();
    const loader = lifecycle.getLoader();

    return {
      register: async (plugin: SamTerminalPlugin, config?: Record<string, unknown>) => {
        registry.register(plugin, { config });
      },
      load: async (nameOrPath: string) => {
        return lifecycle.loadPlugin({ type: 'package', name: nameOrPath });
      },
      unload: async (name: string) => {
        await lifecycle.destroyPlugin(name);
        registry.unregister(name);
      },
      get: (name: string) => registry.get(name),
      getAll: () => registry.getAll(),
      has: (name: string) => registry.has(name),
      getLoadOrder: () => registry.getLoadOrder(),
    };
  }

  /**
   * Chain manager
   */
  get chains(): ChainManager {
    return this.runtimeEngine.getChainManager();
  }

  /**
   * Current agent
   */
  get agent(): Agent | undefined {
    return this.runtimeEngine.getAgent();
  }

  /**
   * Initialize core with configuration
   */
  async initialize(config?: CoreConfig): Promise<void> {
    if (this.initialized) {
      logger.warn('Core already initialized');
      return;
    }

    if (config) {
      Object.assign(this.config, config);
    }

    logger.info('Initializing SamTerminal Core...');

    // Set core reference in runtime
    this.runtimeEngine.setCore(this);

    await this.runtimeEngine.initialize();
    this.initialized = true;

    logger.info('SamTerminal Core initialized', { version: VERSION });
  }

  /**
   * Start core and load plugins
   */
  async start(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (this.started) {
      logger.warn('Core already started');
      return;
    }

    logger.info('Starting SamTerminal Core...');
    await this.runtimeEngine.start();
    this.started = true;

    logger.info('SamTerminal Core started');
  }

  /**
   * Stop core and cleanup
   */
  async stop(): Promise<void> {
    if (!this.started) {
      return;
    }

    logger.info('Stopping SamTerminal Core...');
    await this.runtimeEngine.stop();
    this.started = false;
    this.initialized = false;

    logger.info('SamTerminal Core stopped');
  }

  /**
   * Create and start an agent
   */
  async createAgent(config: AgentConfig): Promise<Agent> {
    if (!this.started) {
      throw new Error('Core must be started before creating an agent');
    }

    return this.runtimeEngine.createAgent(config);
  }

  /**
   * Get core version
   */
  getVersion(): string {
    return VERSION;
  }
}

/**
 * Create a new SamTerminal Core instance
 */
export function createCore(config?: CoreConfig): SamTerminalCore {
  return new SamTerminalCoreImpl(config);
}

/**
 * Default export - create core factory
 */
export default createCore;

// Re-export all modules
export * from './types/index.js';
export * from './interfaces/index.js';
export * from './utils/index.js';
export * from './plugins/index.js';
export * from './chains/index.js';
export * from './hooks/index.js';
export * from './flow/index.js';
export * from './runtime/index.js';
export * from './order/index.js';
