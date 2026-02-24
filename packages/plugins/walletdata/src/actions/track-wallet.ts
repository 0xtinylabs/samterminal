/**
 * Wallet tracking actions
 */

import type { Action, ActionContext, ActionResult } from '@samterminal/core';
import type { ChainId } from '@samterminal/plugin-tokendata';
import type { WalletDataPluginConfig, WalletDataDatabaseAdapter } from '../types/index.js';
import { isValidEvmAddress, isEnsName } from '../utils/index.js';
import type { MoralisWalletClient } from '../utils/moralis.js';

export interface TrackWalletInput {
  userId: string;
  address: string;
  chainId?: ChainId;
  label?: string;
}

export function createTrackWalletAction(
  config: WalletDataPluginConfig,
  getDatabase: () => WalletDataDatabaseAdapter | undefined,
  getMoralis: () => MoralisWalletClient | null,
): Action {
  return {
    name: 'walletdata:track',
    description: 'Add a wallet to tracking for a user',

    async execute(context: ActionContext): Promise<ActionResult> {
      const input = context.input as TrackWalletInput;

      if (!input.userId) {
        return {
          success: false,
          error: 'User ID is required',
        };
      }

      if (!input.address) {
        return {
          success: false,
          error: 'Wallet address is required',
        };
      }

      const database = getDatabase();
      if (!database) {
        return {
          success: false,
          error: 'Database adapter not configured',
        };
      }

      let address = input.address;
      const chainId = input.chainId ?? config.defaultChain ?? 'base';

      // Resolve ENS name if needed
      if (isEnsName(address)) {
        const moralis = getMoralis();
        if (moralis) {
          try {
            const resolved = await moralis.resolveEns(address);
            if (resolved) {
              address = resolved.address;
            } else {
              return {
                success: false,
                error: 'Could not resolve ENS name',
              };
            }
          } catch (_error) {
            return {
              success: false,
              error: 'Failed to resolve ENS name',
            };
          }
        }
      }

      // Validate address format
      if (!isValidEvmAddress(address)) {
        return {
          success: false,
          error: 'Invalid wallet address format',
        };
      }

      try {
        // Check if already tracked
        const isTracked = await database.isWalletTracked(
          input.userId,
          address,
          chainId as ChainId,
        );

        if (isTracked) {
          return {
            success: true,
            data: { message: 'Wallet is already being tracked', alreadyTracked: true },
          };
        }

        // Add to tracking
        const added = await database.addTrackedWallet(
          input.userId,
          address.toLowerCase(),
          chainId as ChainId,
        );

        if (!added) {
          return {
            success: false,
            error: 'Failed to add wallet to tracking',
          };
        }

        // Set label if provided
        if (input.label) {
          await database.setWalletLabel(address.toLowerCase(), input.label);
        }

        return {
          success: true,
          data: {
            message: 'Wallet added to tracking',
            address: address.toLowerCase(),
            chainId,
            label: input.label,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to track wallet',
        };
      }
    },
  };
}

export function createUntrackWalletAction(
  config: WalletDataPluginConfig,
  getDatabase: () => WalletDataDatabaseAdapter | undefined,
): Action {
  return {
    name: 'walletdata:untrack',
    description: 'Remove a wallet from tracking for a user',

    async execute(context: ActionContext): Promise<ActionResult> {
      const input = context.input as TrackWalletInput;

      if (!input.userId) {
        return {
          success: false,
          error: 'User ID is required',
        };
      }

      if (!input.address) {
        return {
          success: false,
          error: 'Wallet address is required',
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
        const removed = await database.removeTrackedWallet(
          input.userId,
          input.address.toLowerCase(),
          chainId as ChainId,
        );

        if (!removed) {
          return {
            success: false,
            error: 'Wallet was not being tracked',
          };
        }

        return {
          success: true,
          data: {
            message: 'Wallet removed from tracking',
            address: input.address.toLowerCase(),
            chainId,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to untrack wallet',
        };
      }
    },
  };
}

export function createGetTrackedWalletsAction(
  getDatabase: () => WalletDataDatabaseAdapter | undefined,
): Action {
  return {
    name: 'walletdata:tracked',
    description: 'Get all tracked wallets for a user',

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
        const wallets = await database.getTrackedWallets(input.userId);

        // Get labels for each wallet
        const walletsWithLabels = await Promise.all(
          wallets.map(async (w) => {
            const label = await database.getWalletLabel(w.address);
            return { ...w, label };
          }),
        );

        return {
          success: true,
          data: { wallets: walletsWithLabels },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get tracked wallets',
        };
      }
    },
  };
}

export function createSetWalletLabelAction(
  getDatabase: () => WalletDataDatabaseAdapter | undefined,
): Action {
  return {
    name: 'walletdata:label',
    description: 'Set a label/name for a wallet',

    async execute(context: ActionContext): Promise<ActionResult> {
      const input = context.input as { address: string; label: string };

      if (!input.address) {
        return {
          success: false,
          error: 'Wallet address is required',
        };
      }

      if (!input.label) {
        return {
          success: false,
          error: 'Label is required',
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
        await database.setWalletLabel(input.address.toLowerCase(), input.label);

        return {
          success: true,
          data: {
            message: 'Wallet label updated',
            address: input.address.toLowerCase(),
            label: input.label,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to set wallet label',
        };
      }
    },
  };
}
