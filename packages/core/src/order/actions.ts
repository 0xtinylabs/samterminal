/**
 * Order Actions for AI Chat Integration
 *
 * These actions allow AI chat agents to create and manage orders.
 */

import type { Action, ActionSchema } from '../interfaces/action.interface.js';
import type { ActionContext, ActionResult } from '../types/index.js';
import type { OrderTemplates, OrderListOptions } from './order-templates.js';
import type { OrderTemplateType, ConditionGroup } from './types.js';

/**
 * Order create input
 */
interface OrderCreateInput {
  type: OrderTemplateType;
  params: Record<string, unknown>;
}

/**
 * Order list input
 */
interface OrderListInput {
  status?: string | string[];
  type?: string | string[];
  token?: string;
  limit?: number;
}

/**
 * Create order:create action
 */
export function createOrderCreateAction(
  getTemplates: () => OrderTemplates | null,
): Action {
  const inputSchema: ActionSchema = {
    type: 'object',
    properties: {
      type: {
        type: 'string',
        description: 'Order template type',
        enum: [
          'stop-loss',
          'take-profit',
          'conditional-sell',
          'conditional-buy',
          'dca',
          'twap',
          'trailing-stop',
          'dual-protection',
          'smart-entry',
          'whale-copy',
        ],
      },
      params: {
        type: 'object',
        description: 'Order parameters (varies by type)',
      },
    },
    required: ['type', 'params'],
  };

  return {
    name: 'order:create',
    description: 'Create a new trading order from template',
    category: 'trading',
    mutates: true,
    requiresConfirmation: true,
    inputSchema,
    tags: ['order', 'trading', 'automation'],

    async execute(context: ActionContext): Promise<ActionResult> {
      const templates = getTemplates();
      if (!templates) {
        return {
          success: false,
          error: 'OrderTemplates not initialized',
        };
      }

      const input = context.input as OrderCreateInput;

      if (!input.type) {
        return {
          success: false,
          error: 'Order type is required',
        };
      }

      if (!input.params) {
        return {
          success: false,
          error: 'Order params are required',
        };
      }

      try {
        const result = await templates.create(input.type, input.params as never);

        return {
          success: true,
          data: {
            orderId: result.order.id,
            flowId: result.flow.id,
            type: result.order.type,
            status: result.order.status,
            createdAt: result.order.createdAt.toISOString(),
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to create order',
        };
      }
    },
  };
}

/**
 * Create order:list action
 */
export function createOrderListAction(
  getTemplates: () => OrderTemplates | null,
): Action {
  const inputSchema: ActionSchema = {
    type: 'object',
    properties: {
      status: {
        type: 'string',
        description: 'Filter by status (active, paused, completed, failed, cancelled)',
      },
      type: {
        type: 'string',
        description: 'Filter by order type',
      },
      token: {
        type: 'string',
        description: 'Filter by token',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of orders to return',
      },
    },
  };

  return {
    name: 'order:list',
    description: 'List trading orders with optional filters',
    category: 'trading',
    mutates: false,
    inputSchema,
    tags: ['order', 'trading', 'query'],

    async execute(context: ActionContext): Promise<ActionResult> {
      const templates = getTemplates();
      if (!templates) {
        return {
          success: false,
          error: 'OrderTemplates not initialized',
        };
      }

      const input = (context.input || {}) as OrderListInput;

      try {
        const options: OrderListOptions = {};

        if (input.status) {
          options.status = input.status as never;
        }
        if (input.type) {
          options.type = input.type as never;
        }
        if (input.token) {
          options.token = input.token;
        }
        if (input.limit) {
          options.limit = input.limit;
        }

        const orders = templates.list(options);

        return {
          success: true,
          data: {
            orders: orders.map((o) => ({
              id: o.id,
              type: o.type,
              status: o.status,
              createdAt: o.createdAt.toISOString(),
              updatedAt: o.updatedAt.toISOString(),
              triggeredAt: o.triggeredAt?.toISOString(),
              completedAt: o.completedAt?.toISOString(),
            })),
            total: orders.length,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to list orders',
        };
      }
    },
  };
}

/**
 * Create order:get action
 */
export function createOrderGetAction(
  getTemplates: () => OrderTemplates | null,
): Action {
  const inputSchema: ActionSchema = {
    type: 'object',
    properties: {
      orderId: {
        type: 'string',
        description: 'Order ID to retrieve',
      },
    },
    required: ['orderId'],
  };

  return {
    name: 'order:get',
    description: 'Get details of a specific order',
    category: 'trading',
    mutates: false,
    inputSchema,
    tags: ['order', 'trading', 'query'],

    async execute(context: ActionContext): Promise<ActionResult> {
      const templates = getTemplates();
      if (!templates) {
        return {
          success: false,
          error: 'OrderTemplates not initialized',
        };
      }

      const input = context.input as { orderId: string };

      if (!input.orderId) {
        return {
          success: false,
          error: 'Order ID is required',
        };
      }

      try {
        const order = templates.get(input.orderId);

        if (!order) {
          return {
            success: false,
            error: `Order not found: ${input.orderId}`,
          };
        }

        return {
          success: true,
          data: {
            id: order.id,
            type: order.type,
            status: order.status,
            params: order.params,
            flowId: order.flowId,
            createdAt: order.createdAt.toISOString(),
            updatedAt: order.updatedAt.toISOString(),
            triggeredAt: order.triggeredAt?.toISOString(),
            completedAt: order.completedAt?.toISOString(),
            error: order.error,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get order',
        };
      }
    },
  };
}

/**
 * Create order:cancel action
 */
export function createOrderCancelAction(
  getTemplates: () => OrderTemplates | null,
): Action {
  const inputSchema: ActionSchema = {
    type: 'object',
    properties: {
      orderId: {
        type: 'string',
        description: 'Order ID to cancel',
      },
    },
    required: ['orderId'],
  };

  return {
    name: 'order:cancel',
    description: 'Cancel an active order',
    category: 'trading',
    mutates: true,
    requiresConfirmation: true,
    inputSchema,
    tags: ['order', 'trading', 'management'],

    async execute(context: ActionContext): Promise<ActionResult> {
      const templates = getTemplates();
      if (!templates) {
        return {
          success: false,
          error: 'OrderTemplates not initialized',
        };
      }

      const input = context.input as { orderId: string };

      if (!input.orderId) {
        return {
          success: false,
          error: 'Order ID is required',
        };
      }

      try {
        const success = await templates.cancel(input.orderId);

        if (!success) {
          return {
            success: false,
            error: `Failed to cancel order: ${input.orderId}`,
          };
        }

        return {
          success: true,
          data: {
            orderId: input.orderId,
            status: 'cancelled',
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to cancel order',
        };
      }
    },
  };
}

/**
 * Create order:pause action
 */
export function createOrderPauseAction(
  getTemplates: () => OrderTemplates | null,
): Action {
  const inputSchema: ActionSchema = {
    type: 'object',
    properties: {
      orderId: {
        type: 'string',
        description: 'Order ID to pause',
      },
    },
    required: ['orderId'],
  };

  return {
    name: 'order:pause',
    description: 'Pause an active order',
    category: 'trading',
    mutates: true,
    inputSchema,
    tags: ['order', 'trading', 'management'],

    async execute(context: ActionContext): Promise<ActionResult> {
      const templates = getTemplates();
      if (!templates) {
        return {
          success: false,
          error: 'OrderTemplates not initialized',
        };
      }

      const input = context.input as { orderId: string };

      if (!input.orderId) {
        return {
          success: false,
          error: 'Order ID is required',
        };
      }

      try {
        const success = await templates.pause(input.orderId);

        if (!success) {
          return {
            success: false,
            error: `Failed to pause order: ${input.orderId}`,
          };
        }

        return {
          success: true,
          data: {
            orderId: input.orderId,
            status: 'paused',
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to pause order',
        };
      }
    },
  };
}

/**
 * Create order:resume action
 */
export function createOrderResumeAction(
  getTemplates: () => OrderTemplates | null,
): Action {
  const inputSchema: ActionSchema = {
    type: 'object',
    properties: {
      orderId: {
        type: 'string',
        description: 'Order ID to resume',
      },
    },
    required: ['orderId'],
  };

  return {
    name: 'order:resume',
    description: 'Resume a paused order',
    category: 'trading',
    mutates: true,
    inputSchema,
    tags: ['order', 'trading', 'management'],

    async execute(context: ActionContext): Promise<ActionResult> {
      const templates = getTemplates();
      if (!templates) {
        return {
          success: false,
          error: 'OrderTemplates not initialized',
        };
      }

      const input = context.input as { orderId: string };

      if (!input.orderId) {
        return {
          success: false,
          error: 'Order ID is required',
        };
      }

      try {
        const success = await templates.activate(input.orderId);

        if (!success) {
          return {
            success: false,
            error: `Failed to resume order: ${input.orderId}`,
          };
        }

        return {
          success: true,
          data: {
            orderId: input.orderId,
            status: 'active',
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to resume order',
        };
      }
    },
  };
}

/**
 * Create order:stats action
 */
export function createOrderStatsAction(
  getTemplates: () => OrderTemplates | null,
): Action {
  return {
    name: 'order:stats',
    description: 'Get order statistics',
    category: 'trading',
    mutates: false,
    tags: ['order', 'trading', 'analytics'],

    async execute(): Promise<ActionResult> {
      const templates = getTemplates();
      if (!templates) {
        return {
          success: false,
          error: 'OrderTemplates not initialized',
        };
      }

      try {
        const stats = templates.getStats();

        return {
          success: true,
          data: stats,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get stats',
        };
      }
    },
  };
}

/**
 * Get all order actions
 */
export function getOrderActions(
  getTemplates: () => OrderTemplates | null,
): Action[] {
  return [
    createOrderCreateAction(getTemplates),
    createOrderListAction(getTemplates),
    createOrderGetAction(getTemplates),
    createOrderCancelAction(getTemplates),
    createOrderPauseAction(getTemplates),
    createOrderResumeAction(getTemplates),
    createOrderStatsAction(getTemplates),
  ];
}
