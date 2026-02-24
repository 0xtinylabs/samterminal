/**
 * Token metadata provider
 */

import type { Provider, ProviderContext, ProviderResult } from '@samterminal/core';
import type { TokenDataPluginConfig, TokenData, TokenQuery, ChainId } from '../types/index.js';
import type { DexScreenerClient } from '../utils/dexscreener.js';
import type { CoinGeckoClient } from '../utils/coingecko.js';
import type { MoralisClient } from '../utils/moralis.js';
import type { Cache } from '../utils/cache.js';
import { createCacheKey } from '../utils/cache.js';

export function createTokenMetadataProvider(
  getDexScreener: () => DexScreenerClient,
  getCoinGecko: () => CoinGeckoClient | null,
  getMoralis: () => MoralisClient | null,
  getCache: () => Cache<TokenData>,
  config: TokenDataPluginConfig,
): Provider {
  return {
    name: 'tokendata:metadata',
    type: 'token',
    description: 'Get token metadata (name, symbol, logo, social links)',

    async get(context: ProviderContext): Promise<ProviderResult> {
      const query = context.query as TokenQuery;

      if (!query.address) {
        return {
          success: false,
          error: 'Token address is required',
          timestamp: new Date(),
        };
      }

      const chainId = query.chainId ?? config.defaultChain ?? 'base';
      const cacheKey = createCacheKey('metadata', { address: query.address, chainId });

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
        let tokenData: TokenData | null = null;

        // Try DexScreener first (fastest, no API key needed)
        const dexScreener = getDexScreener();
        const pair = await dexScreener.getBestPair(query.address, chainId as ChainId);

        if (pair) {
          tokenData = {
            address: query.address,
            chainId: chainId as ChainId,
            name: pair.baseToken.name,
            symbol: pair.baseToken.symbol,
            decimals: 18, // DexScreener doesn't provide this, default to 18
            logoUrl: pair.info?.imageUrl,
            website: pair.info?.websites?.[0]?.url,
            twitter: pair.info?.socials?.find((s) => s.type === 'twitter')?.url,
            telegram: pair.info?.socials?.find((s) => s.type === 'telegram')?.url,
          };
        }

        // Try CoinGecko for more detailed metadata
        const coinGecko = getCoinGecko();
        if (coinGecko) {
          try {
            const cgInfo = await coinGecko.getTokenInfo(chainId as ChainId, query.address);
            if (cgInfo) {
              tokenData = {
                address: query.address,
                chainId: chainId as ChainId,
                name: cgInfo.name,
                symbol: cgInfo.symbol.toUpperCase(),
                decimals:
                  cgInfo.detail_platforms?.[chainId]?.decimal_place ??
                  tokenData?.decimals ??
                  18,
                logoUrl: cgInfo.image?.large ?? tokenData?.logoUrl,
                description: cgInfo.description?.en,
                website: cgInfo.links?.homepage?.[0] ?? tokenData?.website,
                twitter: cgInfo.links?.twitter_screen_name
                  ? `https://twitter.com/${cgInfo.links.twitter_screen_name}`
                  : tokenData?.twitter,
                telegram: cgInfo.links?.telegram_channel_identifier
                  ? `https://t.me/${cgInfo.links.telegram_channel_identifier}`
                  : tokenData?.telegram,
                coingeckoId: cgInfo.id,
              };
            }
          } catch (_error) {
            // CoinGecko data is optional
          }
        }

        // Try Moralis for logo if still missing
        const moralis = getMoralis();
        if (moralis && tokenData && !tokenData.logoUrl) {
          try {
            const [metadata] = await moralis.getTokenMetadata(chainId as ChainId, [query.address]);
            if (metadata) {
              tokenData.logoUrl = metadata.logo ?? metadata.thumbnail;
              tokenData.decimals = parseInt(metadata.decimals, 10);
            }
          } catch (_error) {
            // Moralis data is optional
          }
        }

        if (!tokenData) {
          return {
            success: false,
            error: 'Token not found',
            timestamp: new Date(),
          };
        }

        // Cache result
        if (config.enableCache !== false) {
          getCache().set(cacheKey, tokenData, config.cacheTtl);
        }

        return {
          success: true,
          data: tokenData,
          timestamp: new Date(),
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to fetch metadata',
          timestamp: new Date(),
        };
      }
    },
  };
}
