/**
 * Hook Interface
 * Hooks subscribe to and react to system events
 */

import type {
  HookContext,
  HookEventType,
  HookPayload,
  HookHandler,
  HookExecutionResult,
} from '../types/index.js';

// Re-export for convenience
export type { HookExecutionResult };

/**
 * Hook interface for event handling
 */
export interface Hook {
  /**
   * Unique name of the hook (e.g., "log:transaction", "notify:error")
   */
  readonly name: string;

  /**
   * Event type this hook subscribes to
   */
  readonly event: HookEventType;

  /**
   * Human-readable description
   */
  readonly description?: string;

  /**
   * Handle the event
   * @param context - Hook context with event data
   */
  handler(context: HookContext): Promise<void>;

  /**
   * Priority for execution order (higher = earlier)
   * @default 0
   */
  readonly priority?: number;

  /**
   * Whether to execute only once
   * @default false
   */
  readonly once?: boolean;

  /**
   * Timeout for handler execution in milliseconds
   */
  readonly timeout?: number;

  /**
   * Whether handler errors should stop other hooks
   * @default false
   */
  readonly stopOnError?: boolean;

  /**
   * Filter function to conditionally handle events
   */
  filter?(payload: HookPayload): boolean;

  /**
   * Tags for categorization
   */
  readonly tags?: string[];
}

/**
 * Hook registration result
 */
export interface HookRegistration {
  /**
   * Unique registration ID
   */
  id: string;

  /**
   * Unsubscribe function
   */
  unsubscribe: () => void;
}

/**
 * Options for emitting events
 */
export interface EmitOptions {
  /**
   * Timeout for all handlers in milliseconds
   */
  timeout?: number;

  /**
   * Whether to wait for all handlers to complete
   * @default true
   */
  await?: boolean;

  /**
   * Whether to stop on first error
   * @default false
   */
  stopOnError?: boolean;

  /**
   * Custom metadata to include in payload
   */
  metadata?: Record<string, unknown>;
}

/**
 * Hook manager interface
 */
export interface HookManager {
  /**
   * Register a hook
   */
  register(hook: Hook, pluginName?: string): HookRegistration;

  /**
   * Register a simple handler for an event
   */
  on<T = unknown>(
    event: HookEventType,
    handler: HookHandler<T>,
    options?: Partial<Hook>,
  ): HookRegistration;

  /**
   * Register a one-time handler
   */
  once<T = unknown>(
    event: HookEventType,
    handler: HookHandler<T>,
  ): HookRegistration;

  /**
   * Emit an event to all registered hooks
   */
  emit<T = unknown>(
    event: HookEventType,
    data: T,
    options?: EmitOptions,
  ): Promise<HookExecutionResult[]>;

  /**
   * Unregister a hook by ID
   */
  unregister(id: string): boolean;

  /**
   * Unregister all hooks for a plugin
   */
  unregisterPlugin(pluginName: string): number;

  /**
   * Get all registered hooks for an event
   */
  getHooks(event: HookEventType): Hook[];

  /**
   * Get all registered hooks
   */
  getAllHooks(): Map<HookEventType, Hook[]>;

  /**
   * Clear all hooks
   */
  clear(): void;
}

/**
 * Hook builder for fluent hook creation
 */
export interface HookBuilder {
  name(name: string): HookBuilder;
  event(event: HookEventType): HookBuilder;
  description(description: string): HookBuilder;
  priority(priority: number): HookBuilder;
  once(once: boolean): HookBuilder;
  timeout(timeout: number): HookBuilder;
  filter(filter: (payload: HookPayload) => boolean): HookBuilder;
  handler(handler: (context: HookContext) => Promise<void>): HookBuilder;
  build(): Hook;
}
