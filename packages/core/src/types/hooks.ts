/**
 * Hooks-related types for event-driven architecture
 */

import type { UUID } from './common.js';

export type HookEventType =
  // Lifecycle events
  | 'system:init'
  | 'system:ready'
  | 'system:shutdown'
  // Agent events
  | 'agent:start'
  | 'agent:stop'
  | 'agent:error'
  // Plugin events
  | 'plugin:load'
  | 'plugin:unload'
  | 'plugin:error'
  // Flow events
  | 'flow:start'
  | 'flow:complete'
  | 'flow:error'
  | 'flow:node:before'
  | 'flow:node:after'
  | 'flow:node:error'
  // Action events
  | 'action:before'
  | 'action:after'
  | 'action:error'
  // Chain events
  | 'chain:switch'
  | 'chain:transaction:before'
  | 'chain:transaction:after'
  | 'chain:transaction:error'
  // Custom events
  | `custom:${string}`;

export interface HookDefinition {
  name: string;
  event: HookEventType;
  description?: string;
  priority?: number;
  once?: boolean;
  async?: boolean;
  timeout?: number;
}

export interface HookPayload<T = unknown> {
  event: HookEventType;
  timestamp: Date;
  data: T;
  source?: {
    pluginName?: string;
    agentId?: UUID;
    flowId?: UUID;
    nodeId?: UUID;
  };
}

export type HookHandler<T = unknown> = (
  payload: HookPayload<T>,
) => void | Promise<void>;

export interface RegisteredHook {
  id: UUID;
  definition: HookDefinition;
  handler: HookHandler;
  pluginName?: string;
  registeredAt: Date;
}

export interface HookExecutionResult {
  hookId?: UUID;
  hookName: string;
  event?: HookEventType;
  success: boolean;
  duration: number;
  error?: string;
  skipped?: boolean;
}

// Logic Point types for async operations
export interface LogicPoint {
  id: UUID;
  name: string;
  description?: string;
  type: LogicPointType;
  config: LogicPointConfig;
}

export type LogicPointType =
  | 'entry'
  | 'exit'
  | 'checkpoint'
  | 'decision'
  | 'merge';

export interface LogicPointConfig {
  timeout?: number;
  retryOnFailure?: boolean;
  maxRetries?: number;
  fallback?: unknown;
}

// Async node types
export interface AsyncNode {
  id: UUID;
  name: string;
  status: AsyncNodeStatus;
  operation: () => Promise<unknown>;
  result?: unknown;
  error?: Error;
  startedAt?: Date;
  completedAt?: Date;
}

export type AsyncNodeStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface AsyncOperation<T = unknown> {
  id: UUID;
  name: string;
  execute: () => Promise<T>;
  onSuccess?: (result: T) => void | Promise<void>;
  onError?: (error: Error) => void | Promise<void>;
  onFinally?: () => void | Promise<void>;
  timeout?: number;
  retryConfig?: {
    maxAttempts: number;
    delayMs: number;
  };
}
