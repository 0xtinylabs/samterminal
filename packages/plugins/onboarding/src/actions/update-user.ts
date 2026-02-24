/**
 * Update user action
 */

import type { Action, ActionContext, ActionResult } from '@samterminal/core';
import type {
  OnboardingPluginConfig,
  OnboardingDatabaseAdapter,
  UserProfile,
  UserStatus,
  WalletInfo,
} from '../types/index.js';
import { isValidEmail, isValidWalletAddress, isValidPhone } from '../types/index.js';

export interface UpdateUserRequest {
  /** User ID */
  userId: string;

  /** Display name */
  name?: string;

  /** Email address */
  email?: string;

  /** Phone number */
  phone?: string;

  /** User status */
  status?: UserStatus;

  /** Add wallet */
  addWallet?: {
    address: string;
    chainId?: string;
    label?: string;
    isPrimary?: boolean;
  };

  /** Remove wallet */
  removeWallet?: string;

  /** Set primary wallet */
  setPrimaryWallet?: string;

  /** Update preferences */
  preferences?: Record<string, unknown>;

  /** Update metadata */
  metadata?: Record<string, unknown>;
}

export function createUpdateUserAction(
  getDatabase: () => OnboardingDatabaseAdapter,
  config: OnboardingPluginConfig,
): Action {
  return {
    name: 'onboarding:update-user',
    description: 'Update user profile',

    async execute(context: ActionContext): Promise<ActionResult> {
      const input = context.input as UpdateUserRequest;

      if (!input.userId) {
        return {
          success: false,
          error: 'User ID is required',
        };
      }

      // Validation
      if (input.email && !isValidEmail(input.email)) {
        return {
          success: false,
          error: 'Invalid email format',
        };
      }

      if (input.addWallet && !isValidWalletAddress(input.addWallet.address)) {
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

        // Get existing user
        const existingUser = await database.getUser(input.userId);
        if (!existingUser) {
          return {
            success: false,
            error: 'User not found',
          };
        }

        // Build updates
        const updates: Partial<UserProfile> = {};

        if (input.name !== undefined) {
          updates.name = input.name;
        }

        if (input.email !== undefined) {
          // Check for duplicate email
          if (input.email) {
            const existing = await database.getUserByEmail(input.email);
            if (existing && existing.id !== input.userId) {
              return {
                success: false,
                error: 'Email already in use by another user',
              };
            }
          }
          updates.email = input.email;
        }

        if (input.phone !== undefined) {
          updates.phone = input.phone;
        }

        if (input.status !== undefined) {
          updates.status = input.status;
        }

        // Handle wallet operations
        let wallets = existingUser.wallets ? [...existingUser.wallets] : [];

        if (input.addWallet) {
          // Check for duplicate
          const existing = wallets.find(
            (w) => w.address.toLowerCase() === input.addWallet!.address.toLowerCase(),
          );
          if (existing) {
            return {
              success: false,
              error: 'Wallet already connected',
            };
          }

          const newWallet: WalletInfo = {
            address: input.addWallet.address,
            chainId: input.addWallet.chainId,
            label: input.addWallet.label,
            isPrimary: input.addWallet.isPrimary ?? wallets.length === 0,
            connectedAt: Date.now(),
          };

          // If this is primary, unset other primaries
          if (newWallet.isPrimary) {
            wallets = wallets.map((w) => ({ ...w, isPrimary: false }));
            updates.walletAddress = newWallet.address;
          }

          wallets.push(newWallet);
          updates.wallets = wallets;
        }

        if (input.removeWallet) {
          const walletToRemove = wallets.find(
            (w) => w.address.toLowerCase() === input.removeWallet!.toLowerCase(),
          );
          wallets = wallets.filter(
            (w) => w.address.toLowerCase() !== input.removeWallet!.toLowerCase(),
          );
          updates.wallets = wallets;

          // If primary was removed, set new primary
          if (walletToRemove?.isPrimary && wallets.length > 0) {
            wallets[0].isPrimary = true;
            updates.walletAddress = wallets[0].address;
          } else if (wallets.length === 0) {
            updates.walletAddress = undefined;
          }
        }

        if (input.setPrimaryWallet) {
          const wallet = wallets.find(
            (w) => w.address.toLowerCase() === input.setPrimaryWallet!.toLowerCase(),
          );
          if (!wallet) {
            return {
              success: false,
              error: 'Wallet not found',
            };
          }

          wallets = wallets.map((w) => ({
            ...w,
            isPrimary: w.address.toLowerCase() === input.setPrimaryWallet!.toLowerCase(),
          }));
          updates.wallets = wallets;
          updates.walletAddress = input.setPrimaryWallet;
        }

        if (input.preferences) {
          updates.preferences = {
            ...existingUser.preferences,
            ...input.preferences,
          } as UserProfile['preferences'];
        }

        if (input.metadata) {
          updates.metadata = {
            ...existingUser.metadata,
            ...input.metadata,
          };
        }

        updates.lastActiveAt = Date.now();

        // Update user
        const updatedUser = await database.updateUser(input.userId, updates);

        return {
          success: true,
          data: updatedUser,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to update user',
        };
      }
    },
  };
}
