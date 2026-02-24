/**
 * Price alert actions
 */

import type { Action, ActionContext, ActionResult } from '@samterminal/core';
import type { TokenDataPluginConfig, TokenDataDatabaseAdapter, ChainId } from '../types/index.js';

export interface AddPriceAlertInput {
  userId: string;
  address: string;
  chainId?: ChainId;
  type: 'above' | 'below';
  targetPrice: number;
}

export interface RemovePriceAlertInput {
  alertId: string;
}

export interface GetPriceAlertsInput {
  userId: string;
  address: string;
  chainId?: ChainId;
}

export function createAddPriceAlertAction(
  config: TokenDataPluginConfig,
  getDatabase: () => TokenDataDatabaseAdapter | undefined,
): Action {
  return {
    name: 'tokendata:alert:add',
    description: 'Add a price alert for a token',

    async execute(context: ActionContext): Promise<ActionResult> {
      const input = context.input as AddPriceAlertInput;

      if (!input.userId) {
        return {
          success: false,
          error: 'User ID is required',
        };
      }

      if (!input.address) {
        return {
          success: false,
          error: 'Token address is required',
        };
      }

      if (!input.type || !['above', 'below'].includes(input.type)) {
        return {
          success: false,
          error: 'Alert type must be "above" or "below"',
        };
      }

      if (typeof input.targetPrice !== 'number' || input.targetPrice <= 0) {
        return {
          success: false,
          error: 'Target price must be a positive number',
        };
      }

      const database = getDatabase();
      if (!database) {
        return {
          success: false,
          error: 'Database adapter not configured',
        };
      }

      const chainId = input.chainId ?? config.defaultChain ?? 'base';

      try {
        const alertId = await database.addPriceAlert(
          input.userId,
          input.address,
          chainId,
          input.type,
          input.targetPrice,
        );

        return {
          success: true,
          data: {
            alertId,
            message: `Price alert created: notify when price goes ${input.type} $${input.targetPrice}`,
            address: input.address,
            chainId,
            type: input.type,
            targetPrice: input.targetPrice,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to create price alert',
        };
      }
    },
  };
}

export function createRemovePriceAlertAction(
  getDatabase: () => TokenDataDatabaseAdapter | undefined,
): Action {
  return {
    name: 'tokendata:alert:remove',
    description: 'Remove a price alert',

    async execute(context: ActionContext): Promise<ActionResult> {
      const input = context.input as RemovePriceAlertInput;

      if (!input.alertId) {
        return {
          success: false,
          error: 'Alert ID is required',
        };
      }

      const database = getDatabase();
      if (!database) {
        return {
          success: false,
          error: 'Database adapter not configured',
        };
      }

      try {
        const removed = await database.removePriceAlert(input.alertId);

        if (!removed) {
          return {
            success: false,
            error: 'Alert not found',
          };
        }

        return {
          success: true,
          data: {
            message: 'Price alert removed',
            alertId: input.alertId,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to remove price alert',
        };
      }
    },
  };
}

export function createGetPriceAlertsAction(
  config: TokenDataPluginConfig,
  getDatabase: () => TokenDataDatabaseAdapter | undefined,
): Action {
  return {
    name: 'tokendata:alert:list',
    description: 'Get all price alerts for a token',

    async execute(context: ActionContext): Promise<ActionResult> {
      const input = context.input as GetPriceAlertsInput;

      if (!input.userId) {
        return {
          success: false,
          error: 'User ID is required',
        };
      }

      if (!input.address) {
        return {
          success: false,
          error: 'Token address is required',
        };
      }

      const database = getDatabase();
      if (!database) {
        return {
          success: false,
          error: 'Database adapter not configured',
        };
      }

      const chainId = input.chainId ?? config.defaultChain ?? 'base';

      try {
        const alerts = await database.getPriceAlerts(input.userId, input.address, chainId);

        return {
          success: true,
          data: { alerts },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get price alerts',
        };
      }
    },
  };
}
