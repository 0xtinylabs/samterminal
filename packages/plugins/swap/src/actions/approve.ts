/**
 * Token approval action
 */

import type { Action, ActionContext, ActionResult } from '@samterminal/core';
import type { ChainId } from '@samterminal/plugin-tokendata';
import type { SwapPluginConfig, ApprovalRequest, ApprovalResult } from '../types/index.js';
import { isNativeToken } from '../types/index.js';
import { PERMIT2_ADDRESS } from '../constants/chains.js';
import type { WalletManager } from '../utils/wallet.js';
import { isValidPrivateKey, ensurePrivateKeyPrefix } from '../utils/index.js';
import { maxUint256 } from 'viem';

export function createApproveAction(
  getWallet: () => WalletManager,
  config: SwapPluginConfig,
): Action {
  return {
    name: 'swap:approve',
    description: 'Approve token spending for swap (Permit2)',

    async execute(context: ActionContext): Promise<ActionResult> {
      const input = context.input as ApprovalRequest;

      if (!input.token) {
        return {
          success: false,
          error: 'Token address is required',
        };
      }

      const privateKey = input.privateKey ?? config.defaultPrivateKey;
      if (!privateKey) {
        return {
          success: false,
          error: 'Private key required. Set WALLET_PRIVATE_KEY env or provide in request.',
        };
      }

      if (!isValidPrivateKey(privateKey)) {
        return {
          success: false,
          error: 'Invalid private key format',
        };
      }

      // Native tokens don't need approval
      if (isNativeToken(input.token)) {
        return {
          success: true,
          data: {
            success: true,
            message: 'Native tokens do not require approval',
          } as ApprovalResult,
        };
      }

      const chainId = input.chainId ?? config.defaultChain ?? 'base';
      const spender = input.spender ?? PERMIT2_ADDRESS;
      const resolvedPrivateKey = ensurePrivateKeyPrefix(privateKey);

      try {
        const wallet = getWallet();

        // Check current allowance
        const account = wallet.getAccount(resolvedPrivateKey);
        const currentAllowance = await wallet.getTokenAllowance(
          input.token,
          account.address,
          spender,
          chainId as ChainId,
        );

        // If already approved for unlimited, skip
        if (currentAllowance >= maxUint256 / BigInt(2)) {
          return {
            success: true,
            data: {
              success: true,
              message: 'Token already approved',
            } as ApprovalResult,
          };
        }

        // Approve unlimited
        const txHash = await wallet.approveToken(
          input.token,
          spender,
          'unlimited',
          resolvedPrivateKey,
          chainId as ChainId,
        );

        return {
          success: true,
          data: {
            success: true,
            txHash,
          } as ApprovalResult,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to approve token',
        };
      }
    },
  };
}
