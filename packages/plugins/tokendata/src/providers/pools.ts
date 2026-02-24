/**
 * Token pools provider
 */

import type { Provider, ProviderContext, ProviderResult } from '@samterminal/core';
import type {
  TokenDataPluginConfig,
  PoolData,
  PoolQuery,
  PoolType,
  ChainId,
  PairData,
} from '../types/index.js';
import type { DexScreenerClient } from '../utils/dexscreener.js';
import type { Cache } from '../utils/cache.js';
import { createCacheKey } from '../utils/cache.js';

/**
 * Map DexScreener dexId to our PoolType
 */
function mapDexToPoolType(dexId: string): PoolType {
  const mapping: Record<string, PoolType> = {
    uniswap: 'uniswap_v2',
    uniswapv2: 'uniswap_v2',
    uniswapv3: 'uniswap_v3',
    uniswap_v3: 'uniswap_v3',
    sushiswap: 'sushiswap',
    pancakeswap: 'pancakeswap',
    curve: 'curve',
    balancer: 'balancer',
    aerodrome: 'aerodrome',
    raydium: 'raydium',
    orca: 'orca',
  };

  return mapping[dexId.toLowerCase()] ?? 'unknown';
}

export function createTokenPoolsProvider(
  getDexScreener: () => DexScreenerClient,
  getCache: () => Cache<PoolData[]>,
  config: TokenDataPluginConfig,
): Provider {
  return {
    name: 'tokendata:pools',
    type: 'token',
    description: 'Get liquidity pools for a token',

    async get(context: ProviderContext): Promise<ProviderResult> {
      const query = context.query as PoolQuery;

      if (!query.tokenAddress && !query.poolAddress) {
        return {
          success: false,
          error: 'Token address or pool address is required',
          timestamp: new Date(),
        };
      }

      const chainId = query.chainId ?? config.defaultChain ?? 'base';
      const limit = query.limit ?? 10;
      const cacheKey = createCacheKey('pools', {
        tokenAddress: query.tokenAddress,
        poolAddress: query.poolAddress,
        chainId,
        dex: query.dex,
        limit,
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
        let pairs: PairData[];

        if (query.poolAddress) {
          const pair = await dexScreener.getPairByAddress(
            chainId as ChainId,
            query.poolAddress,
          );
          pairs = pair ? [pair] : [];
        } else if (query.tokenAddress) {
          pairs = await dexScreener.getTokenPairs(query.tokenAddress, chainId as ChainId);
        } else {
          pairs = [];
        }

        // Filter by DEX if specified
        if (query.dex) {
          pairs = pairs.filter(
            (p) => p.dexId.toLowerCase() === query.dex!.toLowerCase(),
          );
        }

        // Sort by liquidity and limit
        pairs = pairs
          .sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0))
          .slice(0, limit);

        // Map to PoolData
        const pools: PoolData[] = pairs.map((pair) => ({
          address: pair.pairAddress,
          chainId: pair.chainId as ChainId,
          dex: pair.dexId,
          poolType: mapDexToPoolType(pair.dexId),
          token0: {
            address: pair.baseToken.address,
            symbol: pair.baseToken.symbol,
            reserve: String(pair.liquidity?.base ?? 0),
            reserveUsd: pair.liquidity?.base
              ? pair.liquidity.base * parseFloat(pair.priceUsd)
              : undefined,
          },
          token1: {
            address: pair.quoteToken.address,
            symbol: pair.quoteToken.symbol,
            reserve: String(pair.liquidity?.quote ?? 0),
            reserveUsd: pair.liquidity?.quote ? pair.liquidity.quote : undefined,
          },
          liquidity: String(pair.liquidity?.usd ?? 0),
          liquidityUsd: pair.liquidity?.usd,
          volume24h: pair.volume?.h24,
          txCount24h: (pair.txns?.h24?.buys ?? 0) + (pair.txns?.h24?.sells ?? 0),
          createdAt: pair.pairCreatedAt
            ? new Date(pair.pairCreatedAt).toISOString()
            : undefined,
          lastUpdated: new Date().toISOString(),
        }));

        // Cache result
        if (config.enableCache !== false) {
          getCache().set(cacheKey, pools, config.cacheTtl);
        }

        return {
          success: true,
          data: pools,
          timestamp: new Date(),
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to fetch pools',
          timestamp: new Date(),
        };
      }
    },
  };
}
