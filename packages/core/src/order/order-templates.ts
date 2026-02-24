/**
 * Order Templates
 *
 * Main interface for creating and managing order templates.
 * Provides high-level API for stop-loss, take-profit, DCA, and other trading strategies.
 */

import type { SamTerminalCore } from '../interfaces/core.interface.js';
import type { Flow } from '../types/flow.js';
import type {
  Order,
  OrderStatus,
  OrderTemplateType,
  OrderParams,
  ConditionalSellParams,
  ConditionalBuyParams,
  StopLossParams,
  TakeProfitParams,
  SmartEntryParams,
  DCAParams,
  TWAPParams,
  TrailingStopParams,
  DualProtectionParams,
  WhaleCopyParams,
  ConditionGroup,
} from './types.js';
import { FlowGenerator, type FlowGeneratorConfig } from './flow-generator.js';
import { ConditionEvaluator, type ConditionEvaluatorConfig } from './condition-evaluator.js';
import { uuid } from '../utils/id.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger({ prefix: 'OrderTemplates' });

/**
 * Order Templates configuration
 */
export interface OrderTemplatesConfig {
  /** Flow generator config */
  flowGenerator?: FlowGeneratorConfig;
  /** Condition evaluator config */
  conditionEvaluator?: ConditionEvaluatorConfig;
  /** Auto-activate orders after creation (default: true) */
  autoActivate?: boolean;
}

/**
 * Order list filter options
 */
export interface OrderListOptions {
  status?: OrderStatus | OrderStatus[];
  type?: OrderTemplateType | OrderTemplateType[];
  token?: string;
  limit?: number;
  offset?: number;
}

/**
 * Order creation result
 */
export interface OrderCreationResult {
  order: Order;
  flow: Flow;
}

/**
 * Order Templates Class
 *
 * Provides a high-level API for creating and managing trading orders.
 *
 * @example
 * ```typescript
 * const templates = new OrderTemplates(runtime);
 *
 * // Create a stop-loss order
 * const { order } = await templates.create('stop-loss', {
 *   token: 'ETH',
 *   triggerPrice: 3000,
 *   sellPercent: 100
 * });
 *
 * // List active orders
 * const orders = await templates.list({ status: 'active' });
 *
 * // Cancel an order
 * await templates.cancel(order.id);
 * ```
 */
export class OrderTemplates {
  private core: SamTerminalCore | null = null;
  private orders: Map<string, Order> = new Map();
  private flowGenerator: FlowGenerator;
  private conditionEvaluator: ConditionEvaluator;
  private config: Required<OrderTemplatesConfig>;

  constructor(config: OrderTemplatesConfig = {}) {
    this.config = {
      flowGenerator: config.flowGenerator ?? {},
      conditionEvaluator: config.conditionEvaluator ?? {},
      autoActivate: config.autoActivate ?? true,
    };

    this.flowGenerator = new FlowGenerator(this.config.flowGenerator);
    this.conditionEvaluator = new ConditionEvaluator(this.config.conditionEvaluator);
  }

  /**
   * Set core reference
   */
  setCore(core: SamTerminalCore): void {
    this.core = core;
  }

  /**
   * Create a new order from template
   */
  async create<T extends OrderTemplateType>(
    type: T,
    params: OrderParamsForType<T>,
  ): Promise<OrderCreationResult> {
    const orderId = params.id ?? uuid();

    // Create order object
    const order: Order = {
      id: orderId,
      type,
      params: params as OrderParams,
      status: 'created',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Generate flow
    const flow = this.flowGenerator.generate(order);
    order.flowId = flow.id;

    // Store order
    this.orders.set(orderId, order);

    logger.info(`Order created: ${type}`, { orderId, flowId: flow.id });

    // Register flow with core if available
    if (this.core) {
      this.core.flow.create({
        name: flow.name,
        description: flow.description,
        version: flow.version,
        nodes: flow.nodes,
        edges: flow.edges,
        metadata: flow.metadata,
      });
    }

    // Auto-activate if configured
    if (this.config.autoActivate) {
      await this.activate(orderId);
    }

    return { order, flow };
  }

  /**
   * Activate an order
   */
  async activate(orderId: string): Promise<boolean> {
    const order = this.orders.get(orderId);
    if (!order) {
      logger.warn(`Order not found: ${orderId}`);
      return false;
    }

    if (order.status !== 'created' && order.status !== 'paused') {
      logger.warn(`Cannot activate order in status: ${order.status}`, { orderId });
      return false;
    }

    order.status = 'active';
    order.updatedAt = new Date();

    logger.info(`Order activated`, { orderId });
    return true;
  }

  /**
   * Pause an order
   */
  async pause(orderId: string): Promise<boolean> {
    const order = this.orders.get(orderId);
    if (!order) {
      logger.warn(`Order not found: ${orderId}`);
      return false;
    }

    if (order.status !== 'active') {
      logger.warn(`Cannot pause order in status: ${order.status}`, { orderId });
      return false;
    }

    order.status = 'paused';
    order.updatedAt = new Date();

    logger.info(`Order paused`, { orderId });
    return true;
  }

  /**
   * Cancel an order
   */
  async cancel(orderId: string): Promise<boolean> {
    const order = this.orders.get(orderId);
    if (!order) {
      logger.warn(`Order not found: ${orderId}`);
      return false;
    }

    if (order.status === 'completed' || order.status === 'cancelled') {
      logger.warn(`Cannot cancel order in status: ${order.status}`, { orderId });
      return false;
    }

    order.status = 'cancelled';
    order.updatedAt = new Date();

    // Cancel flow if core is available and flow engine supports cancel
    if (this.core && order.flowId) {
      const flowEngine = this.core.flow as { cancel?: (id: string) => boolean };
      flowEngine.cancel?.(order.flowId);
    }

    logger.info(`Order cancelled`, { orderId });
    return true;
  }

  /**
   * Get an order by ID
   */
  get(orderId: string): Order | undefined {
    return this.orders.get(orderId);
  }

  /**
   * List orders with optional filters
   */
  list(options: OrderListOptions = {}): Order[] {
    let orders = Array.from(this.orders.values());

    // Filter by status
    if (options.status) {
      const statuses = Array.isArray(options.status) ? options.status : [options.status];
      orders = orders.filter((o) => statuses.includes(o.status));
    }

    // Filter by type
    if (options.type) {
      const types = Array.isArray(options.type) ? options.type : [options.type];
      orders = orders.filter((o) => types.includes(o.type));
    }

    // Filter by token
    if (options.token) {
      orders = orders.filter((o) => {
        const params = o.params as { token?: string; buyToken?: string };
        return params.token === options.token || params.buyToken === options.token;
      });
    }

    // Sort by creation date (newest first)
    orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Apply pagination
    const offset = options.offset ?? 0;
    const limit = options.limit ?? orders.length;
    orders = orders.slice(offset, offset + limit);

    return orders;
  }

  /**
   * Update order status (internal use)
   */
  updateStatus(orderId: string, status: OrderStatus, error?: string): boolean {
    const order = this.orders.get(orderId);
    if (!order) {
      return false;
    }

    order.status = status;
    order.updatedAt = new Date();

    if (status === 'triggered') {
      order.triggeredAt = new Date();
    }

    if (status === 'completed' || status === 'failed') {
      order.completedAt = new Date();
    }

    if (error) {
      order.error = error;
    }

    return true;
  }

  /**
   * Get order statistics
   */
  getStats(): OrderStats {
    const orders = Array.from(this.orders.values());

    return {
      total: orders.length,
      active: orders.filter((o) => o.status === 'active').length,
      paused: orders.filter((o) => o.status === 'paused').length,
      completed: orders.filter((o) => o.status === 'completed').length,
      failed: orders.filter((o) => o.status === 'failed').length,
      cancelled: orders.filter((o) => o.status === 'cancelled').length,
      byType: this.countByType(orders),
    };
  }

  private countByType(orders: Order[]): Record<OrderTemplateType, number> {
    const counts: Partial<Record<OrderTemplateType, number>> = {};

    for (const order of orders) {
      counts[order.type] = (counts[order.type] ?? 0) + 1;
    }

    return counts as Record<OrderTemplateType, number>;
  }

  /**
   * Clear all orders (for testing)
   */
  clear(): void {
    this.orders.clear();
    logger.info('All orders cleared');
  }

  /**
   * Get the condition evaluator instance
   */
  getConditionEvaluator(): ConditionEvaluator {
    return this.conditionEvaluator;
  }

  /**
   * Get the flow generator instance
   */
  getFlowGenerator(): FlowGenerator {
    return this.flowGenerator;
  }
}

/**
 * Order statistics
 */
export interface OrderStats {
  total: number;
  active: number;
  paused: number;
  completed: number;
  failed: number;
  cancelled: number;
  byType: Record<OrderTemplateType, number>;
}

/**
 * Type helper for order params based on template type
 */
export type OrderParamsForType<T extends OrderTemplateType> = T extends 'conditional-sell'
  ? ConditionalSellParams
  : T extends 'conditional-buy'
    ? ConditionalBuyParams
    : T extends 'stop-loss'
      ? StopLossParams
      : T extends 'take-profit'
        ? TakeProfitParams
        : T extends 'smart-entry'
          ? SmartEntryParams
          : T extends 'dca'
            ? DCAParams
            : T extends 'twap'
              ? TWAPParams
              : T extends 'trailing-stop'
                ? TrailingStopParams
                : T extends 'dual-protection'
                  ? DualProtectionParams
                  : T extends 'whale-copy'
                    ? WhaleCopyParams
                    : never;

/**
 * Create a new OrderTemplates instance
 */
export function createOrderTemplates(config?: OrderTemplatesConfig): OrderTemplates {
  return new OrderTemplates(config);
}

// Convenience functions for common order types

/**
 * Create a stop-loss order
 */
export function createStopLoss(
  templates: OrderTemplates,
  token: string,
  triggerPrice: number,
  sellPercent: number = 100,
  options: Partial<StopLossParams> = {},
): Promise<OrderCreationResult> {
  return templates.create('stop-loss', {
    token,
    triggerPrice,
    sellPercent,
    ...options,
  });
}

/**
 * Create a take-profit order
 */
export function createTakeProfit(
  templates: OrderTemplates,
  token: string,
  triggerPrice: number,
  sellPercent: number = 100,
  options: Partial<TakeProfitParams> = {},
): Promise<OrderCreationResult> {
  return templates.create('take-profit', {
    token,
    triggerPrice,
    sellPercent,
    ...options,
  });
}

/**
 * Create a DCA order
 */
export function createDCA(
  templates: OrderTemplates,
  buyToken: string,
  sellToken: string,
  amountPerExecution: number,
  interval: DCAParams['interval'],
  options: Partial<DCAParams> = {},
): Promise<OrderCreationResult> {
  return templates.create('dca', {
    token: buyToken,
    buyToken,
    sellToken,
    amountPerExecution,
    interval,
    ...options,
  });
}

/**
 * Create a conditional sell order
 */
export function createConditionalSell(
  templates: OrderTemplates,
  token: string,
  conditions: ConditionGroup,
  sellPercent: number = 100,
  options: Partial<ConditionalSellParams> = {},
): Promise<OrderCreationResult> {
  return templates.create('conditional-sell', {
    token,
    conditions,
    sellPercent,
    ...options,
  });
}
