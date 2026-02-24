/**
 * Wallet provider - basic wallet info
 */

import type { Provider, ProviderContext, ProviderResult } from '@samterminal/core';
import type { ChainId } from '@samterminal/plugin-tokendata';
import type { WalletDataPluginConfig, WalletQuery, Wallet } from '../types/index.js';
import type { MoralisWalletClient } from '../utils/moralis.js';
import type { RpcClient } from '../utils/rpc.js';
import type { Cache } from '../utils/cache.js';
import { createCacheKey, formatWei } from '../utils/index.js';

export function createWalletProvider(
  getMoralis: () => MoralisWalletClient | null,
  getRpc: () => RpcClient,
  getCache: () => Cache<Wallet>,
  config: WalletDataPluginConfig,
): Provider {
  return {
    name: 'walletdata:wallet',
    type: 'wallet',
    description: 'Get basic wallet information and balances',

    async get(context: ProviderContext): Promise<ProviderResult> {
      const query = context.query as WalletQuery;

      if (!query.address) {
        return {
          success: false,
          error: 'Wallet address is required',
          timestamp: new Date(),
        };
      }

      const chainId = query.chainId ?? config.defaultChain ?? 'base';
      const cacheKey = createCacheKey('wallet', { address: query.address, chainId });

      // Check cache
      if (config.enableCache !== false) {
        const cached = getCache().get(cacheKey);
        if (cached) {
          return {
            success: true,
            data: cached,
            cached: true,
            timestamp: new Date(),
          };
        }
      }

      try {
        const moralis = getMoralis();
        const rpc = getRpc();

        let totalValueUsd = 0;
        let nativeBalance = '0';
        let nativeBalanceFormatted = 0;
        let nativeValueUsd = 0;
        let tokenCount = 0;

        // Get native balance
        try {
          const balance = await rpc.getNativeBalance(query.address, chainId as ChainId);
          nativeBalance = balance.balance;
          nativeBalanceFormatted = balance.balanceFormatted;
        } catch (_error) {
          // RPC might fail, continue with Moralis
        }

        // Get token data from Moralis
        if (moralis) {
          try {
            const tokensResponse = await moralis.getWalletTokens(
              query.address,
              chainId as ChainId,
              { excludeSpam: config.excludeSpam ?? true },
            );

            // Calculate total value
            for (const token of tokensResponse.result) {
              if (token.usd_value) {
                totalValueUsd += token.usd_value;
              }
              if (token.native_token) {
                nativeValueUsd = token.usd_value ?? 0;
                nativeBalance = token.balance;
                nativeBalanceFormatted = parseFloat(token.balance_formatted);
              }
            }

            tokenCount = tokensResponse.result.filter((t) => !t.native_token).length;
          } catch (_error) {
            // Moralis might fail, continue with partial data
          }
        }

        const wallet: Wallet = {
          address: query.address.toLowerCase(),
          chainId: chainId as ChainId,
          totalValueUsd,
          nativeBalance,
          nativeBalanceFormatted,
          nativeValueUsd,
          tokenCount,
          lastUpdated: new Date().toISOString(),
        };

        // Cache result
        if (config.enableCache !== false) {
          getCache().set(cacheKey, wallet, config.cacheTtl);
        }

        return {
          success: true,
          data: wallet,
          timestamp: new Date(),
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to fetch wallet data',
          timestamp: new Date(),
        };
      }
    },
  };
}
