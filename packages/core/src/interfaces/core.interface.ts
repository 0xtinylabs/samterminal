/**
 * Core Interface
 * Main SamTerminal core instance interface
 */

import type { EventEmitter } from 'events';
import type {
  Agent,
  AgentConfig,
  AgentContext,
  Chain,
  ChainId,
  Flow,
  FlowExecutionContext,
  UUID,
} from '../types/index.js';
import type { SamTerminalPlugin } from './plugin.interface.js';
import type { Action } from './action.interface.js';
import type { Provider } from './provider.interface.js';
import type { Evaluator } from './evaluator.interface.js';
import type { HookManager } from './hook.interface.js';

/**
 * Runtime state
 */
export type RuntimeState =
  | 'uninitialized'
  | 'initializing'
  | 'loading_plugins'
  | 'ready'
  | 'running'
  | 'error'
  | 'shutdown';

/**
 * Core configuration
 */
export interface CoreConfig {
  /**
   * Enable debug mode
   */
  debug?: boolean;

  /**
   * Log level
   */
  logLevel?: 'debug' | 'info' | 'warn' | 'error';

  /**
   * Plugins to load
   */
  plugins?: (string | SamTerminalPlugin)[];

  /**
   * Plugin configuration overrides
   */
  pluginConfig?: Record<string, Record<string, unknown>>;

  /**
   * Default chain ID
   */
  defaultChainId?: ChainId;

  /**
   * Supported chains
   */
  chains?: Chain[];

  /**
   * Max concurrent tasks
   */
  maxConcurrentTasks?: number;

  /**
   * Task timeout in milliseconds
   */
  taskTimeout?: number;
}

/**
 * Plugin manager interface
 */
export interface PluginManager {
  /**
   * Register a plugin
   */
  register(plugin: SamTerminalPlugin, config?: Record<string, unknown>): Promise<void>;

  /**
   * Load a plugin by name or path
   */
  load(nameOrPath: string): Promise<SamTerminalPlugin>;

  /**
   * Unload a plugin
   */
  unload(name: string): Promise<void>;

  /**
   * Get a registered plugin
   */
  get(name: string): SamTerminalPlugin | undefined;

  /**
   * Get all registered plugins
   */
  getAll(): SamTerminalPlugin[];

  /**
   * Check if a plugin is registered
   */
  has(name: string): boolean;

  /**
   * Get plugin load order based on dependencies
   */
  getLoadOrder(): string[];
}

/**
 * Chain manager interface
 */
export interface ChainManager {
  /**
   * Register a chain
   */
  register(chain: Chain): void;

  /**
   * Get a chain by ID
   */
  get(chainId: ChainId): Chain | undefined;

  /**
   * Get all registered chains
   */
  getAll(): Chain[];

  /**
   * Get current active chain
   */
  getCurrentChain(): Chain | undefined;

  /**
   * Set active chain
   */
  setCurrentChain(chainId: ChainId): void;

  /**
   * Check if chain is supported
   */
  isSupported(chainId: ChainId): boolean;

  /**
   * Get RPC URL for chain
   */
  getRpcUrl(chainId: ChainId): string | undefined;
}

/**
 * Runtime engine interface
 */
export interface RuntimeEngine {
  /**
   * Current runtime state
   */
  readonly state: RuntimeState;

  /**
   * Initialize the runtime
   */
  initialize(): Promise<void>;

  /**
   * Start the runtime
   */
  start(): Promise<void>;

  /**
   * Stop the runtime
   */
  stop(): Promise<void>;

  /**
   * Execute an action
   */
  executeAction(
    actionName: string,
    input: unknown,
    context?: Partial<AgentContext>,
  ): Promise<unknown>;

  /**
   * Get data from a provider
   */
  getData(
    providerName: string,
    query: unknown,
    context?: Partial<AgentContext>,
  ): Promise<unknown>;

  /**
   * Evaluate a condition
   */
  evaluate(
    evaluatorName: string,
    condition: unknown,
    data: unknown,
  ): Promise<boolean>;

  /**
   * Get scheduler instance
   */
  getScheduler(): unknown;
}

/**
 * Flow engine interface
 */
export interface FlowEngine {
  /**
   * Create a new flow
   */
  create(flow: Omit<Flow, 'id' | 'createdAt' | 'updatedAt'>): Flow;

  /**
   * Get a flow by ID
   */
  get(flowId: UUID): Flow | undefined;

  /**
   * Update a flow
   */
  update(flowId: UUID, updates: Partial<Flow>): Flow | undefined;

  /**
   * Delete a flow
   */
  delete(flowId: UUID): boolean;

  /**
   * Execute a flow
   */
  execute(flowId: UUID, input?: Record<string, unknown>): Promise<FlowExecutionContext>;

  /**
   * Get all flows
   */
  getAll(): Flow[];

  /**
   * Validate a flow
   */
  validate(flow: Flow): { valid: boolean; errors: string[]; warnings?: string[] };

  /**
   * Get execution context by ID
   */
  getExecution(executionId: UUID): FlowExecutionContext | undefined;
}

/**
 * Service registry interface
 */
export interface ServiceRegistry {
  /**
   * Register an action
   */
  registerAction(action: Action, pluginName: string): void;

  /**
   * Register a provider
   */
  registerProvider(provider: Provider, pluginName: string): void;

  /**
   * Register an evaluator
   */
  registerEvaluator(evaluator: Evaluator, pluginName: string): void;

  /**
   * Get an action by name
   */
  getAction(name: string): Action | undefined;

  /**
   * Get a provider by name
   */
  getProvider(name: string): Provider | undefined;

  /**
   * Get an evaluator by name
   */
  getEvaluator(name: string): Evaluator | undefined;

  /**
   * Get all actions
   */
  getAllActions(): Map<string, Action>;

  /**
   * Get all providers
   */
  getAllProviders(): Map<string, Provider>;

  /**
   * Get all evaluators
   */
  getAllEvaluators(): Map<string, Evaluator>;

  /**
   * Unregister all services for a plugin
   */
  unregisterPlugin(pluginName: string): void;
}

/**
 * Main SamTerminal Core interface
 */
export interface SamTerminalCore {
  /**
   * Core configuration
   */
  readonly config: CoreConfig;

  /**
   * Runtime engine
   */
  readonly runtime: RuntimeEngine;

  /**
   * Flow engine
   */
  readonly flow: FlowEngine;

  /**
   * Hook manager
   */
  readonly hooks: HookManager;

  /**
   * Service registry
   */
  readonly services: ServiceRegistry;

  /**
   * Plugin manager
   */
  readonly plugins: PluginManager;

  /**
   * Chain manager
   */
  readonly chains: ChainManager;

  /**
   * Event emitter for core events
   */
  readonly events: EventEmitter;

  /**
   * Current agent (if running)
   */
  readonly agent?: Agent;

  /**
   * Initialize core with configuration
   */
  initialize(config?: CoreConfig): Promise<void>;

  /**
   * Start core and load plugins
   */
  start(): Promise<void>;

  /**
   * Stop core and cleanup
   */
  stop(): Promise<void>;

  /**
   * Create and start an agent
   */
  createAgent(config: AgentConfig): Promise<Agent>;

  /**
   * Get core version
   */
  getVersion(): string;
}
