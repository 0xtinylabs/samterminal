/**
 * Plugin Loader
 * Handles dynamic loading of plugins from various sources
 */

import type { SamTerminalPlugin, PluginModule, PluginFactory } from '../interfaces/plugin.interface.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger({ prefix: 'PluginLoader' });

/**
 * Plugin load source type
 */
export type PluginSource =
  | { type: 'instance'; plugin: SamTerminalPlugin }
  | { type: 'factory'; factory: PluginFactory; config?: Record<string, unknown> }
  | { type: 'module'; path: string; config?: Record<string, unknown> }
  | { type: 'package'; name: string; config?: Record<string, unknown> };

/**
 * Plugin Loader
 * Dynamically loads plugins from various sources
 */
export class PluginLoader {
  private cache: Map<string, SamTerminalPlugin> = new Map();

  /**
   * Load a plugin from a source
   */
  async load(source: PluginSource): Promise<SamTerminalPlugin> {
    switch (source.type) {
      case 'instance':
        return source.plugin;

      case 'factory':
        return this.loadFromFactory(source.factory, source.config);

      case 'module':
        return this.loadFromModule(source.path, source.config);

      case 'package':
        return this.loadFromPackage(source.name, source.config);

      default:
        throw new Error(`Unknown plugin source type: ${(source as any).type}`);
    }
  }

  /**
   * Load a plugin from a factory function
   */
  async loadFromFactory(
    factory: PluginFactory,
    config?: Record<string, unknown>,
  ): Promise<SamTerminalPlugin> {
    logger.debug('Loading plugin from factory');

    try {
      const plugin = await factory(config);
      this.validatePlugin(plugin);
      return plugin;
    } catch (error) {
      logger.error('Failed to load plugin from factory', error as Error);
      throw error;
    }
  }

  /**
   * Load a plugin from a module path
   */
  async loadFromModule(
    path: string,
    config?: Record<string, unknown>,
  ): Promise<SamTerminalPlugin> {
    // Check cache
    if (this.cache.has(path)) {
      logger.debug(`Plugin loaded from cache: ${path}`);
      return this.cache.get(path)!;
    }

    logger.debug(`Loading plugin from module: ${path}`);

    try {
      const module = await import(path);
      const plugin = await this.extractPlugin(module, config);

      this.validatePlugin(plugin);
      this.cache.set(path, plugin);

      logger.info(`Plugin loaded: ${plugin.name}@${plugin.version}`, { path });
      return plugin;
    } catch (error) {
      logger.error(`Failed to load plugin from module: ${path}`, error as Error);
      throw new Error(`Failed to load plugin from "${path}": ${(error as Error).message}`);
    }
  }

  /**
   * Load a plugin from an npm package name
   */
  async loadFromPackage(
    packageName: string,
    config?: Record<string, unknown>,
  ): Promise<SamTerminalPlugin> {
    // Check cache
    if (this.cache.has(packageName)) {
      logger.debug(`Plugin loaded from cache: ${packageName}`);
      return this.cache.get(packageName)!;
    }

    logger.debug(`Loading plugin from package: ${packageName}`);

    try {
      // Dynamic import of the package
      const module = await import(packageName);
      const plugin = await this.extractPlugin(module, config);

      this.validatePlugin(plugin);
      this.cache.set(packageName, plugin);

      logger.info(`Plugin loaded: ${plugin.name}@${plugin.version}`, { package: packageName });
      return plugin;
    } catch (error) {
      logger.error(`Failed to load plugin from package: ${packageName}`, error as Error);
      throw new Error(`Failed to load plugin "${packageName}": ${(error as Error).message}`);
    }
  }

  /**
   * Load multiple plugins
   */
  async loadAll(sources: PluginSource[]): Promise<SamTerminalPlugin[]> {
    const plugins: SamTerminalPlugin[] = [];

    for (const source of sources) {
      const plugin = await this.load(source);
      plugins.push(plugin);
    }

    return plugins;
  }

  /**
   * Load plugins in parallel (for independent plugins)
   */
  async loadParallel(sources: PluginSource[]): Promise<SamTerminalPlugin[]> {
    const results = await Promise.allSettled(
      sources.map((source) => this.load(source)),
    );

    const plugins: SamTerminalPlugin[] = [];
    const errors: Error[] = [];

    for (const result of results) {
      if (result.status === 'fulfilled') {
        plugins.push(result.value);
      } else {
        errors.push(result.reason);
      }
    }

    if (errors.length > 0) {
      logger.warn(`${errors.length} plugins failed to load`, {
        errors: errors.map((e) => e.message),
      });
    }

    return plugins;
  }

  /**
   * Extract plugin from module export
   */
  private async extractPlugin(
    module: PluginModule | SamTerminalPlugin | PluginFactory,
    config?: Record<string, unknown>,
  ): Promise<SamTerminalPlugin> {
    // Direct plugin instance
    if (this.isPlugin(module)) {
      return module;
    }

    // Factory function
    if (typeof module === 'function') {
      return this.loadFromFactory(module, config);
    }

    // Module with default export
    if ('default' in module) {
      const defaultExport = module.default;

      if (this.isPlugin(defaultExport)) {
        return defaultExport;
      }

      if (typeof defaultExport === 'function') {
        return this.loadFromFactory(defaultExport, config);
      }
    }

    // Module with plugin property
    if ('plugin' in module && module.plugin) {
      const pluginExport = module.plugin;

      if (this.isPlugin(pluginExport)) {
        return pluginExport;
      }

      if (typeof pluginExport === 'function') {
        return this.loadFromFactory(pluginExport, config);
      }
    }

    throw new Error('Module does not export a valid plugin');
  }

  /**
   * Check if value is a valid plugin
   */
  private isPlugin(value: unknown): value is SamTerminalPlugin {
    return (
      typeof value === 'object' &&
      value !== null &&
      'name' in value &&
      'version' in value &&
      'init' in value &&
      typeof (value as SamTerminalPlugin).init === 'function'
    );
  }

  /**
   * Validate plugin structure
   */
  private validatePlugin(plugin: SamTerminalPlugin): void {
    if (!plugin.name || typeof plugin.name !== 'string') {
      throw new Error('Plugin must have a valid name');
    }

    if (!plugin.version || typeof plugin.version !== 'string') {
      throw new Error('Plugin must have a valid version');
    }

    if (typeof plugin.init !== 'function') {
      throw new Error('Plugin must have an init function');
    }
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
    logger.debug('Plugin cache cleared');
  }

  /**
   * Remove a specific entry from cache
   */
  uncache(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Get cache size
   */
  get cacheSize(): number {
    return this.cache.size;
  }
}

/**
 * Create a new plugin loader
 */
export function createPluginLoader(): PluginLoader {
  return new PluginLoader();
}

