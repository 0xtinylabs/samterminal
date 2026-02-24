/**
 * User profile provider
 */

import type { Provider, ProviderContext, ProviderResult } from '@samterminal/core';
import type { OnboardingPluginConfig, OnboardingDatabaseAdapter } from '../types/index.js';

export interface UserQuery {
  /** User ID */
  userId?: string;

  /** Telegram ID */
  telegramId?: string;

  /** Wallet address */
  walletAddress?: string;

  /** Email address */
  email?: string;
}

export function createUserProvider(
  getDatabase: () => OnboardingDatabaseAdapter,
  config: OnboardingPluginConfig,
): Provider {
  return {
    name: 'onboarding:user',
    type: 'token',
    description: 'Get user profile',

    async get(context: ProviderContext): Promise<ProviderResult> {
      const query = context.query as UserQuery;

      if (!query.userId && !query.telegramId && !query.walletAddress && !query.email) {
        return {
          success: false,
          error: 'User ID, Telegram ID, wallet address, or email is required',
          timestamp: new Date(),
        };
      }

      try {
        const database = getDatabase();
        let user = null;

        if (query.userId) {
          user = await database.getUser(query.userId);
        } else if (query.telegramId) {
          user = await database.getUserByTelegramId(query.telegramId);
        } else if (query.walletAddress) {
          user = await database.getUserByWallet(query.walletAddress);
        } else if (query.email) {
          user = await database.getUserByEmail(query.email);
        }

        if (!user) {
          return {
            success: false,
            error: 'User not found',
            timestamp: new Date(),
          };
        }

        return {
          success: true,
          data: user,
          timestamp: new Date(),
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get user',
          timestamp: new Date(),
        };
      }
    },
  };
}
