/**
 * samterminal order commands
 *
 * CLI commands for managing trading orders
 */

import chalk from 'chalk';
import ora from 'ora';
import type { CommandResult } from '../types.js';
import { logger, getCLIContext } from '../utils/index.js';

/**
 * Order template types
 */
const ORDER_TYPES = [
  'stop-loss',
  'take-profit',
  'conditional-sell',
  'conditional-buy',
  'dca',
  'twap',
  'trailing-stop',
  'dual-protection',
  'smart-entry',
] as const;

type OrderType = (typeof ORDER_TYPES)[number];

/**
 * Order create options
 */
export interface OrderCreateOptions {
  token?: string;
  triggerPrice?: string;
  sellPercent?: string;
  buyToken?: string;
  sellToken?: string;
  amount?: string;
  interval?: string;
  condition?: string[];
  notify?: string[];
  trailPercent?: string;
  stopPrice?: string;
  targetPrice?: string;
}

/**
 * Order list options
 */
export interface OrderListOptions {
  status?: string;
  type?: string;
  token?: string;
  limit?: string;
}

/**
 * Parse condition strings into condition objects
 * Format: "field operator value" or "OR field operator value"
 */
function parseConditions(
  conditions: string[],
): { operator: 'AND' | 'OR'; conditions: Array<{ field: string; operator: string; value: number }> } {
  const result: Array<{ field: string; operator: string; value: number; logical?: 'OR' }> = [];

  for (const cond of conditions) {
    const parts = cond.trim().split(/\s+/);

    let logical: 'OR' | undefined;
    let startIdx = 0;

    if (parts[0]?.toUpperCase() === 'OR') {
      logical = 'OR';
      startIdx = 1;
    }

    const field = parts[startIdx];
    const operator = parts[startIdx + 1];
    const value = parseFloat(parts[startIdx + 2]);

    if (field && operator && !isNaN(value)) {
      result.push({ field, operator, value, logical });
    }
  }

  // Determine overall operator
  const hasOr = result.some((r) => r.logical === 'OR');

  return {
    operator: hasOr ? 'OR' : 'AND',
    conditions: result.map(({ field, operator, value }) => ({ field, operator, value })),
  };
}

/**
 * Create a new order
 */
export async function orderCreate(
  type: string,
  options: OrderCreateOptions,
): Promise<CommandResult> {
  try {
    const context = await getCLIContext();

    if (!context.isProject) {
      logger.error('Not in a SamTerminal project directory');
      return {
        success: false,
        error: new Error('Not in a SamTerminal project'),
      };
    }

    // Validate order type
    if (!ORDER_TYPES.includes(type as OrderType)) {
      logger.error(`Invalid order type: ${type}`);
      logger.info(`Valid types: ${ORDER_TYPES.join(', ')}`);
      return {
        success: false,
        error: new Error(`Invalid order type: ${type}`),
      };
    }

    console.log();
    logger.info(`Creating ${chalk.bold(type)} order`);

    const spinner = ora('Creating order...').start();

    try {
      // Build order params based on type
      const params = buildOrderParams(type as OrderType, options);

      if (!params) {
        spinner.fail('Invalid order parameters');
        return {
          success: false,
          error: new Error('Invalid order parameters'),
        };
      }

      // Here we would call the core OrderTemplates
      // For now, just simulate the creation
      const orderId = `order-${Date.now()}`;

      spinner.succeed('Order created');

      console.log();
      console.log(chalk.bold('Order Details'));
      console.log(`  ID: ${chalk.cyan(orderId)}`);
      console.log(`  Type: ${chalk.yellow(type)}`);
      console.log(`  Status: ${chalk.green('active')}`);

      if (options.token) {
        console.log(`  Token: ${options.token}`);
      }

      if (options.triggerPrice) {
        console.log(`  Trigger Price: $${options.triggerPrice}`);
      }

      if (options.sellPercent) {
        console.log(`  Sell Percent: ${options.sellPercent}%`);
      }

      if (options.condition?.length) {
        console.log(`  Conditions: ${options.condition.length} condition(s)`);
      }

      console.log();

      return {
        success: true,
        message: `Order ${orderId} created`,
        data: { orderId, type, params },
      };
    } catch (err) {
      spinner.fail('Failed to create order');
      throw err;
    }
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error(error.message);
    return { success: false, error };
  }
}

/**
 * Build order params based on type
 */
function buildOrderParams(
  type: OrderType,
  options: OrderCreateOptions,
): Record<string, unknown> | null {
  switch (type) {
    case 'stop-loss':
      if (!options.token || !options.triggerPrice) {
        logger.error('stop-loss requires --token and --trigger-price');
        return null;
      }
      return {
        token: options.token,
        triggerPrice: parseFloat(options.triggerPrice),
        sellPercent: options.sellPercent ? parseInt(options.sellPercent) : 100,
        notifyChannels: options.notify,
      };

    case 'take-profit':
      if (!options.token || !options.triggerPrice) {
        logger.error('take-profit requires --token and --trigger-price');
        return null;
      }
      return {
        token: options.token,
        triggerPrice: parseFloat(options.triggerPrice),
        sellPercent: options.sellPercent ? parseInt(options.sellPercent) : 100,
        notifyChannels: options.notify,
      };

    case 'conditional-sell':
      if (!options.token || !options.condition?.length) {
        logger.error('conditional-sell requires --token and at least one --condition');
        return null;
      }
      return {
        token: options.token,
        conditions: parseConditions(options.condition),
        sellPercent: options.sellPercent ? parseInt(options.sellPercent) : 100,
        notifyChannels: options.notify,
      };

    case 'conditional-buy':
      if (!options.buyToken || !options.sellToken || !options.condition?.length) {
        logger.error('conditional-buy requires --buy-token, --sell-token, and --condition');
        return null;
      }
      return {
        buyToken: options.buyToken,
        sellToken: options.sellToken,
        conditions: parseConditions(options.condition),
        spendAmount: options.amount ? parseFloat(options.amount) : undefined,
        notifyChannels: options.notify,
      };

    case 'dca':
      if (!options.buyToken || !options.sellToken || !options.amount || !options.interval) {
        logger.error('dca requires --buy-token, --sell-token, --amount, and --interval');
        return null;
      }
      return {
        token: options.buyToken,
        buyToken: options.buyToken,
        sellToken: options.sellToken,
        amountPerExecution: parseFloat(options.amount),
        interval: options.interval,
        conditions: options.condition?.length ? parseConditions(options.condition) : undefined,
        notifyChannels: options.notify,
      };

    case 'twap':
      if (!options.sellToken || !options.buyToken || !options.amount) {
        logger.error('twap requires --sell-token, --buy-token, and --amount');
        return null;
      }
      return {
        sellToken: options.sellToken,
        buyToken: options.buyToken,
        totalAmount: parseFloat(options.amount),
        notifyChannels: options.notify,
      };

    case 'trailing-stop':
      if (!options.token || !options.trailPercent) {
        logger.error('trailing-stop requires --token and --trail-percent');
        return null;
      }
      return {
        token: options.token,
        trailPercent: parseFloat(options.trailPercent),
        sellPercent: options.sellPercent ? parseInt(options.sellPercent) : 100,
        notifyChannels: options.notify,
      };

    case 'dual-protection':
      if (!options.token || !options.stopPrice || !options.targetPrice) {
        logger.error('dual-protection requires --token, --stop-price, and --target-price');
        return null;
      }
      return {
        token: options.token,
        stopLoss: {
          conditions: {
            operator: 'AND',
            conditions: [{ field: 'price', operator: 'lt', value: parseFloat(options.stopPrice) }],
          },
          sellPercent: 100,
        },
        takeProfit: {
          conditions: {
            operator: 'AND',
            conditions: [{ field: 'price', operator: 'gt', value: parseFloat(options.targetPrice) }],
          },
          sellPercent: options.sellPercent ? parseInt(options.sellPercent) : 50,
        },
        notifyChannels: options.notify,
      };

    case 'smart-entry':
      if (!options.buyToken || !options.sellToken || !options.condition?.length) {
        logger.error('smart-entry requires --buy-token, --sell-token, and --condition');
        return null;
      }
      return {
        token: options.buyToken,
        buyToken: options.buyToken,
        sellToken: options.sellToken,
        conditions: parseConditions(options.condition),
        spendAmount: options.amount ? parseFloat(options.amount) : 100,
        notifyChannels: options.notify,
      };

    default:
      return null;
  }
}

/**
 * List orders
 */
export async function orderList(options: OrderListOptions = {}): Promise<CommandResult> {
  try {
    const context = await getCLIContext();

    if (!context.isProject) {
      logger.error('Not in a SamTerminal project directory');
      return {
        success: false,
        error: new Error('Not in a SamTerminal project'),
      };
    }

    console.log();
    console.log(chalk.bold.cyan('Orders'));
    console.log();

    // For now, show a placeholder message
    // In real implementation, this would load orders from the core
    console.log(chalk.gray('  No active orders'));
    console.log();
    console.log(`  Run ${chalk.cyan('sam order create <type>')} to create an order`);
    console.log();

    // Show available order types
    console.log(chalk.bold('Available Order Types'));
    console.log();

    const typeDescriptions: Record<OrderType, string> = {
      'stop-loss': 'Sell when price drops below trigger',
      'take-profit': 'Sell when price rises above trigger',
      'conditional-sell': 'Sell when custom conditions are met',
      'conditional-buy': 'Buy when custom conditions are met',
      'dca': 'Dollar-cost averaging with optional conditions',
      'twap': 'Time-weighted average price execution',
      'trailing-stop': 'Dynamic stop-loss that follows price up',
      'dual-protection': 'Combined stop-loss and take-profit',
      'smart-entry': 'Buy when multiple conditions align',
    };

    for (const [orderType, desc] of Object.entries(typeDescriptions)) {
      console.log(`  ${chalk.bold(orderType)} - ${desc}`);
    }

    console.log();

    return {
      success: true,
      data: { orders: [] },
    };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error(error.message);
    return { success: false, error };
  }
}

/**
 * Cancel an order
 */
export async function orderCancel(orderId: string): Promise<CommandResult> {
  try {
    const context = await getCLIContext();

    if (!context.isProject) {
      logger.error('Not in a SamTerminal project directory');
      return {
        success: false,
        error: new Error('Not in a SamTerminal project'),
      };
    }

    console.log();
    logger.info(`Cancelling order: ${chalk.bold(orderId)}`);

    const spinner = ora('Cancelling order...').start();

    // In real implementation, this would call core.orderTemplates.cancel()
    spinner.succeed('Order cancelled');

    console.log();

    return {
      success: true,
      message: `Order ${orderId} cancelled`,
    };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error(error.message);
    return { success: false, error };
  }
}

/**
 * Pause an order
 */
export async function orderPause(orderId: string): Promise<CommandResult> {
  try {
    const context = await getCLIContext();

    if (!context.isProject) {
      logger.error('Not in a SamTerminal project directory');
      return {
        success: false,
        error: new Error('Not in a SamTerminal project'),
      };
    }

    console.log();
    logger.info(`Pausing order: ${chalk.bold(orderId)}`);

    const spinner = ora('Pausing order...').start();

    // In real implementation, this would call core.orderTemplates.pause()
    spinner.succeed('Order paused');

    console.log();

    return {
      success: true,
      message: `Order ${orderId} paused`,
    };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error(error.message);
    return { success: false, error };
  }
}

/**
 * Resume an order
 */
export async function orderResume(orderId: string): Promise<CommandResult> {
  try {
    const context = await getCLIContext();

    if (!context.isProject) {
      logger.error('Not in a SamTerminal project directory');
      return {
        success: false,
        error: new Error('Not in a SamTerminal project'),
      };
    }

    console.log();
    logger.info(`Resuming order: ${chalk.bold(orderId)}`);

    const spinner = ora('Resuming order...').start();

    // In real implementation, this would call core.orderTemplates.activate()
    spinner.succeed('Order resumed');

    console.log();

    return {
      success: true,
      message: `Order ${orderId} resumed`,
    };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error(error.message);
    return { success: false, error };
  }
}

/**
 * Get order details
 */
export async function orderGet(orderId: string): Promise<CommandResult> {
  try {
    const context = await getCLIContext();

    if (!context.isProject) {
      logger.error('Not in a SamTerminal project directory');
      return {
        success: false,
        error: new Error('Not in a SamTerminal project'),
      };
    }

    console.log();
    logger.info(`Getting order: ${chalk.bold(orderId)}`);

    // In real implementation, this would call core.orderTemplates.get()
    console.log();
    console.log(chalk.gray(`  Order ${orderId} not found`));
    console.log();

    return {
      success: true,
      data: { order: null },
    };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error(error.message);
    return { success: false, error };
  }
}
