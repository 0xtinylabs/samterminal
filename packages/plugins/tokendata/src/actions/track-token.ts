/**
 * Token tracking actions
 */

import type { Action, ActionContext, ActionResult } from '@samterminal/core';
import type { TokenDataPluginConfig, TokenDataDatabaseAdapter, ChainId } from '../types/index.js';

export interface TrackTokenInput {
  userId: string;
  address: string;
  chainId?: ChainId;
}

export function createTrackTokenAction(
  config: TokenDataPluginConfig,
  getDatabase: () => TokenDataDatabaseAdapter | undefined,
): Action {
  return {
    name: 'tokendata:track',
    description: 'Add a token to tracking for a user',

    async execute(context: ActionContext): Promise<ActionResult> {
      const input = context.input as TrackTokenInput;

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
        // Check if already tracked
        const isTracked = await database.isTokenTracked(
          input.userId,
          input.address,
          chainId,
        );

        if (isTracked) {
          return {
            success: true,
            data: { message: 'Token is already being tracked', alreadyTracked: true },
          };
        }

        // Add to tracking
        const added = await database.addTrackedToken(input.userId, input.address, chainId);

        if (!added) {
          return {
            success: false,
            error: 'Failed to add token to tracking',
          };
        }

        return {
          success: true,
          data: {
            message: 'Token added to tracking',
            address: input.address,
            chainId,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to track token',
        };
      }
    },
  };
}

export function createUntrackTokenAction(
  config: TokenDataPluginConfig,
  getDatabase: () => TokenDataDatabaseAdapter | undefined,
): Action {
  return {
    name: 'tokendata:untrack',
    description: 'Remove a token from tracking for a user',

    async execute(context: ActionContext): Promise<ActionResult> {
      const input = context.input as TrackTokenInput;

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
        const removed = await database.removeTrackedToken(
          input.userId,
          input.address,
          chainId,
        );

        if (!removed) {
          return {
            success: false,
            error: 'Token was not being tracked',
          };
        }

        return {
          success: true,
          data: {
            message: 'Token removed from tracking',
            address: input.address,
            chainId,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to untrack token',
        };
      }
    },
  };
}

export function createGetTrackedTokensAction(
  getDatabase: () => TokenDataDatabaseAdapter | undefined,
): Action {
  return {
    name: 'tokendata:tracked',
    description: 'Get all tracked tokens for a user',

    async execute(context: ActionContext): Promise<ActionResult> {
      const input = context.input as { userId: string };

      if (!input.userId) {
        return {
          success: false,
          error: 'User ID is required',
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
        const tokens = await database.getTrackedTokens(input.userId);

        return {
          success: true,
          data: { tokens },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get tracked tokens',
        };
      }
    },
  };
}
