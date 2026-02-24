/**
 * Task Manager
 * Manages concurrent task execution
 */

import type { UUID } from '../types/index.js';
import { createLogger } from '../utils/logger.js';
import { uuid } from '../utils/id.js';

const logger = createLogger({ prefix: 'TaskManager' });

/**
 * Task status
 */
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

/**
 * Task definition
 */
export interface Task<T = unknown> {
  id: UUID;
  name: string;
  status: TaskStatus;
  execute: () => Promise<T>;
  result?: T;
  error?: Error;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  timeout?: number;
  priority?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Task options
 */
export interface TaskOptions {
  name?: string;
  timeout?: number;
  priority?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Task event
 */
export interface TaskEvent {
  type: 'started' | 'completed' | 'failed' | 'cancelled';
  task: Task;
}

/**
 * Task event listener
 */
export type TaskEventListener = (event: TaskEvent) => void;

/**
 * Task Manager
 */
export class TaskManager {
  private tasks: Map<UUID, Task> = new Map();
  private runningTasks: Set<UUID> = new Set();
  private queue: UUID[] = [];
  private maxConcurrent: number;
  private listeners: TaskEventListener[] = [];
  private processingPromise: Promise<void> | null = null;

  constructor(maxConcurrent = 10) {
    this.maxConcurrent = maxConcurrent;
  }

  /**
   * Set max concurrent tasks
   */
  setMaxConcurrent(max: number): void {
    this.maxConcurrent = max;
    this.processQueue();
  }

  /**
   * Create and enqueue a task
   */
  enqueue<T>(
    execute: () => Promise<T>,
    options?: TaskOptions,
  ): Task<T> {
    const task: Task<T> = {
      id: uuid(),
      name: options?.name ?? 'Unnamed Task',
      status: 'pending',
      execute,
      createdAt: new Date(),
      timeout: options?.timeout,
      priority: options?.priority ?? 0,
      metadata: options?.metadata,
    };

    this.tasks.set(task.id, task as Task);
    this.queue.push(task.id);

    // Sort queue by priority
    this.queue.sort((a, b) => {
      const taskA = this.tasks.get(a);
      const taskB = this.tasks.get(b);
      return (taskB?.priority ?? 0) - (taskA?.priority ?? 0);
    });

    logger.debug(`Task queued: ${task.name}`, { id: task.id });
    this.processQueue();

    return task;
  }

  /**
   * Run a task immediately (bypasses queue)
   */
  async run<T>(
    execute: () => Promise<T>,
    options?: TaskOptions,
  ): Promise<T> {
    const task = this.enqueue(execute, options);
    return this.waitFor(task.id) as Promise<T>;
  }

  /**
   * Wait for a task to complete
   */
  async waitFor<T>(taskId: UUID): Promise<T> {
    return new Promise((resolve, reject) => {
      const checkTask = () => {
        const task = this.tasks.get(taskId);
        if (!task) {
          reject(new Error(`Task not found: ${taskId}`));
          return;
        }

        if (task.status === 'completed') {
          resolve(task.result as T);
        } else if (task.status === 'failed') {
          reject(task.error ?? new Error('Task failed'));
        } else if (task.status === 'cancelled') {
          reject(new Error('Task was cancelled'));
        } else {
          // Check again later
          setTimeout(checkTask, 10);
        }
      };

      checkTask();
    });
  }

  /**
   * Cancel a task
   */
  cancel(taskId: UUID): boolean {
    const task = this.tasks.get(taskId);
    if (!task) {
      return false;
    }

    if (task.status === 'pending') {
      task.status = 'cancelled';
      const queueIndex = this.queue.indexOf(taskId);
      if (queueIndex > -1) {
        this.queue.splice(queueIndex, 1);
      }
      this.emit({ type: 'cancelled', task });
      return true;
    }

    return false;
  }

  /**
   * Get task by ID
   */
  get(taskId: UUID): Task | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * Get all tasks
   */
  getAll(): Task[] {
    return Array.from(this.tasks.values());
  }

  /**
   * Get pending tasks
   */
  getPending(): Task[] {
    return this.queue
      .map((id) => this.tasks.get(id))
      .filter((t): t is Task => t !== undefined);
  }

  /**
   * Get running tasks
   */
  getRunning(): Task[] {
    return Array.from(this.runningTasks)
      .map((id) => this.tasks.get(id))
      .filter((t): t is Task => t !== undefined);
  }

  /**
   * Process the queue
   */
  private async processQueue(): Promise<void> {
    if (this.processingPromise) {
      // If already processing, schedule a re-check after current processing completes
      this.processingPromise.then(() => {
        if (this.queue.length > 0 && this.runningTasks.size < this.maxConcurrent) {
          this.processQueue();
        }
      });
      return;
    }

    this.processingPromise = this.doProcessQueue();
    try {
      await this.processingPromise;
    } finally {
      this.processingPromise = null;
    }
  }

  private async doProcessQueue(): Promise<void> {
    while (
      this.queue.length > 0 &&
      this.runningTasks.size < this.maxConcurrent
    ) {
      const taskId = this.queue.shift();
      if (!taskId) continue;

      const task = this.tasks.get(taskId);
      if (!task || task.status !== 'pending') continue;

      // Run task asynchronously
      this.executeTask(task).catch(() => {
        // Error handling is done in executeTask
      });
    }
  }

  /**
   * Execute a task
   */
  private async executeTask(task: Task): Promise<void> {
    task.status = 'running';
    task.startedAt = new Date();
    this.runningTasks.add(task.id);

    logger.debug(`Task started: ${task.name}`, { id: task.id });
    this.emit({ type: 'started', task });

    try {
      const executeWithTimeout = async () => {
        if (task.timeout) {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), task.timeout);
          try {
            return await Promise.race([
              task.execute(),
              new Promise<never>((_, reject) => {
                controller.signal.addEventListener('abort', () => {
                  reject(new Error(`Task timeout after ${task.timeout}ms`));
                });
              }),
            ]);
          } finally {
            clearTimeout(timeoutId);
          }
        }
        return task.execute();
      };

      task.result = await executeWithTimeout();
      task.status = 'completed';
      task.completedAt = new Date();

      logger.debug(`Task completed: ${task.name}`, { id: task.id });
      this.emit({ type: 'completed', task });
    } catch (error) {
      task.error = error instanceof Error ? error : new Error(String(error));
      task.status = 'failed';
      task.completedAt = new Date();

      logger.error(`Task failed: ${task.name}`, task.error, { id: task.id });
      this.emit({ type: 'failed', task });
    } finally {
      this.runningTasks.delete(task.id);
      // Auto-cleanup when too many completed/failed tasks accumulate
      if (this.tasks.size > 1000) {
        this.cleanup();
      }
      this.processQueue();
    }
  }

  /**
   * Add event listener
   */
  on(listener: TaskEventListener): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Emit event
   */
  private emit(event: TaskEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (error) {
        logger.error('Task event listener error', error as Error);
      }
    }
  }

  /**
   * Wait for all tasks to complete
   */
  async waitAll(): Promise<void> {
    while (this.queue.length > 0 || this.runningTasks.size > 0) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  /**
   * Clear completed/failed tasks
   */
  cleanup(): number {
    let count = 0;

    for (const [id, task] of this.tasks) {
      if (task.status === 'completed' || task.status === 'failed') {
        this.tasks.delete(id);
        count++;
      }
    }

    logger.debug(`Cleaned up ${count} tasks`);
    return count;
  }

  /**
   * Clear all tasks
   */
  clear(): void {
    this.queue = [];
    this.runningTasks.clear();
    this.tasks.clear();
    logger.info('Task manager cleared');
  }

  /**
   * Get stats
   */
  getStats(): {
    total: number;
    pending: number;
    running: number;
    completed: number;
    failed: number;
  } {
    let pending = 0;
    let running = 0;
    let completed = 0;
    let failed = 0;

    for (const task of this.tasks.values()) {
      switch (task.status) {
        case 'pending':
          pending++;
          break;
        case 'running':
          running++;
          break;
        case 'completed':
          completed++;
          break;
        case 'failed':
          failed++;
          break;
      }
    }

    return {
      total: this.tasks.size,
      pending,
      running,
      completed,
      failed,
    };
  }
}

/**
 * Create a task manager
 */
export function createTaskManager(maxConcurrent?: number): TaskManager {
  return new TaskManager(maxConcurrent);
}
