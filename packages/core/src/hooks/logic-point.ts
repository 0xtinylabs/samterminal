/**
 * Logic Point
 * Abstraction for control flow points in execution
 */

import type { LogicPoint, LogicPointType, LogicPointConfig } from '../types/index.js';
import { createLogger } from '../utils/logger.js';
import { uuid } from '../utils/id.js';
import { retry } from '../utils/retry.js';

const logger = createLogger({ prefix: 'LogicPoint' });

/**
 * Logic point execution context
 */
export interface LogicPointContext {
  input: unknown;
  metadata?: Record<string, unknown>;
}

/**
 * Logic point execution result
 */
export interface LogicPointResult {
  output: unknown;
  nextPoints?: string[];
  skip?: boolean;
}

/**
 * Logic point handler
 */
export type LogicPointHandler = (
  context: LogicPointContext,
) => Promise<LogicPointResult>;

/**
 * Registered logic point
 */
interface RegisteredLogicPoint extends LogicPoint {
  handler: LogicPointHandler;
}

/**
 * Logic Point Manager
 * Manages execution flow through logic points
 */
export class LogicPointManager {
  private points: Map<string, RegisteredLogicPoint> = new Map();

  /**
   * Create and register a logic point
   */
  create(config: {
    name: string;
    description?: string;
    type: LogicPointType;
    handler: LogicPointHandler;
    config?: LogicPointConfig;
  }): LogicPoint {
    const point: RegisteredLogicPoint = {
      id: uuid(),
      name: config.name,
      description: config.description,
      type: config.type,
      config: config.config ?? {},
      handler: config.handler,
    };

    this.points.set(point.id, point);
    logger.debug(`Logic point created: ${point.name}`, { type: point.type });

    return point;
  }

  /**
   * Get a logic point by ID
   */
  get(id: string): LogicPoint | undefined {
    return this.points.get(id);
  }

  /**
   * Get a logic point by name
   */
  getByName(name: string): LogicPoint | undefined {
    for (const point of this.points.values()) {
      if (point.name === name) {
        return point;
      }
    }
    return undefined;
  }

  /**
   * Execute a logic point
   */
  async execute(id: string, context: LogicPointContext): Promise<LogicPointResult> {
    const point = this.points.get(id);
    if (!point) {
      throw new Error(`Logic point not found: ${id}`);
    }

    logger.debug(`Executing logic point: ${point.name}`);

    const config = point.config;
    const executor = async () => {
      const timeoutMs = config.timeout;

      if (timeoutMs) {
        return Promise.race([
          point.handler(context),
          new Promise<never>((_, reject) =>
            setTimeout(
              () => reject(new Error(`Logic point "${point.name}" timed out`)),
              timeoutMs,
            ),
          ),
        ]);
      }

      return point.handler(context);
    };

    try {
      if (config.retryOnFailure && config.maxRetries) {
        return await retry(executor, {
          maxAttempts: config.maxRetries,
          delayMs: 1000,
        });
      }

      return await executor();
    } catch (error) {
      if (config.fallback !== undefined) {
        logger.warn(`Logic point "${point.name}" failed, using fallback`);
        return { output: config.fallback };
      }
      throw error;
    }
  }

  /**
   * Execute multiple logic points in sequence
   */
  async executeSequence(
    ids: string[],
    initialContext: LogicPointContext,
  ): Promise<LogicPointResult[]> {
    const results: LogicPointResult[] = [];
    let currentContext = initialContext;

    for (const id of ids) {
      const result = await this.execute(id, currentContext);
      results.push(result);

      if (result.skip) {
        break;
      }

      // Pass output to next point
      currentContext = {
        input: result.output,
        metadata: currentContext.metadata,
      };
    }

    return results;
  }

  /**
   * Execute logic points based on decision
   */
  async executeDecision(
    decisionPointId: string,
    context: LogicPointContext,
    branches: Record<string, string>,
  ): Promise<LogicPointResult> {
    const decisionResult = await this.execute(decisionPointId, context);

    const branchKey = String(decisionResult.output);
    const nextPointId = branches[branchKey] ?? branches['default'];

    if (!nextPointId) {
      throw new Error(`No branch found for decision result: ${branchKey}`);
    }

    return this.execute(nextPointId, {
      input: context.input,
      metadata: {
        ...context.metadata,
        decisionResult: decisionResult.output,
      },
    });
  }

  /**
   * Remove a logic point
   */
  remove(id: string): boolean {
    return this.points.delete(id);
  }

  /**
   * Get all logic points
   */
  getAll(): LogicPoint[] {
    return Array.from(this.points.values());
  }

  /**
   * Get logic points by type
   */
  getByType(type: LogicPointType): LogicPoint[] {
    return Array.from(this.points.values()).filter((p) => p.type === type);
  }

  /**
   * Clear all logic points
   */
  clear(): void {
    this.points.clear();
    logger.debug('Logic points cleared');
  }

  /**
   * Get logic point count
   */
  get size(): number {
    return this.points.size;
  }
}

/**
 * Create a logic point manager
 */
export function createLogicPointManager(): LogicPointManager {
  return new LogicPointManager();
}

/**
 * Helper to create an entry point
 */
export function createEntryPoint(
  manager: LogicPointManager,
  name: string,
  handler: LogicPointHandler,
): LogicPoint {
  return manager.create({
    name,
    type: 'entry',
    handler,
  });
}

/**
 * Helper to create an exit point
 */
export function createExitPoint(
  manager: LogicPointManager,
  name: string,
  handler: LogicPointHandler,
): LogicPoint {
  return manager.create({
    name,
    type: 'exit',
    handler,
  });
}

/**
 * Helper to create a decision point
 */
export function createDecisionPoint(
  manager: LogicPointManager,
  name: string,
  handler: LogicPointHandler,
): LogicPoint {
  return manager.create({
    name,
    type: 'decision',
    handler,
  });
}

/**
 * Helper to create a checkpoint
 */
export function createCheckpoint(
  manager: LogicPointManager,
  name: string,
  handler: LogicPointHandler,
): LogicPoint {
  return manager.create({
    name,
    type: 'checkpoint',
    handler,
  });
}
