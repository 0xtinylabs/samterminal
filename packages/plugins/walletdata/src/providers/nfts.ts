/**
 * Wallet NFTs provider
 */

import type { Provider, ProviderContext, ProviderResult } from '@samterminal/core';
import type { ChainId } from '@samterminal/plugin-tokendata';
import type { WalletDataPluginConfig, WalletNftsQuery, WalletNft } from '../types/index.js';
import type { MoralisWalletClient } from '../utils/moralis.js';
import type { Cache } from '../utils/cache.js';
import { createCacheKey } from '../utils/index.js';

export function createWalletNftsProvider(
  getMoralis: () => MoralisWalletClient | null,
  getCache: () => Cache<WalletNft[]>,
  config: WalletDataPluginConfig,
): Provider {
  return {
    name: 'walletdata:nfts',
    type: 'wallet',
    description: 'Get NFTs held by a wallet',

    async get(context: ProviderContext): Promise<ProviderResult> {
      const query = context.query as WalletNftsQuery;

      if (!query.address) {
        return {
          success: false,
          error: 'Wallet address is required',
          timestamp: new Date(),
        };
      }

      const chainId = query.chainId ?? config.defaultChain ?? 'base';
      const limit = query.limit ?? 100;
      const cacheKey = createCacheKey('nfts', {
        address: query.address,
        chainId,
        collection: query.collection,
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
        const moralis = getMoralis();

        if (!moralis) {
          return {
            success: false,
            error: 'Moralis API key required for NFTs',
            timestamp: new Date(),
          };
        }

        const nftsResponse = await moralis.getWalletNfts(query.address, chainId as ChainId, {
          excludeSpam: config.excludeSpam ?? true,
          limit,
          tokenAddresses: query.collection ? [query.collection] : undefined,
          normalizeMetadata: true,
        });

        // Map to WalletNft format
        const nfts: WalletNft[] = nftsResponse.result
          .filter((nft) => !nft.possible_spam)
          .map((nft) => {
            const metadata = nft.normalized_metadata;

            return {
              contractAddress: nft.token_address,
              tokenId: nft.token_id,
              chainId: chainId as ChainId,
              name: metadata?.name ?? nft.name ?? `#${nft.token_id}`,
              description: metadata?.description,
              imageUrl: metadata?.image,
              animationUrl: metadata?.animation_url,
              collectionName: nft.name,
              collectionSymbol: nft.symbol,
              standard: nft.contract_type === 'ERC1155' ? 'ERC1155' : 'ERC721',
              amount: parseInt(nft.amount, 10) || 1,
              floorPriceUsd: nft.floor_price_usd
                ? parseFloat(nft.floor_price_usd)
                : undefined,
              attributes: metadata?.attributes,
            };
          });

        // Cache result
        if (config.enableCache !== false) {
          getCache().set(cacheKey, nfts, config.cacheTtl);
        }

        return {
          success: true,
          data: nfts,
          timestamp: new Date(),
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to fetch NFTs',
          timestamp: new Date(),
        };
      }
    },
  };
}
