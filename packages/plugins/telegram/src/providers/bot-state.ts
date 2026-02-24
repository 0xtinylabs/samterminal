/**
 * Bot State Provider
 * Gets the current state of a user's Telegram bot connection
 */

import type { Provider, ProviderContext, ProviderResult } from '@samterminal/core';
import type { TelegramPluginConfig, BotState } from '../types/index.js';

/**
 * Bot state query input
 */
export interface BotStateQuery {
  /**
   * User's connection key
   */
  userId: string;
}

/**
 * Create the bot state provider
 */
export function createBotStateProvider(config: TelegramPluginConfig): Provider {
  return {
    name: 'telegram:state',
    type: 'social',
    description: 'Get Telegram bot connection state for a user',

    querySchema: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: 'User connection key' },
      },
      required: ['userId'],
    },

    responseSchema: {
      type: 'object',
      properties: {
        type: { type: 'string' },
        isActive: { type: 'boolean' },
        isVerified: { type: 'boolean' },
      },
    },

    async get(context: ProviderContext): Promise<ProviderResult> {
      const query = context.query as BotStateQuery;

      if (!config.database) {
        return {
          success: false,
          error: 'Database adapter not configured',
          timestamp: new Date(),
        };
      }

      try {
        const state = await config.database.getBotState(query.userId);

        if (!state) {
          return {
            success: true,
            data: {
              type: 'user',
              isActive: false,
              isVerified: false,
            } as BotState,
            timestamp: new Date(),
          };
        }

        return {
          success: true,
          data: state,
          timestamp: new Date(),
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        return {
          success: false,
          error: errorMessage,
          timestamp: new Date(),
        };
      }
    },
  };
}
