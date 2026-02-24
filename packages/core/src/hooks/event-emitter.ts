/**
 * Type-safe Event Emitter
 * A typed wrapper around the standard EventEmitter
 */

import { EventEmitter as NodeEventEmitter } from 'events';
import type { HookEventType, HookPayload } from '../types/index.js';

/**
 * Event map for type safety
 */
export interface SamTerminalEventMap {
  // System events
  'system:init': void;
  'system:ready': void;
  'system:shutdown': void;

  // Agent events
  'agent:start': { agentId: string };
  'agent:stop': { agentId: string };
  'agent:error': { agentId: string; error: Error };

  // Plugin events
  'plugin:load': { pluginName: string };
  'plugin:unload': { pluginName: string };
  'plugin:error': { pluginName: string; error: Error };

  // Flow events
  'flow:start': { flowId: string; executionId: string };
  'flow:complete': { flowId: string; executionId: string; result: unknown };
  'flow:error': { flowId: string; executionId: string; error: Error };
  'flow:node:before': { flowId: string; nodeId: string };
  'flow:node:after': { flowId: string; nodeId: string; result: unknown };
  'flow:node:error': { flowId: string; nodeId: string; error: Error };

  // Action events
  'action:before': { actionName: string; input: unknown };
  'action:after': { actionName: string; result: unknown };
  'action:error': { actionName: string; error: Error };

  // Chain events
  'chain:switch': { fromChain?: string | number; toChain: string | number };
  'chain:transaction:before': { chainId: string | number; tx: unknown };
  'chain:transaction:after': { chainId: string | number; hash: string };
  'chain:transaction:error': { chainId: string | number; error: Error };

  // Generic custom event
  [key: `custom:${string}`]: unknown;
}

/**
 * Listener type
 */
export type EventListener<T> = (data: T) => void | Promise<void>;

/**
 * Type-safe Event Emitter
 */
export class TypedEventEmitter {
  private emitter: NodeEventEmitter;

  constructor() {
    this.emitter = new NodeEventEmitter();
    this.emitter.setMaxListeners(100); // Increase default limit
  }

  /**
   * Add a listener for an event
   */
  on<K extends keyof SamTerminalEventMap>(
    event: K,
    listener: EventListener<SamTerminalEventMap[K]>,
  ): this {
    this.emitter.on(event, listener as any);
    return this;
  }

  /**
   * Add a one-time listener for an event
   */
  once<K extends keyof SamTerminalEventMap>(
    event: K,
    listener: EventListener<SamTerminalEventMap[K]>,
  ): this {
    this.emitter.once(event, listener as any);
    return this;
  }

  /**
   * Remove a listener for an event
   */
  off<K extends keyof SamTerminalEventMap>(
    event: K,
    listener: EventListener<SamTerminalEventMap[K]>,
  ): this {
    this.emitter.off(event, listener as any);
    return this;
  }

  /**
   * Emit an event
   */
  emit<K extends keyof SamTerminalEventMap>(
    event: K,
    data: SamTerminalEventMap[K],
  ): boolean {
    return this.emitter.emit(event, data);
  }

  /**
   * Remove all listeners for an event
   */
  removeAllListeners<K extends keyof SamTerminalEventMap>(event?: K): this {
    this.emitter.removeAllListeners(event);
    return this;
  }

  /**
   * Get listener count for an event
   */
  listenerCount<K extends keyof SamTerminalEventMap>(event: K): number {
    return this.emitter.listenerCount(event);
  }

  /**
   * Get all listeners for an event
   */
  listeners<K extends keyof SamTerminalEventMap>(
    event: K,
  ): EventListener<SamTerminalEventMap[K]>[] {
    return this.emitter.listeners(event) as EventListener<SamTerminalEventMap[K]>[];
  }

  /**
   * Get the underlying EventEmitter
   */
  getEmitter(): NodeEventEmitter {
    return this.emitter;
  }

  /**
   * Set max listeners
   */
  setMaxListeners(n: number): this {
    this.emitter.setMaxListeners(n);
    return this;
  }

  /**
   * Wait for an event
   */
  waitFor<K extends keyof SamTerminalEventMap>(
    event: K,
    timeoutMs?: number,
  ): Promise<SamTerminalEventMap[K]> {
    return new Promise((resolve, reject) => {
      let timeoutId: NodeJS.Timeout | undefined;

      const listener = (data: SamTerminalEventMap[K]) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        resolve(data);
      };

      this.once(event, listener);

      if (timeoutMs) {
        timeoutId = setTimeout(() => {
          this.off(event, listener);
          reject(new Error(`Timeout waiting for event: ${event}`));
        }, timeoutMs);
      }
    });
  }
}

/**
 * Create a new typed event emitter
 */
export function createEventEmitter(): TypedEventEmitter {
  return new TypedEventEmitter();
}
