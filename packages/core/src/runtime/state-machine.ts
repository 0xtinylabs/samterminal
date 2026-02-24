/**
 * Runtime State Machine
 * Manages runtime state transitions
 */

import type { RuntimeState } from '../interfaces/core.interface.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger({ prefix: 'StateMachine' });

const MAX_HISTORY = 100;

/**
 * Valid state transitions
 */
const VALID_TRANSITIONS: Record<RuntimeState, RuntimeState[]> = {
  uninitialized: ['initializing'],
  initializing: ['loading_plugins', 'error'],
  loading_plugins: ['ready', 'error'],
  ready: ['running', 'shutdown', 'error'],
  running: ['ready', 'shutdown', 'error'],
  error: ['shutdown', 'initializing'],
  shutdown: ['uninitialized'],
};

/**
 * State transition listener
 */
export type StateTransitionListener = (
  from: RuntimeState,
  to: RuntimeState,
) => void | Promise<void>;

/**
 * Runtime State Machine
 */
export class RuntimeStateMachine {
  private currentState: RuntimeState = 'uninitialized';
  private listeners: StateTransitionListener[] = [];
  private transitionHistory: Array<{ from: RuntimeState; to: RuntimeState; at: Date }> = [];

  /**
   * Get current state
   */
  getState(): RuntimeState {
    return this.currentState;
  }

  /**
   * Check if transition is valid
   */
  canTransitionTo(state: RuntimeState): boolean {
    const validTargets = VALID_TRANSITIONS[this.currentState];
    return validTargets?.includes(state) ?? false;
  }

  /**
   * Get valid transitions from current state
   */
  getValidTransitions(): RuntimeState[] {
    return [...(VALID_TRANSITIONS[this.currentState] ?? [])];
  }

  /**
   * Transition to a new state
   */
  async transitionTo(state: RuntimeState): Promise<void> {
    if (!this.canTransitionTo(state)) {
      throw new Error(
        `Invalid state transition: ${this.currentState} -> ${state}. ` +
          `Valid transitions: ${this.getValidTransitions().join(', ')}`,
      );
    }

    const from = this.currentState;
    logger.info(`State transition: ${from} -> ${state}`);

    this.transitionHistory.push({
      from,
      to: state,
      at: new Date(),
    });
    // Keep history bounded
    if (this.transitionHistory.length > MAX_HISTORY) {
      this.transitionHistory = this.transitionHistory.slice(-MAX_HISTORY);
    }

    this.currentState = state;

    // Notify listeners
    for (const listener of this.listeners) {
      try {
        await listener(from, state);
      } catch (error) {
        logger.error('State transition listener error', error as Error);
      }
    }
  }

  /**
   * Force state (for recovery scenarios)
   */
  forceState(state: RuntimeState): void {
    logger.warn(`Force state change: ${this.currentState} -> ${state}`);
    this.currentState = state;
  }

  /**
   * Add state transition listener
   */
  onTransition(listener: StateTransitionListener): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Get transition history
   */
  getHistory(): Array<{ from: RuntimeState; to: RuntimeState; at: Date }> {
    return [...this.transitionHistory];
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.transitionHistory = [];
  }

  /**
   * Check if in specific state
   */
  isIn(state: RuntimeState): boolean {
    return this.currentState === state;
  }

  /**
   * Check if running
   */
  isRunning(): boolean {
    return this.currentState === 'running';
  }

  /**
   * Check if ready (or running)
   */
  isReady(): boolean {
    return this.currentState === 'ready' || this.currentState === 'running';
  }

  /**
   * Check if in error state
   */
  isError(): boolean {
    return this.currentState === 'error';
  }

  /**
   * Reset to initial state
   */
  reset(): void {
    this.currentState = 'uninitialized';
    this.transitionHistory = [];
    this.listeners = [];
    logger.info('State machine reset');
  }
}

/**
 * Create a new state machine
 */
export function createStateMachine(): RuntimeStateMachine {
  return new RuntimeStateMachine();
}
