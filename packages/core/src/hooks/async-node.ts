/**
 * Async Node
 * Handles asynchronous operations with lifecycle management
 */

import type { AsyncNode, AsyncNodeStatus, AsyncOperation } from '../types/index.js';
import { createLogger } from '../utils/logger.js';
import { uuid } from '../utils/id.js';
import { retry, sleep } from '../utils/retry.js';

const logger = createLogger({ prefix: 'AsyncNode' });

/**
 * Create an async node
 */
export function createAsyncNode<T>(
  name: string,
  operation: () => Promise<T>,
): AsyncNode {
  return {
    id: uuid(),
    name,
    status: 'pending',
    operation,
  };
}

/**
 * Execute an async node
 */
export async function executeAsyncNode<T>(node: AsyncNode): Promise<T> {
  if (node.status !== 'pending') {
    throw new Error(`Cannot execute node in status: ${node.status}`);
  }

  node.status = 'running';
  node.startedAt = new Date();

  logger.debug(`Executing async node: ${node.name}`);

  try {
    const result = await node.operation();
    node.result = result;
    node.status = 'completed';
    node.completedAt = new Date();

    logger.debug(`Async node completed: ${node.name}`);
    return result as T;
  } catch (error) {
    node.error = error instanceof Error ? error : new Error(String(error));
    node.status = 'failed';
    node.completedAt = new Date();

    logger.error(`Async node failed: ${node.name}`, node.error);
    throw node.error;
  }
}

/**
 * Cancel an async node (if possible)
 */
export function cancelAsyncNode(node: AsyncNode): boolean {
  if (node.status === 'pending' || node.status === 'running') {
    node.status = 'cancelled';
    node.completedAt = new Date();
    logger.debug(`Async node cancelled: ${node.name}`);
    return true;
  }
  return false;
}

/**
 * Async Operation Runner
 * Runs async operations with full lifecycle support
 */
export class AsyncOperationRunner {
  private operations: Map<string, AsyncOperation> = new Map();
  private running: Map<string, Promise<unknown>> = new Map();

  /**
   * Register an operation
   */
  register<T>(operation: AsyncOperation<T>): void {
    this.operations.set(operation.id, operation as AsyncOperation<unknown>);
  }

  /**
   * Run an operation
   */
  async run<T>(operation: AsyncOperation<T>): Promise<T> {
    logger.debug(`Running operation: ${operation.name}`);

    try {
      let result: T;

      if (operation.retryConfig) {
        result = await retry(
          () => this.executeWithTimeout(operation),
          operation.retryConfig,
        );
      } else {
        result = await this.executeWithTimeout(operation);
      }

      if (operation.onSuccess) {
        await operation.onSuccess(result);
      }

      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      if (operation.onError) {
        await operation.onError(err);
      }

      throw err;
    } finally {
      if (operation.onFinally) {
        await operation.onFinally();
      }
    }
  }

  /**
   * Execute operation with timeout
   */
  private async executeWithTimeout<T>(operation: AsyncOperation<T>): Promise<T> {
    if (!operation.timeout) {
      return operation.execute();
    }

    return Promise.race([
      operation.execute(),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Operation "${operation.name}" timed out`)),
          operation.timeout,
        ),
      ),
    ]);
  }

  /**
   * Run operation by ID
   */
  async runById(id: string): Promise<unknown> {
    const operation = this.operations.get(id);
    if (!operation) {
      throw new Error(`Operation not found: ${id}`);
    }

    // Check if already running
    const existingPromise = this.running.get(id);
    if (existingPromise) {
      return existingPromise;
    }

    const promise = this.run(operation);
    this.running.set(id, promise);

    try {
      return await promise;
    } finally {
      this.running.delete(id);
    }
  }

  /**
   * Run multiple operations in parallel
   */
  async runParallel<T>(operations: AsyncOperation<T>[]): Promise<T[]> {
    return Promise.all(operations.map((op) => this.run(op)));
  }

  /**
   * Run multiple operations in sequence
   */
  async runSequence<T>(operations: AsyncOperation<T>[]): Promise<T[]> {
    const results: T[] = [];

    for (const operation of operations) {
      const result = await this.run(operation);
      results.push(result);
    }

    return results;
  }

  /**
   * Run operations with concurrency limit
   */
  async runWithConcurrency<T>(
    operations: AsyncOperation<T>[],
    concurrency: number,
  ): Promise<T[]> {
    const results: T[] = [];
    const running: Promise<void>[] = [];

    for (const operation of operations) {
      const promise = this.run(operation).then((result) => {
        results.push(result);
      });

      running.push(promise);

      if (running.length >= concurrency) {
        await Promise.race(running);
        // Remove completed promises
        const completed = running.filter(
          (p) => !this.isPending(p),
        );
        for (const c of completed) {
          const index = running.indexOf(c);
          if (index > -1) {
            running.splice(index, 1);
          }
        }
      }
    }

    await Promise.all(running);
    return results;
  }

  /**
   * Check if promise is still pending
   */
  private isPending(promise: Promise<unknown>): boolean {
    const pending = Symbol('pending');
    return Promise.race([promise, Promise.resolve(pending)])
      .then((v) => v === pending)
      .catch(() => false) as unknown as boolean;
  }

  /**
   * Clear all registered operations
   */
  clear(): void {
    this.operations.clear();
    this.running.clear();
  }
}

/**
 * Create an async operation
 */
export function createAsyncOperation<T>(config: {
  name: string;
  execute: () => Promise<T>;
  onSuccess?: (result: T) => void | Promise<void>;
  onError?: (error: Error) => void | Promise<void>;
  onFinally?: () => void | Promise<void>;
  timeout?: number;
  retryConfig?: { maxAttempts: number; delayMs: number };
}): AsyncOperation<T> {
  return {
    id: uuid(),
    ...config,
  };
}

/**
 * Create an async operation runner
 */
export function createAsyncOperationRunner(): AsyncOperationRunner {
  return new AsyncOperationRunner();
}
