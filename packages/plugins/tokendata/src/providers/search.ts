/**
 * Token search provider
 */

import type { Provider, ProviderContext, ProviderResult } from '@samterminal/core';
import type { TokenDataPluginConfig, PairData } from '../types/index.js';
import type { DexScreenerClient } from '../utils/dexscreener.js';
import type { CoinGeckoClient } from '../utils/coingecko.js';

export interface TokenSearchQuery {
  query: string;
  limit?: number;
}

export interface TokenSearchResult {
  address: string;
  chainId: string;
  name: string;
  symbol: string;
  logoUrl?: string;
  priceUsd?: number;
  volume24h?: number;
  liquidity?: number;
  marketCap?: number;
  source: 'dexscreener' | 'coingecko';
}

export function createTokenSearchProvider(
  getDexScreener: () => DexScreenerClient,
  getCoinGecko: () => CoinGeckoClient | null,
  _config: TokenDataPluginConfig,
): Provider {
  return {
    name: 'tokendata:search',
    type: 'token',
    description: 'Search for tokens by name, symbol, or address',

    async get(context: ProviderContext): Promise<ProviderResult> {
      const query = context.query as TokenSearchQuery;

      if (!query.query || query.query.length < 2) {
        return {
          success: false,
          error: 'Search query must be at least 2 characters',
          timestamp: new Date(),
        };
      }

      const limit = query.limit ?? 20;

      try {
        const results: TokenSearchResult[] = [];

        // Search DexScreener
        const dexScreener = getDexScreener();
        const dexResults = await dexScreener.searchTokens(query.query);

        // Deduplicate by address and take best pair per token
        const seenAddresses = new Set<string>();
        const uniquePairs: PairData[] = [];

        for (const pair of dexResults) {
          const key = `${pair.chainId}:${pair.baseToken.address.toLowerCase()}`;
          if (!seenAddresses.has(key)) {
            seenAddresses.add(key);
            uniquePairs.push(pair);
          }
        }

        // Add DexScreener results
        for (const pair of uniquePairs.slice(0, limit)) {
          results.push({
            address: pair.baseToken.address,
            chainId: pair.chainId,
            name: pair.baseToken.name,
            symbol: pair.baseToken.symbol,
            logoUrl: pair.info?.imageUrl,
            priceUsd: parseFloat(pair.priceUsd),
            volume24h: pair.volume?.h24,
            liquidity: pair.liquidity?.usd,
            marketCap: pair.marketCap,
            source: 'dexscreener',
          });
        }

        // Search CoinGecko for additional results
        const coinGecko = getCoinGecko();
        if (coinGecko && results.length < limit) {
          try {
            const cgResults = await coinGecko.search(query.query);

            for (const coin of cgResults.coins.slice(0, limit - results.length)) {
              // Only add if not already in results
              const exists = results.some(
                (r) =>
                  r.symbol.toLowerCase() === coin.symbol.toLowerCase() &&
                  r.name.toLowerCase() === coin.name.toLowerCase(),
              );

              if (!exists) {
                results.push({
                  address: coin.id, // CoinGecko ID, not address
                  chainId: 'unknown',
                  name: coin.name,
                  symbol: coin.symbol.toUpperCase(),
                  logoUrl: coin.large,
                  source: 'coingecko',
                });
              }
            }
          } catch (_error) {
            // CoinGecko search is optional
          }
        }

        return {
          success: true,
          data: results.slice(0, limit),
          timestamp: new Date(),
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Search failed',
          timestamp: new Date(),
        };
      }
    },
  };
}
