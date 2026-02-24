/**
 * Scheduler
 * Handles scheduled task execution
 */

import type { UUID } from '../types/index.js';
import { createLogger } from '../utils/logger.js';
import { uuid } from '../utils/id.js';

const logger = createLogger({ prefix: 'Scheduler' });

/**
 * Scheduled task definition
 */
export interface ScheduledTask {
  id: UUID;
  name: string;
  execute: () => Promise<void>;
  interval?: number;
  cron?: string;
  runOnce?: boolean;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  runCount: number;
  errorCount: number;
}

/**
 * Schedule options
 */
export interface ScheduleOptions {
  name?: string;
  interval?: number; // milliseconds
  cron?: string; // cron expression (basic support)
  runOnce?: boolean;
  immediate?: boolean; // run immediately on schedule
}

/**
 * Scheduler
 */
export class Scheduler {
  private tasks: Map<UUID, ScheduledTask> = new Map();
  private timers: Map<UUID, NodeJS.Timeout> = new Map();
  private running = false;

  /**
   * Schedule a task
   */
  schedule(execute: () => Promise<void>, options: ScheduleOptions): ScheduledTask {
    if (!options.interval && !options.cron) {
      throw new Error('Either interval or cron must be specified');
    }

    const task: ScheduledTask = {
      id: uuid(),
      name: options.name ?? 'Unnamed Task',
      execute,
      interval: options.interval,
      cron: options.cron,
      runOnce: options.runOnce,
      enabled: true,
      runCount: 0,
      errorCount: 0,
    };

    this.tasks.set(task.id, task);
    logger.info(`Task scheduled: ${task.name}`, {
      id: task.id,
      interval: task.interval,
      cron: task.cron,
    });

    // Start if scheduler is running
    if (this.running) {
      this.startTask(task, options.immediate);
    }

    return task;
  }

  /**
   * Start the scheduler
   */
  start(): void {
    if (this.running) return;

    this.running = true;
    logger.info('Scheduler started');

    // Start all tasks
    for (const task of this.tasks.values()) {
      if (task.enabled) {
        this.startTask(task);
      }
    }
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    this.running = false;

    // Clear all timers
    for (const [taskId, timer] of this.timers) {
      clearInterval(timer);
      this.timers.delete(taskId);
    }

    logger.info('Scheduler stopped');
  }

  /**
   * Start a specific task
   */
  private startTask(task: ScheduledTask, immediate = false): void {
    // Clear existing timer if any
    const existingTimer = this.timers.get(task.id);
    if (existingTimer) {
      clearInterval(existingTimer);
    }

    // Calculate interval
    let intervalMs: number;
    if (task.interval) {
      intervalMs = task.interval;
    } else if (task.cron) {
      intervalMs = this.parseCronToInterval(task.cron);
    } else {
      return;
    }

    // Set up interval
    const timer = setInterval(() => {
      this.runTask(task);
    }, intervalMs);

    this.timers.set(task.id, timer);
    task.nextRun = new Date(Date.now() + intervalMs);

    // Run immediately if requested
    if (immediate) {
      this.runTask(task);
    }

    logger.debug(`Task timer started: ${task.name}`, { interval: intervalMs });
  }

  /**
   * Run a task
   */
  private async runTask(task: ScheduledTask): Promise<void> {
    if (!task.enabled) return;

    logger.debug(`Running scheduled task: ${task.name}`);

    try {
      await task.execute();
      task.runCount++;
      task.lastRun = new Date();

      logger.debug(`Scheduled task completed: ${task.name}`);

      // Disable if run once
      if (task.runOnce) {
        this.disable(task.id);
      }
    } catch (error) {
      task.errorCount++;
      logger.error(`Scheduled task failed: ${task.name}`, error as Error);
    }

    // Update next run time
    if (task.interval) {
      task.nextRun = new Date(Date.now() + task.interval);
    }
  }

  /**
   * Enable a task
   */
  enable(taskId: UUID): boolean {
    const task = this.tasks.get(taskId);
    if (!task) return false;

    task.enabled = true;
    if (this.running) {
      this.startTask(task);
    }

    logger.debug(`Task enabled: ${task.name}`);
    return true;
  }

  /**
   * Disable a task
   */
  disable(taskId: UUID): boolean {
    const task = this.tasks.get(taskId);
    if (!task) return false;

    task.enabled = false;

    const timer = this.timers.get(taskId);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(taskId);
    }

    logger.debug(`Task disabled: ${task.name}`);
    return true;
  }

  /**
   * Remove a task
   */
  remove(taskId: UUID): boolean {
    this.disable(taskId);
    const deleted = this.tasks.delete(taskId);

    if (deleted) {
      logger.debug(`Task removed: ${taskId}`);
    }

    return deleted;
  }

  /**
   * Get a task
   */
  get(taskId: UUID): ScheduledTask | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * Get all tasks
   */
  getAll(): ScheduledTask[] {
    return Array.from(this.tasks.values());
  }

  /**
   * Parse basic cron expression to interval
   * Supports: @hourly, @daily, @weekly, or simple intervals
   */
  private parseCronToInterval(cron: string): number {
    const presets: Record<string, number> = {
      '@yearly': 365 * 24 * 60 * 60 * 1000,
      '@monthly': 30 * 24 * 60 * 60 * 1000,
      '@weekly': 7 * 24 * 60 * 60 * 1000,
      '@daily': 24 * 60 * 60 * 1000,
      '@hourly': 60 * 60 * 1000,
      '@minutely': 60 * 1000,
    };

    if (presets[cron]) {
      return presets[cron];
    }

    // Basic cron parsing (minute hour day month weekday)
    const parts = cron.split(' ');
    if (parts.length >= 5) {
      // Check for */n patterns
      const minute = parts[0];
      if (minute.startsWith('*/')) {
        const n = parseInt(minute.slice(2), 10);
        return n * 60 * 1000;
      }

      const hour = parts[1];
      if (hour.startsWith('*/')) {
        const n = parseInt(hour.slice(2), 10);
        return n * 60 * 60 * 1000;
      }
    }

    throw new Error(`Invalid cron expression: "${cron}". Use @hourly, @daily, @weekly, @monthly, @yearly, @minutely, or */n minute/hour patterns.`);
  }

  /**
   * Run a task immediately (bypass schedule)
   */
  async runNow(taskId: UUID): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    await this.runTask(task);
  }

  /**
   * Clear all tasks
   */
  clear(): void {
    this.stop();
    this.tasks.clear();
    logger.info('Scheduler cleared');
  }

  /**
   * Get scheduler status
   */
  isRunning(): boolean {
    return this.running;
  }

  /**
   * Get stats
   */
  getStats(): {
    total: number;
    enabled: number;
    totalRuns: number;
    totalErrors: number;
  } {
    let enabled = 0;
    let totalRuns = 0;
    let totalErrors = 0;

    for (const task of this.tasks.values()) {
      if (task.enabled) enabled++;
      totalRuns += task.runCount;
      totalErrors += task.errorCount;
    }

    return {
      total: this.tasks.size,
      enabled,
      totalRuns,
      totalErrors,
    };
  }
}

/**
 * Create a scheduler
 */
export function createScheduler(): Scheduler {
  return new Scheduler();
}
