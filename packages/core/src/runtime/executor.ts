/**
 * Executor
 * Executes actions and providers
 */

import type { ServiceRegistry } from '../interfaces/core.interface.js';
import type { Action } from '../interfaces/action.interface.js';
import type { Provider } from '../interfaces/provider.interface.js';
import type { Evaluator } from '../interfaces/evaluator.interface.js';
import type {
  ActionContext,
  ActionResult,
  ProviderContext,
  ProviderResult,
  EvaluatorContext,
  UUID,
  ChainId,
} from '../types/index.js';
import { createLogger } from '../utils/logger.js';
import { uuid } from '../utils/id.js';
import { retry } from '../utils/retry.js';

const logger = createLogger({ prefix: 'Executor' });

/**
 * Service Registry Implementation
 */
export class ServiceRegistryImpl implements ServiceRegistry {
  private actions: Map<string, { action: Action; pluginName: string }> = new Map();
  private providers: Map<string, { provider: Provider; pluginName: string }> = new Map();
  private evaluators: Map<string, { evaluator: Evaluator; pluginName: string }> = new Map();

  /**
   * Register an action
   */
  registerAction(action: Action, pluginName: string): void {
    const key = action.name;
    if (this.actions.has(key)) {
      logger.warn(`Action "${key}" already registered, overwriting`);
    }
    this.actions.set(key, { action, pluginName });
    logger.debug(`Action registered: ${key}`, { plugin: pluginName });
  }

  /**
   * Register a provider
   */
  registerProvider(provider: Provider, pluginName: string): void {
    const key = provider.name;
    if (this.providers.has(key)) {
      logger.warn(`Provider "${key}" already registered, overwriting`);
    }
    this.providers.set(key, { provider, pluginName });
    logger.debug(`Provider registered: ${key}`, { plugin: pluginName });
  }

  /**
   * Register an evaluator
   */
  registerEvaluator(evaluator: Evaluator, pluginName: string): void {
    const key = evaluator.name;
    if (this.evaluators.has(key)) {
      logger.warn(`Evaluator "${key}" already registered, overwriting`);
    }
    this.evaluators.set(key, { evaluator, pluginName });
    logger.debug(`Evaluator registered: ${key}`, { plugin: pluginName });
  }

  /**
   * Get an action by name
   */
  getAction(name: string): Action | undefined {
    return this.actions.get(name)?.action;
  }

  /**
   * Get a provider by name
   */
  getProvider(name: string): Provider | undefined {
    return this.providers.get(name)?.provider;
  }

  /**
   * Get an evaluator by name
   */
  getEvaluator(name: string): Evaluator | undefined {
    return this.evaluators.get(name)?.evaluator;
  }

  /**
   * Get all actions
   */
  getAllActions(): Map<string, Action> {
    const result = new Map<string, Action>();
    for (const [key, { action }] of this.actions) {
      result.set(key, action);
    }
    return result;
  }

  /**
   * Get all providers
   */
  getAllProviders(): Map<string, Provider> {
    const result = new Map<string, Provider>();
    for (const [key, { provider }] of this.providers) {
      result.set(key, provider);
    }
    return result;
  }

  /**
   * Get all evaluators
   */
  getAllEvaluators(): Map<string, Evaluator> {
    const result = new Map<string, Evaluator>();
    for (const [key, { evaluator }] of this.evaluators) {
      result.set(key, evaluator);
    }
    return result;
  }

  /**
   * Unregister all services for a plugin
   */
  unregisterPlugin(pluginName: string): void {
    const actionKeys = [...this.actions.entries()]
      .filter(([, { pluginName: pn }]) => pn === pluginName)
      .map(([key]) => key);
    actionKeys.forEach((key) => this.actions.delete(key));

    const providerKeys = [...this.providers.entries()]
      .filter(([, { pluginName: pn }]) => pn === pluginName)
      .map(([key]) => key);
    providerKeys.forEach((key) => this.providers.delete(key));

    const evaluatorKeys = [...this.evaluators.entries()]
      .filter(([, { pluginName: pn }]) => pn === pluginName)
      .map(([key]) => key);
    evaluatorKeys.forEach((key) => this.evaluators.delete(key));

    logger.debug(`Unregistered services for plugin: ${pluginName}`);
  }

  /**
   * Clear all services
   */
  clear(): void {
    this.actions.clear();
    this.providers.clear();
    this.evaluators.clear();
    logger.info('Service registry cleared');
  }

  /**
   * Get stats
   */
  getStats(): { actions: number; providers: number; evaluators: number } {
    return {
      actions: this.actions.size,
      providers: this.providers.size,
      evaluators: this.evaluators.size,
    };
  }
}

/**
 * Executor
 * Handles execution of actions, providers, and evaluators
 */
export class Executor {
  private services: ServiceRegistryImpl;
  private agentId: UUID;

  constructor(services: ServiceRegistryImpl, agentId?: UUID) {
    this.services = services;
    this.agentId = agentId ?? uuid();
  }

  /**
   * Execute an action
   */
  async executeAction(
    name: string,
    input: unknown,
    options?: {
      chainId?: ChainId;
      timeout?: number;
      retry?: boolean;
      maxRetries?: number;
    },
  ): Promise<ActionResult> {
    const entry = this.services.getAction(name);
    if (!entry) {
      return {
        success: false,
        error: `Action not found: ${name}`,
      };
    }

    const action = entry;
    const context: ActionContext = {
      pluginName: name.split(':')[0] ?? 'unknown',
      agentId: this.agentId,
      chainId: options?.chainId,
      input,
    };

    logger.debug(`Executing action: ${name}`, { input });

    try {
      // Validate input if validator exists
      if (action.validate) {
        const validation = action.validate(input);
        if (!validation.valid) {
          return {
            success: false,
            error: `Validation failed: ${validation.errors?.join(', ')}`,
          };
        }
      }

      // Execute with retry if configured
      const execute = () => action.execute(context);

      if (options?.retry) {
        return await retry(execute, {
          maxAttempts: options.maxRetries ?? 3,
          delayMs: 1000,
        });
      }

      return await execute();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Action "${name}" failed`, error as Error);

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Get data from a provider
   */
  async getData(
    name: string,
    query: unknown,
    options?: {
      chainId?: ChainId;
      timeout?: number;
      useCache?: boolean;
    },
  ): Promise<ProviderResult> {
    const entry = this.services.getProvider(name);
    if (!entry) {
      return {
        success: false,
        error: `Provider not found: ${name}`,
        timestamp: new Date(),
      };
    }

    const provider = entry;
    const context: ProviderContext = {
      pluginName: name.split(':')[0] ?? 'unknown',
      agentId: this.agentId,
      chainId: options?.chainId,
      query,
    };

    logger.debug(`Getting data from provider: ${name}`, { query });

    try {
      return await provider.get(context);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Provider "${name}" failed`, error as Error);

      return {
        success: false,
        error: errorMessage,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Evaluate a condition
   */
  async evaluate(
    name: string,
    condition: unknown,
    data: unknown,
  ): Promise<boolean> {
    const entry = this.services.getEvaluator(name);
    if (!entry) {
      throw new Error(`Evaluator not found: ${name}`);
    }

    const evaluator = entry;
    const context: EvaluatorContext = {
      pluginName: name.split(':')[0] ?? 'unknown',
      agentId: this.agentId,
      condition,
      data,
    };

    logger.debug(`Evaluating with: ${name}`);

    return evaluator.evaluate(context);
  }

  /**
   * Get available actions
   */
  getAvailableActions(): string[] {
    return Array.from(this.services.getAllActions().keys());
  }

  /**
   * Get available providers
   */
  getAvailableProviders(): string[] {
    return Array.from(this.services.getAllProviders().keys());
  }

  /**
   * Get available evaluators
   */
  getAvailableEvaluators(): string[] {
    return Array.from(this.services.getAllEvaluators().keys());
  }
}

/**
 * Create a service registry
 */
export function createServiceRegistry(): ServiceRegistryImpl {
  return new ServiceRegistryImpl();
}

/**
 * Create an executor
 */
export function createExecutor(
  services: ServiceRegistryImpl,
  agentId?: UUID,
): Executor {
  return new Executor(services, agentId);
}
