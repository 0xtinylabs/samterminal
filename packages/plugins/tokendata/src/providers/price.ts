/**
 * Token price provider
 */

import type { Provider, ProviderContext, ProviderResult } from '@samterminal/core';
import type { TokenDataPluginConfig, TokenPrice, TokenPriceQuery, ChainId } from '../types/index.js';
import type { DexScreenerClient } from '../utils/dexscreener.js';
import type { CoinGeckoClient } from '../utils/coingecko.js';
import type { Cache } from '../utils/cache.js';
import { createCacheKey } from '../utils/cache.js';

export function createTokenPriceProvider(
  getDexScreener: () => DexScreenerClient,
  getCoinGecko: () => CoinGeckoClient | null,
  getCache: () => Cache<TokenPrice>,
  config: TokenDataPluginConfig,
): Provider {
  return {
    name: 'tokendata:price',
    type: 'token',
    description: 'Get token price data from DexScreener and CoinGecko',

    async get(context: ProviderContext): Promise<ProviderResult> {
      const query = context.query as TokenPriceQuery;

      if (!query.address) {
        return {
          success: false,
          error: 'Token address is required',
          timestamp: new Date(),
        };
      }

      const chainId = query.chainId ?? config.defaultChain ?? 'base';
      const cacheKey = createCacheKey('price', { address: query.address, chainId });

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
        const dexScreener = getDexScreener();
        const pair = await dexScreener.getBestPair(query.address, chainId as ChainId);

        if (!pair) {
          return {
            success: false,
            error: 'Token not found on DEX',
            timestamp: new Date(),
          };
        }

        const priceData: TokenPrice = {
          address: query.address,
          chainId: chainId as ChainId,
          priceUsd: parseFloat(pair.priceUsd),
          priceNative: parseFloat(pair.priceNative),
          priceChange24h: pair.priceChange?.h24,
          priceChange1h: pair.priceChange?.h1,
          lastUpdated: new Date().toISOString(),
        };

        // Try to get additional data from CoinGecko
        const coinGecko = getCoinGecko();
        if (coinGecko && query.includeHistory) {
          try {
            const cgInfo = await coinGecko.getTokenInfo(chainId as ChainId, query.address);
            if (cgInfo?.market_data) {
              priceData.priceChange7d = cgInfo.market_data.price_change_percentage_7d;
              priceData.priceChange30d = cgInfo.market_data.price_change_percentage_30d;
              priceData.ath = cgInfo.market_data.ath?.usd;
              priceData.athDate = cgInfo.market_data.ath_date?.usd;
              priceData.atl = cgInfo.market_data.atl?.usd;
              priceData.atlDate = cgInfo.market_data.atl_date?.usd;
            }
          } catch (_error) {
            // CoinGecko data is optional
          }
        }

        // Cache result
        if (config.enableCache !== false) {
          getCache().set(cacheKey, priceData, config.cacheTtl);
        }

        return {
          success: true,
          data: priceData,
          timestamp: new Date(),
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to fetch price',
          timestamp: new Date(),
        };
      }
    },
  };
}
