/**
 * Runtime Engine
 * Main runtime engine that orchestrates all components
 */

import { EventEmitter } from 'events';
import type {
  RuntimeEngine as IRuntimeEngine,
  RuntimeState,
  CoreConfig,
  SamTerminalCore,
} from '../interfaces/core.interface.js';
import type { AgentContext, Agent, AgentConfig, UUID } from '../types/index.js';
import { RuntimeStateMachine, createStateMachine } from './state-machine.js';
import { TaskManager, createTaskManager } from './task-manager.js';
import { Executor, ServiceRegistryImpl, createServiceRegistry, createExecutor } from './executor.js';
import { Scheduler, createScheduler } from './scheduler.js';
import { PluginLifecycle, createPluginLifecycle } from '../plugins/lifecycle.js';
import { ChainManagerImpl, createChainManager } from '../chains/manager.js';
import { FlowEngineImpl, createFlowEngine } from '../flow/engine.js';
import { HooksService, createHooksService } from '../hooks/service.js';
import { createLogger } from '../utils/logger.js';
import { uuid } from '../utils/id.js';

const logger = createLogger({ prefix: 'Runtime' });

/**
 * Runtime Engine Implementation
 */
export class RuntimeEngineImpl implements IRuntimeEngine {
  private stateMachine: RuntimeStateMachine;
  private taskManager: TaskManager;
  private executor: Executor;
  private scheduler: Scheduler;
  private pluginLifecycle: PluginLifecycle;
  private chainManager: ChainManagerImpl;
  private flowEngine: FlowEngineImpl;
  private hooksService: HooksService;
  private serviceRegistry: ServiceRegistryImpl;
  private events: EventEmitter;
  private config: CoreConfig;
  private currentAgent?: Agent;

  constructor(config?: CoreConfig) {
    this.config = config ?? {};
    this.stateMachine = createStateMachine();
    this.taskManager = createTaskManager(config?.maxConcurrentTasks ?? 10);
    this.serviceRegistry = createServiceRegistry();
    this.executor = createExecutor(this.serviceRegistry);
    this.scheduler = createScheduler();
    this.pluginLifecycle = createPluginLifecycle();
    this.chainManager = createChainManager();
    this.flowEngine = createFlowEngine();
    this.hooksService = createHooksService();
    this.events = new EventEmitter();
  }

  /**
   * Get current state
   */
  get state(): RuntimeState {
    return this.stateMachine.getState();
  }

  /**
   * Get service registry
   */
  getServiceRegistry(): ServiceRegistryImpl {
    return this.serviceRegistry;
  }

  /**
   * Get plugin lifecycle
   */
  getPluginLifecycle(): PluginLifecycle {
    return this.pluginLifecycle;
  }

  /**
   * Get chain manager
   */
  getChainManager(): ChainManagerImpl {
    return this.chainManager;
  }

  /**
   * Get flow engine
   */
  getFlowEngine(): FlowEngineImpl {
    return this.flowEngine;
  }

  /**
   * Get hooks service
   */
  getHooksService(): HooksService {
    return this.hooksService;
  }

  /**
   * Get task manager
   */
  getTaskManager(): TaskManager {
    return this.taskManager;
  }

  /**
   * Get scheduler
   */
  getScheduler(): Scheduler {
    return this.scheduler;
  }

  /**
   * Get events emitter
   */
  getEvents(): EventEmitter {
    return this.events;
  }

  /**
   * Initialize the runtime
   */
  async initialize(): Promise<void> {
    logger.info('Initializing runtime...');

    await this.stateMachine.transitionTo('initializing');

    try {
      // Set core reference in plugin lifecycle
      // This will be set properly when SamTerminalCore calls setCore

      await this.stateMachine.transitionTo('loading_plugins');

      // Load plugins from config
      if (this.config.plugins) {
        for (const plugin of this.config.plugins) {
          if (typeof plugin === 'string') {
            await this.pluginLifecycle.loadPlugin({
              type: 'package',
              name: plugin,
              config: this.config.pluginConfig?.[plugin],
            });
          } else {
            this.pluginLifecycle.getRegistry().register(plugin);
          }
        }
      }

      await this.stateMachine.transitionTo('ready');
      logger.info('Runtime initialized');

      this.events.emit('system:ready');
    } catch (error) {
      await this.stateMachine.transitionTo('error');
      logger.error('Runtime initialization failed', error as Error);
      throw error;
    }
  }

  /**
   * Start the runtime
   */
  async start(): Promise<void> {
    if (this.stateMachine.getState() !== 'ready') {
      throw new Error('Runtime must be in ready state to start');
    }

    logger.info('Starting runtime...');

    await this.stateMachine.transitionTo('running');

    // Initialize all plugins
    await this.pluginLifecycle.initAll();

    // Start scheduler
    this.scheduler.start();

    logger.info('Runtime started');
    this.events.emit('system:init');
  }

  /**
   * Stop the runtime
   */
  async stop(): Promise<void> {
    logger.info('Stopping runtime...');

    // Stop scheduler
    this.scheduler.stop();

    // Wait for tasks to complete
    await this.taskManager.waitAll();

    // Destroy plugins
    await this.pluginLifecycle.destroyAll();

    await this.stateMachine.transitionTo('shutdown');

    this.events.emit('system:shutdown');
    this.events.removeAllListeners();
    logger.info('Runtime stopped');
  }

  /**
   * Execute an action
   */
  async executeAction(
    actionName: string,
    input: unknown,
    context?: Partial<AgentContext>,
  ): Promise<unknown> {
    const result = await this.executor.executeAction(actionName, input, {
      chainId: context?.chainId,
    });

    if (!result.success) {
      throw new Error(result.error ?? 'Action execution failed');
    }

    return result.data;
  }

  /**
   * Get data from a provider
   */
  async getData(
    providerName: string,
    query: unknown,
    context?: Partial<AgentContext>,
  ): Promise<unknown> {
    const result = await this.executor.getData(providerName, query, {
      chainId: context?.chainId,
    });

    if (!result.success) {
      throw new Error(result.error ?? 'Provider query failed');
    }

    return result.data;
  }

  /**
   * Evaluate a condition
   */
  async evaluate(
    evaluatorName: string,
    condition: unknown,
    data: unknown,
  ): Promise<boolean> {
    return this.executor.evaluate(evaluatorName, condition, data);
  }

  /**
   * Create an agent
   */
  async createAgent(config: AgentConfig): Promise<Agent> {
    const agent: Agent = {
      id: config.id ?? uuid(),
      name: config.name,
      description: config.description,
      status: 'idle',
      config,
      createdAt: new Date(),
    };

    this.currentAgent = agent;
    logger.info(`Agent created: ${agent.name}`, { id: agent.id });

    return agent;
  }

  /**
   * Get current agent
   */
  getAgent(): Agent | undefined {
    return this.currentAgent;
  }

  /**
   * Set core reference
   */
  setCore(core: SamTerminalCore): void {
    this.pluginLifecycle.setCore(core);
    this.flowEngine.setCore(core);
  }

  /**
   * Queue a task
   */
  queueTask<T>(
    execute: () => Promise<T>,
    options?: { name?: string; timeout?: number; priority?: number },
  ) {
    return this.taskManager.enqueue(execute, options);
  }

  /**
   * Schedule a task
   */
  scheduleTask(
    execute: () => Promise<void>,
    options: { name?: string; interval?: number; cron?: string; runOnce?: boolean },
  ) {
    return this.scheduler.schedule(execute, options);
  }

  /**
   * Get runtime stats
   */
  getStats(): {
    state: RuntimeState;
    tasks: ReturnType<TaskManager['getStats']>;
    scheduler: ReturnType<Scheduler['getStats']>;
    services: ReturnType<ServiceRegistryImpl['getStats']>;
  } {
    return {
      state: this.stateMachine.getState(),
      tasks: this.taskManager.getStats(),
      scheduler: this.scheduler.getStats(),
      services: this.serviceRegistry.getStats(),
    };
  }
}

/**
 * Create a runtime engine
 */
export function createRuntimeEngine(config?: CoreConfig): RuntimeEngineImpl {
  return new RuntimeEngineImpl(config);
}
