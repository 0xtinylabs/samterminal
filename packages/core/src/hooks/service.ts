/**
 * Hooks Service
 * Central event management for SamTerminal
 */

import type {
  Hook,
  HookManager,
  HookRegistration,
  HookExecutionResult,
  EmitOptions,
} from '../interfaces/hook.interface.js';
import type {
  HookEventType,
  HookPayload,
  HookHandler,
  RegisteredHook,
} from '../types/index.js';
import { createLogger } from '../utils/logger.js';
import { uuid } from '../utils/id.js';

const logger = createLogger({ prefix: 'HooksService' });

/**
 * Default emit options
 */
const DEFAULT_EMIT_OPTIONS: EmitOptions = {
  await: true,
  stopOnError: false,
};

/**
 * Hooks Service Implementation
 */
export class HooksService implements HookManager {
  private hooks: Map<HookEventType, RegisteredHook[]> = new Map();
  private allHooksById: Map<string, RegisteredHook> = new Map();

  /**
   * Register a hook
   */
  register(hook: Hook, pluginName?: string): HookRegistration {
    const id = uuid();

    const registeredHook: RegisteredHook = {
      id,
      definition: {
        name: hook.name,
        event: hook.event,
        description: hook.description,
        priority: hook.priority ?? 0,
        once: hook.once ?? false,
        async: true,
        timeout: hook.timeout,
      },
      handler: hook.handler as HookHandler,
      pluginName,
      registeredAt: new Date(),
    };

    // Get or create event array
    const eventHooks = this.hooks.get(hook.event) ?? [];
    eventHooks.push(registeredHook);

    // Sort by priority (descending)
    eventHooks.sort((a, b) => (b.definition.priority ?? 0) - (a.definition.priority ?? 0));

    this.hooks.set(hook.event, eventHooks);
    this.allHooksById.set(id, registeredHook);

    logger.debug(`Hook registered: ${hook.name}`, {
      event: hook.event,
      plugin: pluginName,
      priority: hook.priority,
    });

    const unsubscribe = () => this.unregister(id);

    return { id, unsubscribe };
  }

  /**
   * Register a simple handler for an event
   */
  on<T = unknown>(
    event: HookEventType,
    handler: HookHandler<T>,
    options?: Partial<Hook>,
  ): HookRegistration {
    const hook: Hook = {
      name: options?.name ?? `${event}-handler-${uuid().substring(0, 8)}`,
      event,
      description: options?.description,
      priority: options?.priority,
      once: options?.once,
      timeout: options?.timeout,
      handler: handler as (context: any) => Promise<void>,
    };

    return this.register(hook);
  }

  /**
   * Register a one-time handler
   */
  once<T = unknown>(
    event: HookEventType,
    handler: HookHandler<T>,
  ): HookRegistration {
    return this.on(event, handler, { once: true });
  }

  /**
   * Emit an event to all registered hooks
   */
  async emit<T = unknown>(
    event: HookEventType,
    data: T,
    options?: EmitOptions,
  ): Promise<HookExecutionResult[]> {
    const opts = { ...DEFAULT_EMIT_OPTIONS, ...options };
    const eventHooks = this.hooks.get(event) ?? [];

    if (eventHooks.length === 0) {
      return [];
    }

    logger.debug(`Emitting event: ${event}`, {
      hookCount: eventHooks.length,
    });

    const payload: HookPayload<T> = {
      event,
      timestamp: new Date(),
      data,
      source: opts.metadata as any,
    };

    const results: HookExecutionResult[] = [];
    const toRemove: string[] = [];

    for (const registeredHook of eventHooks) {
      const hook = registeredHook.definition;

      // Check filter
      const hookWithFilter = this.allHooksById.get(registeredHook.id);
      if (hookWithFilter) {
        // Note: filter is not on RegisteredHook, would need to track separately
      }

      const startTime = Date.now();
      let success = true;
      let error: string | undefined;

      try {
        const timeoutMs = opts.timeout ?? hook.timeout;
        const handlerPromise = registeredHook.handler(payload);

        if (timeoutMs) {
          await Promise.race([
            handlerPromise,
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('Hook timeout')), timeoutMs),
            ),
          ]);
        } else if (opts.await) {
          await handlerPromise;
        }
      } catch (err) {
        success = false;
        const errObj = err instanceof Error ? err : new Error(String(err));
        error = errObj.message;
        logger.error(`Hook "${hook.name}" failed`, errObj);

        if (opts.stopOnError) {
          results.push({
            hookName: hook.name,
            success: false,
            duration: Date.now() - startTime,
            error,
          });
          break;
        }
      }

      results.push({
        hookName: hook.name,
        success,
        duration: Date.now() - startTime,
        error,
      });

      // Mark for removal if one-time hook
      if (hook.once) {
        toRemove.push(registeredHook.id);
      }
    }

    // Remove one-time hooks
    for (const id of toRemove) {
      this.unregister(id);
    }

    return results;
  }

  /**
   * Unregister a hook by ID
   */
  unregister(id: string): boolean {
    const hook = this.allHooksById.get(id);
    if (!hook) {
      return false;
    }

    // Remove from event array
    const eventHooks = this.hooks.get(hook.definition.event);
    if (eventHooks) {
      const index = eventHooks.findIndex((h) => h.id === id);
      if (index > -1) {
        eventHooks.splice(index, 1);
      }
    }

    this.allHooksById.delete(id);

    logger.debug(`Hook unregistered: ${hook.definition.name}`);
    return true;
  }

  /**
   * Unregister all hooks for a plugin
   */
  unregisterPlugin(pluginName: string): number {
    const idsToRemove = [...this.allHooksById.entries()]
      .filter(([, hook]) => hook.pluginName === pluginName)
      .map(([id]) => id);

    for (const id of idsToRemove) {
      this.unregister(id);
    }

    logger.debug(`Unregistered ${idsToRemove.length} hooks for plugin: ${pluginName}`);
    return idsToRemove.length;
  }

  /**
   * Get all registered hooks for an event
   */
  getHooks(event: HookEventType): Hook[] {
    const registeredHooks = this.hooks.get(event) ?? [];
    return registeredHooks.map((rh) => ({
      name: rh.definition.name,
      event: rh.definition.event,
      description: rh.definition.description,
      priority: rh.definition.priority,
      once: rh.definition.once,
      timeout: rh.definition.timeout,
      handler: rh.handler as any,
    }));
  }

  /**
   * Get all registered hooks
   */
  getAllHooks(): Map<HookEventType, Hook[]> {
    const result = new Map<HookEventType, Hook[]>();

    for (const [event] of this.hooks) {
      result.set(event, this.getHooks(event));
    }

    return result;
  }

  /**
   * Get registered events
   */
  getEvents(): HookEventType[] {
    return Array.from(this.hooks.keys());
  }

  /**
   * Get hook count for an event
   */
  getHookCount(event: HookEventType): number {
    return this.hooks.get(event)?.length ?? 0;
  }

  /**
   * Get total hook count
   */
  getTotalHookCount(): number {
    return this.allHooksById.size;
  }

  /**
   * Clear all hooks
   */
  clear(): void {
    this.hooks.clear();
    this.allHooksById.clear();
    logger.info('Hooks service cleared');
  }
}

/**
 * Create a new hooks service
 */
export function createHooksService(): HooksService {
  return new HooksService();
}
