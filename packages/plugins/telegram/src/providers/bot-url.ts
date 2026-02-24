/**
 * Bot URL Provider
 * Gets the Telegram bot URL for a user to connect
 */

import type { Provider, ProviderContext, ProviderResult } from '@samterminal/core';
import type TelegramBot from 'node-telegram-bot-api';
import type { TelegramPluginConfig, UserBotUrl, TelegramBotType } from '../types/index.js';
import { generateBotLink } from '../utils/code.js';

/**
 * Bot URL query input
 */
export interface BotUrlQuery {
  /**
   * User's connection key
   */
  userId: string;
}

/**
 * Create the bot URL provider
 */
export function createBotUrlProvider(
  getBots: () => Map<TelegramBotType, TelegramBot | null>,
  config: TelegramPluginConfig,
): Provider {
  return {
    name: 'telegram:url',
    type: 'social',
    description: 'Get Telegram bot connection URL for a user',

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
        code: { type: 'string' },
        url: { type: 'string' },
        botUsername: { type: 'string' },
      },
    },

    async get(context: ProviderContext): Promise<ProviderResult> {
      const query = context.query as BotUrlQuery;
      const bots = getBots();

      if (!config.database) {
        return {
          success: false,
          error: 'Database adapter not configured',
          timestamp: new Date(),
        };
      }

      const userBot = bots.get('user');
      if (!userBot) {
        return {
          success: false,
          error: 'User bot not configured',
          timestamp: new Date(),
        };
      }

      try {
        // Get or create user with verification code
        const user = await config.database.getOrCreateUser(query.userId);

        // Get bot username
        const botInfo = await userBot.getMe();
        const botUsername = botInfo.username ?? '';

        // Generate bot link
        const url = generateBotLink(botUsername, user.ref);

        const result: UserBotUrl = {
          code: user.verificationCode,
          url,
          botUsername,
        };

        return {
          success: true,
          data: result,
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
