/**
 * Wallet tokens provider
 */

import type { Provider, ProviderContext, ProviderResult } from '@samterminal/core';
import type { ChainId } from '@samterminal/plugin-tokendata';
import type {
  WalletDataPluginConfig,
  WalletTokensQuery,
  WalletToken,
} from '../types/index.js';
import type { MoralisWalletClient } from '../utils/moralis.js';
import type { Cache } from '../utils/cache.js';
import { createCacheKey, sortTokensByValue } from '../utils/index.js';

export function createWalletTokensProvider(
  getMoralis: () => MoralisWalletClient | null,
  getCache: () => Cache<WalletToken[]>,
  config: WalletDataPluginConfig,
): Provider {
  return {
    name: 'walletdata:tokens',
    type: 'wallet',
    description: 'Get all tokens held by a wallet',

    async get(context: ProviderContext): Promise<ProviderResult> {
      const query = context.query as WalletTokensQuery;

      if (!query.address) {
        return {
          success: false,
          error: 'Wallet address is required',
          timestamp: new Date(),
        };
      }

      const chainId = query.chainId ?? config.defaultChain ?? 'base';
      const includeSpam = query.includeSpam ?? false;
      const cacheKey = createCacheKey('tokens', {
        address: query.address,
        chainId,
        includeSpam,
      });

      // Check cache
      if (config.enableCache !== false) {
        const cached = getCache().get(cacheKey);
        if (cached) {
          let result = cached;

          // Apply filters
          if (query.minValueUsd) {
            result = result.filter((t) => t.valueUsd >= query.minValueUsd!);
          }
          if (query.limit) {
            result = result.slice(0, query.limit);
          }

          return {
            success: true,
            data: result,
            cached: true,
            timestamp: new Date(),
          };
        }
      }

      try {
        const moralis = getMoralis();

        if (!moralis) {
          return {
            success: false,
            error: 'Moralis API key required for wallet tokens',
            timestamp: new Date(),
          };
        }

        const tokensResponse = await moralis.getWalletTokens(
          query.address,
          chainId as ChainId,
          { excludeSpam: !includeSpam },
        );

        // Map to WalletToken format
        let tokens: WalletToken[] = tokensResponse.result
          .filter((t) => !t.native_token) // Exclude native token from token list
          .map((t) => ({
            address: t.token_address,
            chainId: chainId as ChainId,
            name: t.name,
            symbol: t.symbol,
            decimals: t.decimals,
            balance: t.balance,
            balanceFormatted: parseFloat(t.balance_formatted),
            priceUsd: t.usd_price ?? 0,
            valueUsd: t.usd_value ?? 0,
            logoUrl: t.logo ?? t.thumbnail,
            priceChange24h: t.usd_price_24hr_percent_change,
            isSpam: t.possible_spam,
            isVerified: t.verified_contract,
          }));

        // Sort by value
        tokens = sortTokensByValue(tokens);

        // Cache full result
        if (config.enableCache !== false) {
          getCache().set(cacheKey, tokens, config.cacheTtl);
        }

        // Apply filters for response
        if (query.minValueUsd) {
          tokens = tokens.filter((t) => t.valueUsd >= query.minValueUsd!);
        }
        if (query.limit) {
          tokens = tokens.slice(0, query.limit);
        }

        return {
          success: true,
          data: tokens,
          timestamp: new Date(),
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to fetch wallet tokens',
          timestamp: new Date(),
        };
      }
    },
  };
}
