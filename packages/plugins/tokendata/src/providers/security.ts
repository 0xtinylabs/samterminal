/**
 * Token security provider
 */

import type { Provider, ProviderContext, ProviderResult } from '@samterminal/core';
import type {
  TokenDataPluginConfig,
  TokenSecurity,
  TokenSecurityQuery,
  ChainId,
} from '../types/index.js';
import type { MoralisClient } from '../utils/moralis.js';
import type { Cache } from '../utils/cache.js';
import { createCacheKey } from '../utils/cache.js';

export function createTokenSecurityProvider(
  getMoralis: () => MoralisClient | null,
  getCache: () => Cache<TokenSecurity>,
  config: TokenDataPluginConfig,
): Provider {
  return {
    name: 'tokendata:security',
    type: 'token',
    description: 'Get token security analysis (honeypot, taxes, ownership)',

    async get(context: ProviderContext): Promise<ProviderResult> {
      const query = context.query as TokenSecurityQuery;

      if (!query.address) {
        return {
          success: false,
          error: 'Token address is required',
          timestamp: new Date(),
        };
      }

      const chainId = query.chainId ?? config.defaultChain ?? 'base';

      const cacheKey = createCacheKey('security', {
        address: query.address,
        chainId,
        deepScan: query.deepScan,
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
        const moralis = getMoralis();

        if (!moralis) {
          return {
            success: false,
            error: 'Moralis API key required for security analysis',
            timestamp: new Date(),
          };
        }

        const securityData = await moralis.getTokenSecurity(
          chainId as ChainId,
          query.address,
        );

        if (!securityData) {
          return {
            success: false,
            error: 'Token not found or security data unavailable',
            timestamp: new Date(),
          };
        }

        // Cache result (longer TTL for security data as it changes less frequently)
        if (config.enableCache !== false) {
          getCache().set(cacheKey, securityData, (config.cacheTtl ?? 30000) * 10);
        }

        return {
          success: true,
          data: securityData,
          timestamp: new Date(),
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to fetch security data',
          timestamp: new Date(),
        };
      }
    },
  };
}
