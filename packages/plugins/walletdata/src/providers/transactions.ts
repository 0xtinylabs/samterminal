/**
 * Wallet transactions provider
 */

import type { Provider, ProviderContext, ProviderResult } from '@samterminal/core';
import type { ChainId } from '@samterminal/plugin-tokendata';
import type {
  WalletDataPluginConfig,
  WalletTransactionsQuery,
  WalletTransaction,
} from '../types/index.js';
import type { MoralisWalletClient } from '../utils/moralis.js';
import type { Cache } from '../utils/cache.js';
import { createCacheKey, formatWei } from '../utils/index.js';

export function createWalletTransactionsProvider(
  getMoralis: () => MoralisWalletClient | null,
  getCache: () => Cache<WalletTransaction[]>,
  config: WalletDataPluginConfig,
): Provider {
  return {
    name: 'walletdata:transactions',
    type: 'transaction',
    description: 'Get wallet transaction history',

    async get(context: ProviderContext): Promise<ProviderResult> {
      const query = context.query as WalletTransactionsQuery;

      if (!query.address) {
        return {
          success: false,
          error: 'Wallet address is required',
          timestamp: new Date(),
        };
      }

      const chainId = query.chainId ?? config.defaultChain ?? 'base';
      const limit = query.limit ?? 50;
      const cacheKey = createCacheKey('transactions', {
        address: query.address,
        chainId,
        from: query.from,
        to: query.to,
        limit,
        type: query.type,
      });

      // Check cache (shorter TTL for transactions)
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
            error: 'Moralis API key required for transactions',
            timestamp: new Date(),
          };
        }

        const txResponse = await moralis.getWalletTransactions(
          query.address,
          chainId as ChainId,
          {
            fromDate: query.from ? new Date(query.from * 1000).toISOString() : undefined,
            toDate: query.to ? new Date(query.to * 1000).toISOString() : undefined,
            limit,
          },
        );

        const addressLower = query.address.toLowerCase();

        // Map to WalletTransaction format
        let transactions: WalletTransaction[] = txResponse.result.map((tx) => {
          const fromAddress = tx.from_address.toLowerCase();
          const toAddress = tx.to_address?.toLowerCase() ?? '';

          let type: WalletTransaction['type'];
          if (fromAddress === addressLower && toAddress === addressLower) {
            type = 'self';
          } else if (fromAddress === addressLower) {
            type = 'outgoing';
          } else if (toAddress === addressLower) {
            type = 'incoming';
          } else {
            type = 'contract';
          }

          const valueWei = BigInt(tx.value);
          const gasUsed = tx.receipt_gas_used;
          const gasPrice = tx.gas_price;

          // Calculate gas cost
          let gasCostUsd: number | undefined;
          if (gasUsed && gasPrice) {
            const gasCostWei = BigInt(gasUsed) * BigInt(gasPrice);
            // Note: Would need ETH price for accurate USD value
            gasCostUsd = undefined;
          }

          return {
            hash: tx.hash,
            chainId: chainId as ChainId,
            blockNumber: parseInt(tx.block_number, 10),
            timestamp: new Date(tx.block_timestamp).getTime() / 1000,
            from: tx.from_address,
            to: tx.to_address,
            value: tx.value,
            valueFormatted: formatWei(tx.value, 18),
            type,
            status:
              tx.receipt_status === '1'
                ? 'confirmed'
                : tx.receipt_status === '0'
                  ? 'failed'
                  : 'pending',
            gasUsed: tx.receipt_gas_used,
            gasPrice: tx.gas_price,
            gasCostUsd,
            methodName: tx.method_label,
          };
        });

        // Filter by type if specified
        if (query.type && query.type !== 'all') {
          transactions = transactions.filter((tx) => tx.type === query.type);
        }

        // Cache result (shorter TTL for transactions)
        if (config.enableCache !== false) {
          getCache().set(cacheKey, transactions, (config.cacheTtl ?? 30000) / 2);
        }

        return {
          success: true,
          data: transactions,
          timestamp: new Date(),
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to fetch transactions',
          timestamp: new Date(),
        };
      }
    },
  };
}
