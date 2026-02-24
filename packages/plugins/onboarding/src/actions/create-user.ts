/**
 * Create user action
 */

import type { Action, ActionContext, ActionResult } from '@samterminal/core';
import type {
  OnboardingPluginConfig,
  OnboardingDatabaseAdapter,
  UserProfile,
} from '../types/index.js';
import { isValidEmail, isValidWalletAddress, isValidPhone } from '../types/index.js';

export interface CreateUserRequest {
  /** Display name */
  name?: string;

  /** Email address */
  email?: string;

  /** Phone number */
  phone?: string;

  /** Telegram user ID */
  telegramId?: string;

  /** Telegram username */
  telegramUsername?: string;

  /** Wallet address */
  walletAddress?: string;

  /** Initial preferences */
  preferences?: Record<string, unknown>;

  /** Custom metadata */
  metadata?: Record<string, unknown>;
}

export function createCreateUserAction(
  getDatabase: () => OnboardingDatabaseAdapter,
  config: OnboardingPluginConfig,
): Action {
  return {
    name: 'onboarding:create-user',
    description: 'Create a new user profile',

    async execute(context: ActionContext): Promise<ActionResult> {
      const input = context.input as CreateUserRequest;

      // Validation
      if (input.email && !isValidEmail(input.email)) {
        return {
          success: false,
          error: 'Invalid email format',
        };
      }

      if (input.walletAddress && !isValidWalletAddress(input.walletAddress)) {
        return {
          success: false,
          error: 'Invalid wallet address format',
        };
      }

      if (input.phone && !isValidPhone(input.phone)) {
        return {
          success: false,
          error: 'Invalid phone number format',
        };
      }

      try {
        const database = getDatabase();

        // Check for duplicates
        if (input.telegramId) {
          const existing = await database.getUserByTelegramId(input.telegramId);
          if (existing) {
            return {
              success: false,
              error: 'User with this Telegram ID already exists',
              data: { existingUserId: existing.id },
            };
          }
        }

        if (input.walletAddress) {
          const existing = await database.getUserByWallet(input.walletAddress);
          if (existing) {
            return {
              success: false,
              error: 'User with this wallet address already exists',
              data: { existingUserId: existing.id },
            };
          }
        }

        if (input.email) {
          const existing = await database.getUserByEmail(input.email);
          if (existing) {
            return {
              success: false,
              error: 'User with this email already exists',
              data: { existingUserId: existing.id },
            };
          }
        }

        // Create user
        const user = await database.createUser({
          name: input.name,
          email: input.email,
          phone: input.phone,
          telegramId: input.telegramId,
          telegramUsername: input.telegramUsername,
          walletAddress: input.walletAddress,
          wallets: input.walletAddress
            ? [
                {
                  address: input.walletAddress,
                  isPrimary: true,
                  connectedAt: Date.now(),
                },
              ]
            : undefined,
          status: config.autoStart ? 'onboarding' : 'new',
          preferences: input.preferences as UserProfile['preferences'],
          metadata: input.metadata,
        });

        return {
          success: true,
          data: user,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to create user',
        };
      }
    },
  };
}
