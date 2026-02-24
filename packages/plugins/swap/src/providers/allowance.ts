/**
 * Token allowance provider
 */

import type { Provider, ProviderContext, ProviderResult } from '@samterminal/core';
import type { ChainId } from '@samterminal/plugin-tokendata';
import type { SwapPluginConfig, TokenAllowance } from '../types/index.js';
import { isNativeToken } from '../types/index.js';
import { PERMIT2_ADDRESS } from '../constants/chains.js';
import type { WalletManager } from '../utils/wallet.js';
import { maxUint256 } from 'viem';

export interface AllowanceQuery {
  token: string;
  owner: string;
  spender?: string;
  chainId?: ChainId;
}

export function createAllowanceProvider(
  getWallet: () => WalletManager,
  config: SwapPluginConfig,
): Provider {
  return {
    name: 'swap:allowance',
    type: 'token',
    description: 'Get token allowance for swap',

    async get(context: ProviderContext): Promise<ProviderResult> {
      const query = context.query as AllowanceQuery;

      if (!query.token) {
        return {
          success: false,
          error: 'Token address is required',
          timestamp: new Date(),
        };
      }

      if (!query.owner) {
        return {
          success: false,
          error: 'Owner address is required',
          timestamp: new Date(),
        };
      }

      // Native tokens don't need allowance
      if (isNativeToken(query.token)) {
        return {
          success: true,
          data: {
            token: query.token,
            owner: query.owner,
            spender: query.spender ?? PERMIT2_ADDRESS,
            allowance: maxUint256.toString(),
            isUnlimited: true,
          } as TokenAllowance,
          timestamp: new Date(),
        };
      }

      const chainId = query.chainId ?? config.defaultChain ?? 'base';
      const spender = query.spender ?? PERMIT2_ADDRESS;

      try {
        const wallet = getWallet();

        const allowance = await wallet.getTokenAllowance(
          query.token,
          query.owner,
          spender,
          chainId as ChainId,
        );

        // Check if unlimited (close to maxUint256)
        const isUnlimited = allowance >= maxUint256 / BigInt(2);

        const result: TokenAllowance = {
          token: query.token,
          owner: query.owner,
          spender,
          allowance: allowance.toString(),
          isUnlimited,
        };

        return {
          success: true,
          data: result,
          timestamp: new Date(),
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get allowance',
          timestamp: new Date(),
        };
      }
    },
  };
}
