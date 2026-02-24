/**
 * Wallet portfolio provider
 */

import type { Provider, ProviderContext, ProviderResult } from '@samterminal/core';
import type { ChainId } from '@samterminal/plugin-tokendata';
import type {
  WalletDataPluginConfig,
  WalletQuery,
  WalletPortfolio,
  WalletToken,
} from '../types/index.js';
import type { MoralisWalletClient } from '../utils/moralis.js';
import type { Cache } from '../utils/cache.js';
import { createCacheKey, sortTokensByValue } from '../utils/index.js';

export function createWalletPortfolioProvider(
  getMoralis: () => MoralisWalletClient | null,
  getCache: () => Cache<WalletPortfolio>,
  config: WalletDataPluginConfig,
): Provider {
  return {
    name: 'walletdata:portfolio',
    type: 'wallet',
    description: 'Get wallet portfolio summary with top holdings',

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
      const cacheKey = createCacheKey('portfolio', { address: query.address, chainId });

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

        if (!moralis) {
          return {
            success: false,
            error: 'Moralis API key required for portfolio data',
            timestamp: new Date(),
          };
        }

        const tokensResponse = await moralis.getWalletTokens(
          query.address,
          chainId as ChainId,
          { excludeSpam: config.excludeSpam ?? true },
        );

        let totalValueUsd = 0;
        let nativeValueUsd = 0;
        let tokenValueUsd = 0;
        let change24h = 0;

        const tokens: WalletToken[] = [];

        for (const t of tokensResponse.result) {
          const valueUsd = t.usd_value ?? 0;
          totalValueUsd += valueUsd;

          if (t.native_token) {
            nativeValueUsd = valueUsd;
          } else {
            tokenValueUsd += valueUsd;

            tokens.push({
              address: t.token_address,
              chainId: chainId as ChainId,
              name: t.name,
              symbol: t.symbol,
              decimals: t.decimals,
              balance: t.balance,
              balanceFormatted: parseFloat(t.balance_formatted),
              priceUsd: t.usd_price ?? 0,
              valueUsd,
              logoUrl: t.logo ?? t.thumbnail,
              priceChange24h: t.usd_price_24hr_percent_change,
              isSpam: t.possible_spam,
              isVerified: t.verified_contract,
            });

            // Calculate weighted 24h change
            if (t.usd_price_24hr_usd_change && valueUsd > 0) {
              // Estimate previous value
              const previousValue = valueUsd - t.usd_price_24hr_usd_change;
              change24h += t.usd_price_24hr_usd_change;
            }
          }
        }

        // Sort and get top tokens
        const sortedTokens = sortTokensByValue(tokens);
        const topTokens = sortedTokens.slice(0, 10);

        // Calculate 24h change percentage
        const previousTotalValue = totalValueUsd - change24h;
        const change24hPercent =
          previousTotalValue > 0 ? (change24h / previousTotalValue) * 100 : 0;

        const portfolio: WalletPortfolio = {
          address: query.address.toLowerCase(),
          chainId: chainId as ChainId,
          totalValueUsd,
          nativeValueUsd,
          tokenValueUsd,
          tokenCount: tokens.length,
          change24h: change24h || undefined,
          change24hPercent: change24hPercent || undefined,
          topTokens,
          lastUpdated: new Date().toISOString(),
        };

        // Cache result
        if (config.enableCache !== false) {
          getCache().set(cacheKey, portfolio, config.cacheTtl);
        }

        return {
          success: true,
          data: portfolio,
          timestamp: new Date(),
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to fetch portfolio',
          timestamp: new Date(),
        };
      }
    },
  };
}
