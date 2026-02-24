/**
 * Token market data provider
 */

import type { Provider, ProviderContext, ProviderResult } from '@samterminal/core';
import type {
  TokenDataPluginConfig,
  TokenMarketData,
  TokenMarketQuery,
  ChainId,
} from '../types/index.js';
import type { DexScreenerClient } from '../utils/dexscreener.js';
import type { CoinGeckoClient } from '../utils/coingecko.js';
import type { MoralisClient } from '../utils/moralis.js';
import type { Cache } from '../utils/cache.js';
import { createCacheKey } from '../utils/cache.js';

export function createTokenMarketProvider(
  getDexScreener: () => DexScreenerClient,
  getCoinGecko: () => CoinGeckoClient | null,
  getMoralis: () => MoralisClient | null,
  getCache: () => Cache<TokenMarketData>,
  config: TokenDataPluginConfig,
): Provider {
  return {
    name: 'tokendata:market',
    type: 'market',
    description: 'Get token market data (market cap, volume, liquidity, holders)',

    async get(context: ProviderContext): Promise<ProviderResult> {
      const query = context.query as TokenMarketQuery;

      if (!query.address) {
        return {
          success: false,
          error: 'Token address is required',
          timestamp: new Date(),
        };
      }

      const chainId = query.chainId ?? config.defaultChain ?? 'base';
      const cacheKey = createCacheKey('market', {
        address: query.address,
        chainId,
        includeHolders: query.includeHolders,
      });

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

        // Calculate transaction metrics
        const buyCount24h = pair.txns?.h24?.buys ?? 0;
        const sellCount24h = pair.txns?.h24?.sells ?? 0;
        const totalTxCount24h = buyCount24h + sellCount24h;

        // Calculate buy/sell pressure (percentage)
        const buyPressure = totalTxCount24h > 0
          ? (buyCount24h / totalTxCount24h) * 100
          : undefined;
        const sellPressure = totalTxCount24h > 0
          ? (sellCount24h / totalTxCount24h) * 100
          : undefined;

        // Calculate token age in seconds
        const pairCreatedAt = pair.pairCreatedAt;
        const tokenAge = pairCreatedAt
          ? Math.floor((Date.now() - pairCreatedAt) / 1000)
          : undefined;

        const marketData: TokenMarketData = {
          address: query.address,
          chainId: chainId as ChainId,
          marketCap: pair.marketCap,
          fullyDilutedValuation: pair.fdv,
          volume24h: pair.volume?.h24,
          liquidity: pair.liquidity?.usd,

          // Price changes from DexScreener
          priceChange1h: pair.priceChange?.h1,
          priceChange24h: pair.priceChange?.h24,

          // Transaction metrics
          txCount24h: totalTxCount24h > 0 ? totalTxCount24h : undefined,
          buyCount24h: buyCount24h > 0 ? buyCount24h : undefined,
          sellCount24h: sellCount24h > 0 ? sellCount24h : undefined,
          buyPressure,
          sellPressure,

          // Token age
          pairCreatedAt,
          tokenAge,

          lastUpdated: new Date().toISOString(),
        };

        // Try CoinGecko for additional market data
        const coinGecko = getCoinGecko();
        if (coinGecko) {
          try {
            const cgInfo = await coinGecko.getTokenInfo(chainId as ChainId, query.address);
            if (cgInfo?.market_data) {
              marketData.circulatingSupply = cgInfo.market_data.circulating_supply;
              marketData.totalSupply = cgInfo.market_data.total_supply;
              marketData.maxSupply = cgInfo.market_data.max_supply ?? undefined;
              marketData.marketCap =
                cgInfo.market_data.market_cap?.usd ?? marketData.marketCap;
              marketData.fullyDilutedValuation =
                cgInfo.market_data.fully_diluted_valuation?.usd ??
                marketData.fullyDilutedValuation;

              // Price changes from CoinGecko (more reliable for 7d)
              marketData.priceChange7d = cgInfo.market_data.price_change_percentage_7d;

              // Override 24h price change if CoinGecko has it (optional)
              if (cgInfo.market_data.price_change_percentage_24h !== undefined) {
                marketData.priceChange24h =
                  marketData.priceChange24h ?? cgInfo.market_data.price_change_percentage_24h;
              }
            }
          } catch (_error) {
            // CoinGecko data is optional
          }
        }

        // Get holder count from Moralis if requested
        if (query.includeHolders) {
          const moralis = getMoralis();
          if (moralis) {
            try {
              const { result } = await moralis.getTokenOwners(chainId as ChainId, query.address, {
                limit: 1,
              });
              // Moralis doesn't directly provide total holder count
              // This is just to check if data is available
              if (result.length > 0) {
                // Holder count would need a separate API or estimation
                marketData.holders = undefined;
              }
            } catch (_error) {
              // Moralis data is optional
            }
          }
        }

        // Cache result
        if (config.enableCache !== false) {
          getCache().set(cacheKey, marketData, config.cacheTtl);
        }

        return {
          success: true,
          data: marketData,
          timestamp: new Date(),
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to fetch market data',
          timestamp: new Date(),
        };
      }
    },
  };
}
