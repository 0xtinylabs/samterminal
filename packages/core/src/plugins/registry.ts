/**
 * Plugin Registry
 * Manages plugin registration, dependencies, and load order
 */

import type { SamTerminalPlugin, PluginRegistrationOptions } from '../interfaces/plugin.interface.js';
import type { PluginState, PluginStatus } from '../types/index.js';
import { createLogger } from '../utils/logger.js';
import { uuid } from '../utils/id.js';

const logger = createLogger({ prefix: 'PluginRegistry' });

/**
 * Registered plugin entry
 */
interface RegistryEntry {
  id: string;
  plugin: SamTerminalPlugin;
  options: PluginRegistrationOptions;
  state: PluginState;
}

/**
 * Plugin Registry
 * Handles plugin registration and dependency resolution
 */
export class PluginRegistry {
  private plugins: Map<string, RegistryEntry> = new Map();
  private loadOrder: string[] = [];

  /**
   * Register a plugin
   */
  register(
    plugin: SamTerminalPlugin,
    options: PluginRegistrationOptions = {},
  ): void {
    const name = options.name ?? plugin.name;

    if (this.plugins.has(name)) {
      throw new Error(`Plugin "${name}" is already registered`);
    }

    // Validate plugin
    this.validatePlugin(plugin);

    const entry: RegistryEntry = {
      id: uuid(),
      plugin,
      options,
      state: {
        status: 'registered',
        metadata: {
          name: plugin.name,
          version: plugin.version,
          description: plugin.description,
          author: plugin.author,
        },
        capabilities: {
          actions: plugin.actions?.map((a) => a.name) ?? [],
          providers: plugin.providers?.map((p) => p.name) ?? [],
          evaluators: plugin.evaluators?.map((e) => e.name) ?? [],
          hooks: plugin.hooks?.map((h) => h.name) ?? [],
          chains: plugin.chainConfig?.supportedChains ?? [],
        },
      },
    };

    this.plugins.set(name, entry);
    this.loadOrder = []; // Invalidate load order

    logger.info(`Plugin "${name}" registered`, {
      version: plugin.version,
      actions: entry.state.capabilities.actions?.length ?? 0,
      providers: entry.state.capabilities.providers?.length ?? 0,
    });
  }

  /**
   * Unregister a plugin
   */
  unregister(name: string): boolean {
    const entry = this.plugins.get(name);
    if (!entry) {
      return false;
    }

    // Check if any other plugins depend on this one
    const dependents = this.getDependents(name);
    if (dependents.length > 0) {
      throw new Error(
        `Cannot unregister "${name}": plugins depend on it: ${dependents.join(', ')}`,
      );
    }

    this.plugins.delete(name);
    this.loadOrder = []; // Invalidate load order

    logger.info(`Plugin "${name}" unregistered`);
    return true;
  }

  /**
   * Get a registered plugin
   */
  get(name: string): SamTerminalPlugin | undefined {
    return this.plugins.get(name)?.plugin;
  }

  /**
   * Get plugin state
   */
  getState(name: string): PluginState | undefined {
    return this.plugins.get(name)?.state;
  }

  /**
   * Update plugin status
   */
  updateStatus(name: string, status: PluginStatus, error?: Error): void {
    const entry = this.plugins.get(name);
    if (entry) {
      entry.state.status = status;
      entry.state.error = error;
      if (status === 'active') {
        entry.state.loadedAt = new Date();
      }
    }
  }

  /**
   * Check if a plugin is registered
   */
  has(name: string): boolean {
    return this.plugins.has(name);
  }

  /**
   * Get all registered plugins
   */
  getAll(): SamTerminalPlugin[] {
    return Array.from(this.plugins.values()).map((e) => e.plugin);
  }

  /**
   * Get all plugin names
   */
  getNames(): string[] {
    return Array.from(this.plugins.keys());
  }

  /**
   * Get plugins in load order (topological sort based on dependencies)
   */
  getLoadOrder(): string[] {
    if (this.loadOrder.length > 0) {
      return [...this.loadOrder];
    }

    this.loadOrder = this.topologicalSort();
    return [...this.loadOrder];
  }

  /**
   * Get plugins that depend on a given plugin
   */
  getDependents(name: string): string[] {
    const dependents: string[] = [];

    for (const [pluginName, entry] of this.plugins) {
      const deps = entry.plugin.dependencies ?? [];
      if (deps.includes(name)) {
        dependents.push(pluginName);
      }
    }

    return dependents;
  }

  /**
   * Get missing dependencies for a plugin
   */
  getMissingDependencies(name: string): string[] {
    const entry = this.plugins.get(name);
    if (!entry) {
      return [];
    }

    const missing: string[] = [];
    const deps = entry.plugin.dependencies ?? [];

    for (const dep of deps) {
      if (!this.plugins.has(dep)) {
        missing.push(dep);
      }
    }

    return missing;
  }

  /**
   * Check if all dependencies are satisfied
   */
  areDependenciesSatisfied(name: string): boolean {
    return this.getMissingDependencies(name).length === 0;
  }

  /**
   * Validate plugin structure
   */
  private validatePlugin(plugin: SamTerminalPlugin): void {
    if (!plugin.name) {
      throw new Error('Plugin must have a name');
    }

    if (!plugin.version) {
      throw new Error('Plugin must have a version');
    }

    if (typeof plugin.init !== 'function') {
      throw new Error('Plugin must have an init method');
    }

    // Validate action names are unique
    const actionNames = new Set<string>();
    for (const action of plugin.actions ?? []) {
      if (actionNames.has(action.name)) {
        throw new Error(`Duplicate action name in plugin: ${action.name}`);
      }
      actionNames.add(action.name);
    }

    // Validate provider names are unique
    const providerNames = new Set<string>();
    for (const provider of plugin.providers ?? []) {
      if (providerNames.has(provider.name)) {
        throw new Error(`Duplicate provider name in plugin: ${provider.name}`);
      }
      providerNames.add(provider.name);
    }
  }

  /**
   * Topological sort for dependency resolution
   */
  private topologicalSort(): string[] {
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const order: string[] = [];

    const visit = (name: string): void => {
      if (visited.has(name)) {
        return;
      }

      if (visiting.has(name)) {
        throw new Error(`Circular dependency detected involving plugin: ${name}`);
      }

      visiting.add(name);

      const entry = this.plugins.get(name);
      if (entry) {
        const deps = entry.plugin.dependencies ?? [];
        for (const dep of deps) {
          if (this.plugins.has(dep)) {
            visit(dep);
          }
        }
      }

      visiting.delete(name);
      visited.add(name);
      order.push(name);
    };

    // Sort by priority first, then name for deterministic order
    const sortedNames = Array.from(this.plugins.entries())
      .sort((a, b) => {
        const priorityA = a[1].options.priority ?? 0;
        const priorityB = b[1].options.priority ?? 0;
        if (priorityB !== priorityA) {
          return priorityB - priorityA;
        }
        return a[0].localeCompare(b[0]);
      })
      .map(([name]) => name);

    for (const name of sortedNames) {
      visit(name);
    }

    return order;
  }

  /**
   * Clear all plugins
   */
  clear(): void {
    this.plugins.clear();
    this.loadOrder = [];
    logger.info('Plugin registry cleared');
  }

  /**
   * Get registry size
   */
  get size(): number {
    return this.plugins.size;
  }
}

/**
 * Create a new plugin registry
 */
export function createPluginRegistry(): PluginRegistry {
  return new PluginRegistry();
}
