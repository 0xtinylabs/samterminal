/**
 * Wallet token approvals provider
 */

import type { Provider, ProviderContext, ProviderResult } from '@samterminal/core';
import type { ChainId } from '@samterminal/plugin-tokendata';
import type {
  WalletDataPluginConfig,
  WalletApprovalsQuery,
  TokenApproval,
} from '../types/index.js';
import type { MoralisWalletClient } from '../utils/moralis.js';
import type { Cache } from '../utils/cache.js';
import { createCacheKey, formatWei } from '../utils/index.js';

// Max uint256 value (unlimited approval)
const MAX_UINT256 = BigInt(
  '115792089237316195423570985008687907853269984665640564039457584007913129639935',
);

export function createWalletApprovalsProvider(
  getMoralis: () => MoralisWalletClient | null,
  getCache: () => Cache<TokenApproval[]>,
  config: WalletDataPluginConfig,
): Provider {
  return {
    name: 'walletdata:approvals',
    type: 'wallet',
    description: 'Get token approvals/allowances for a wallet',

    async get(context: ProviderContext): Promise<ProviderResult> {
      const query = context.query as WalletApprovalsQuery;

      if (!query.address) {
        return {
          success: false,
          error: 'Wallet address is required',
          timestamp: new Date(),
        };
      }

      const chainId = query.chainId ?? config.defaultChain ?? 'base';
      const includeZero = query.includeZero ?? false;
      const cacheKey = createCacheKey('approvals', {
        address: query.address,
        chainId,
        includeZero,
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
            error: 'Moralis API key required for approvals',
            timestamp: new Date(),
          };
        }

        const approvalsResponse = await moralis.getWalletApprovals(
          query.address,
          chainId as ChainId,
        );

        // Map to TokenApproval format
        let approvals: TokenApproval[] = approvalsResponse.result.map((approval) => {
          const allowanceBigInt = BigInt(approval.value);
          const isUnlimited = allowanceBigInt >= MAX_UINT256 / BigInt(2);

          return {
            tokenAddress: approval.token.address,
            tokenSymbol: approval.token.symbol,
            spenderAddress: approval.spender.address,
            spenderName: approval.spender.address_label,
            allowance: approval.value,
            allowanceFormatted: isUnlimited
              ? Infinity
              : formatWei(approval.value, approval.token.decimals),
            isUnlimited,
            approvedAt: new Date(approval.block_timestamp).getTime() / 1000,
          };
        });

        // Filter out zero approvals unless requested
        if (!includeZero) {
          approvals = approvals.filter((a) => BigInt(a.allowance) > BigInt(0));
        }

        // Sort by most recent
        approvals.sort((a, b) => (b.approvedAt ?? 0) - (a.approvedAt ?? 0));

        // Cache result
        if (config.enableCache !== false) {
          getCache().set(cacheKey, approvals, config.cacheTtl);
        }

        return {
          success: true,
          data: approvals,
          timestamp: new Date(),
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to fetch approvals',
          timestamp: new Date(),
        };
      }
    },
  };
}
