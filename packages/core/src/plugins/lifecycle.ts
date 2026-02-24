/**
 * Plugin Lifecycle Manager
 * Manages plugin initialization, activation, and destruction
 */

import type { SamTerminalCore } from '../interfaces/core.interface.js';
import type { SamTerminalPlugin } from '../interfaces/plugin.interface.js';
import type { PluginStatus } from '../types/index.js';
import { PluginRegistry } from './registry.js';
import { PluginLoader, PluginSource } from './loader.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger({ prefix: 'PluginLifecycle' });

/**
 * Plugin lifecycle events
 */
export type LifecycleEvent =
  | 'beforeInit'
  | 'afterInit'
  | 'beforeDestroy'
  | 'afterDestroy'
  | 'error';

/**
 * Lifecycle event handler
 */
export type LifecycleHandler = (
  event: LifecycleEvent,
  plugin: SamTerminalPlugin,
  error?: Error,
) => void | Promise<void>;

/**
 * Plugin Lifecycle Manager
 */
export class PluginLifecycle {
  private registry: PluginRegistry;
  private loader: PluginLoader;
  private core: SamTerminalCore | null = null;
  private handlers: LifecycleHandler[] = [];
  private initPromises: Map<string, Promise<void>> = new Map();
  private initializingSet: Set<string> = new Set();

  constructor(registry?: PluginRegistry, loader?: PluginLoader) {
    this.registry = registry ?? new PluginRegistry();
    this.loader = loader ?? new PluginLoader();
  }

  /**
   * Set the core instance
   */
  setCore(core: SamTerminalCore): void {
    this.core = core;
  }

  /**
   * Get the registry
   */
  getRegistry(): PluginRegistry {
    return this.registry;
  }

  /**
   * Get the loader
   */
  getLoader(): PluginLoader {
    return this.loader;
  }

  /**
   * Register a lifecycle event handler
   */
  onLifecycle(handler: LifecycleHandler): () => void {
    this.handlers.push(handler);
    return () => {
      const index = this.handlers.indexOf(handler);
      if (index > -1) {
        this.handlers.splice(index, 1);
      }
    };
  }

  /**
   * Emit a lifecycle event
   */
  private async emit(
    event: LifecycleEvent,
    plugin: SamTerminalPlugin,
    error?: Error,
  ): Promise<void> {
    for (const handler of this.handlers) {
      try {
        await handler(event, plugin, error);
      } catch (handlerError) {
        logger.error('Lifecycle handler error', handlerError as Error);
      }
    }
  }

  /**
   * Load and register a plugin
   */
  async loadPlugin(source: PluginSource): Promise<SamTerminalPlugin> {
    const plugin = await this.loader.load(source);
    this.registry.register(plugin);
    return plugin;
  }

  /**
   * Initialize a single plugin
   */
  async initPlugin(name: string): Promise<void> {
    if (!this.core) {
      throw new Error('Core not set');
    }

    // Check if already initializing
    const existingPromise = this.initPromises.get(name);
    if (existingPromise) {
      return existingPromise;
    }

    const plugin = this.registry.get(name);
    if (!plugin) {
      throw new Error(`Plugin "${name}" not found`);
    }

    const state = this.registry.getState(name);
    if (state?.status === 'active') {
      return; // Already initialized
    }

    // Cycle detection
    if (this.initializingSet.has(name)) {
      throw new Error(
        `Circular dependency detected: plugin "${name}" is already being initialized`,
      );
    }
    this.initializingSet.add(name);

    try {
      // Check dependencies
      const missing = this.registry.getMissingDependencies(name);
      if (missing.length > 0) {
        throw new Error(
          `Plugin "${name}" has missing dependencies: ${missing.join(', ')}`,
        );
      }

      // Initialize dependencies first
      const deps = plugin.dependencies ?? [];
      for (const dep of deps) {
        await this.initPlugin(dep);
      }

      // Initialize this plugin — set promise before awaiting to prevent races
      const initPromise = this.doInitPlugin(name, plugin);
      this.initPromises.set(name, initPromise);

      await initPromise;
    } finally {
      // Keep initPromises cached so concurrent callers can await the same promise
      this.initializingSet.delete(name);
    }
  }

  /**
   * Perform plugin initialization
   */
  private async doInitPlugin(name: string, plugin: SamTerminalPlugin): Promise<void> {
    logger.info(`Initializing plugin: ${name}`);
    this.registry.updateStatus(name, 'initializing');

    try {
      await this.emit('beforeInit', plugin);
      await plugin.init(this.core!);

      // Register plugin services with core
      this.registerPluginServices(plugin);

      this.registry.updateStatus(name, 'active');
      await this.emit('afterInit', plugin);

      logger.info(`Plugin initialized: ${name}`);
    } catch (error) {
      this.registry.updateStatus(name, 'error', error as Error);
      await this.emit('error', plugin, error as Error);

      logger.error(`Plugin initialization failed: ${name}`, error as Error);
      throw error;
    }
  }

  /**
   * Register plugin services with core
   */
  private registerPluginServices(plugin: SamTerminalPlugin): void {
    if (!this.core) return;

    // Register actions
    for (const action of plugin.actions ?? []) {
      this.core.services.registerAction(action, plugin.name);
    }

    // Register providers
    for (const provider of plugin.providers ?? []) {
      this.core.services.registerProvider(provider, plugin.name);
    }

    // Register evaluators
    for (const evaluator of plugin.evaluators ?? []) {
      this.core.services.registerEvaluator(evaluator, plugin.name);
    }

    // Register hooks
    for (const hook of plugin.hooks ?? []) {
      this.core.hooks.register(hook, plugin.name);
    }

    // Register chains
    for (const chain of plugin.chains ?? []) {
      this.core.chains.register(chain);
    }
  }

  /**
   * Initialize all registered plugins in dependency order
   */
  async initAll(): Promise<void> {
    if (!this.core) {
      throw new Error('Core not set');
    }

    const loadOrder = this.registry.getLoadOrder();
    logger.info(`Initializing ${loadOrder.length} plugins...`, { order: loadOrder });

    for (const name of loadOrder) {
      await this.initPlugin(name);
    }

    logger.info('All plugins initialized');
  }

  /**
   * Destroy a single plugin
   */
  async destroyPlugin(name: string): Promise<void> {
    const plugin = this.registry.get(name);
    if (!plugin) {
      return;
    }

    const state = this.registry.getState(name);
    if (state?.status !== 'active') {
      return; // Not active
    }

    // Check dependents
    const dependents = this.registry.getDependents(name);
    const activeDependents = dependents.filter((d) => {
      const depState = this.registry.getState(d);
      return depState?.status === 'active';
    });

    if (activeDependents.length > 0) {
      throw new Error(
        `Cannot destroy "${name}": active plugins depend on it: ${activeDependents.join(', ')}`,
      );
    }

    logger.info(`Destroying plugin: ${name}`);

    try {
      await this.emit('beforeDestroy', plugin);

      // Unregister services
      if (this.core) {
        this.core.services.unregisterPlugin(name);
        this.core.hooks.unregisterPlugin(name);
      }

      // Destroy plugin
      if (plugin.destroy) {
        await plugin.destroy();
      }

      this.registry.updateStatus(name, 'destroyed');
      await this.emit('afterDestroy', plugin);

      logger.info(`Plugin destroyed: ${name}`);
    } catch (error) {
      this.registry.updateStatus(name, 'error', error as Error);
      await this.emit('error', plugin, error as Error);

      logger.error(`Plugin destruction failed: ${name}`, error as Error);
      throw error;
    }
  }

  /**
   * Destroy all plugins in reverse dependency order
   */
  async destroyAll(): Promise<void> {
    const loadOrder = this.registry.getLoadOrder();
    const destroyOrder = [...loadOrder].reverse();

    logger.info(`Destroying ${destroyOrder.length} plugins...`);

    for (const name of destroyOrder) {
      try {
        await this.destroyPlugin(name);
      } catch (error) {
        // Log but continue destroying other plugins
        logger.error(`Failed to destroy plugin: ${name}`, error as Error);
      }
    }

    logger.info('All plugins destroyed');
  }

  /**
   * Reload a plugin (destroy and re-init)
   */
  async reloadPlugin(name: string): Promise<void> {
    await this.destroyPlugin(name);
    this.initPromises.delete(name);
    await this.initPlugin(name);
  }

  /**
   * Get plugin status
   */
  getStatus(name: string): PluginStatus | undefined {
    return this.registry.getState(name)?.status;
  }

  /**
   * Check if plugin is active
   */
  isActive(name: string): boolean {
    return this.getStatus(name) === 'active';
  }

  /**
   * Clear everything
   */
  async clear(): Promise<void> {
    await this.destroyAll();
    this.registry.clear();
    this.loader.clearCache();
    this.handlers = [];
  }
}

/**
 * Create a new plugin lifecycle manager
 */
export function createPluginLifecycle(
  registry?: PluginRegistry,
  loader?: PluginLoader,
): PluginLifecycle {
  return new PluginLifecycle(registry, loader);
}
