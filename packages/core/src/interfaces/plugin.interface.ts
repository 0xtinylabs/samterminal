/**
 * Plugin Interface
 * Core contract that all SamTerminal plugins must implement
 */

import type { SamTerminalCore } from './core.interface.js';
import type {
  Chain,
  ChainConfig,
  PluginMetadata,
} from '../types/index.js';
import type { Action } from './action.interface.js';
import type { Provider } from './provider.interface.js';
import type { Evaluator } from './evaluator.interface.js';
import type { Hook } from './hook.interface.js';

/**
 * Main plugin interface that all SamTerminal plugins must implement
 */
export interface SamTerminalPlugin {
  /**
   * Unique name of the plugin (e.g., "@samterminal/plugin-telegram")
   */
  readonly name: string;

  /**
   * Semantic version of the plugin
   */
  readonly version: string;

  /**
   * Optional description of what the plugin does
   */
  readonly description?: string;

  /**
   * Optional author information
   */
  readonly author?: string;

  /**
   * Initialize the plugin with the core instance
   * Called when the plugin is loaded
   */
  init(core: SamTerminalCore): Promise<void>;

  /**
   * Clean up resources when the plugin is unloaded
   * Optional - implement if the plugin needs cleanup
   */
  destroy?(): Promise<void>;

  /**
   * Actions provided by this plugin
   * Actions are executable operations that can be used in flows
   */
  actions?: Action[];

  /**
   * Data providers offered by this plugin
   * Providers fetch and return data (e.g., token prices, wallet balances)
   */
  providers?: Provider[];

  /**
   * Evaluators for condition checking
   * Used in flow conditions and decision nodes
   */
  evaluators?: Evaluator[];

  /**
   * Event hooks for lifecycle events
   * Subscribe to system events and react to them
   */
  hooks?: Hook[];

  /**
   * Blockchain chains supported by this plugin
   */
  chains?: Chain[];

  /**
   * Chain configuration for multi-chain operations
   */
  chainConfig?: ChainConfig;

  /**
   * Required plugins that must be loaded before this one
   */
  dependencies?: string[];

  /**
   * Optional plugins that enhance functionality if present
   */
  optionalDependencies?: string[];

  /**
   * Plugin metadata for registry and discovery
   */
  metadata?: PluginMetadata;
}

/**
 * Plugin factory function type
 * Allows plugins to be loaded dynamically
 */
export type PluginFactory = (
  config?: Record<string, unknown>,
) => SamTerminalPlugin | Promise<SamTerminalPlugin>;

/**
 * Plugin module export structure
 */
export interface PluginModule {
  default: SamTerminalPlugin | PluginFactory;
  plugin?: SamTerminalPlugin | PluginFactory;
}

/**
 * Plugin registration options
 */
export interface PluginRegistrationOptions {
  /**
   * Override plugin name
   */
  name?: string;

  /**
   * Plugin-specific configuration
   */
  config?: Record<string, unknown>;

  /**
   * Whether to activate immediately after registration
   */
  autoActivate?: boolean;

  /**
   * Priority for load order (higher = loaded first)
   */
  priority?: number;
}
