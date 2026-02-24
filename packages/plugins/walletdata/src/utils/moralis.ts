/**
 * Moralis API client for wallet data
 */

import axios, { type AxiosInstance } from 'axios';
import type { ChainId } from '@samterminal/plugin-tokendata';
import type {
  MoralisWalletTokensResponse,
  MoralisTransactionsResponse,
  MoralisNftsResponse,
  MoralisApprovalsResponse,
} from '../types/index.js';

const MORALIS_BASE_URL = 'https://deep-index.moralis.io/api/v2.2';

/**
 * Moralis chain mapping
 */
const CHAIN_MAP: Partial<Record<ChainId, string>> = {
  base: '0x2105',
  ethereum: '0x1',
  arbitrum: '0xa4b1',
  polygon: '0x89',
  optimism: '0xa',
  bsc: '0x38',
};

export interface MoralisWalletClientConfig {
  apiKey: string;
  timeout?: number;
}

export class MoralisWalletClient {
  private client: AxiosInstance;

  constructor(config: MoralisWalletClientConfig) {
    if (!config.apiKey) {
      throw new Error('Moralis API key is required');
    }

    this.client = axios.create({
      baseURL: MORALIS_BASE_URL,
      timeout: config.timeout ?? 15000,
      headers: {
        'X-API-Key': config.apiKey,
        Accept: 'application/json',
      },
    });
  }

  /**
   * Get wallet token balances
   */
  async getWalletTokens(
    address: string,
    chainId: ChainId,
    options: {
      excludeSpam?: boolean;
      limit?: number;
      cursor?: string;
    } = {},
  ): Promise<MoralisWalletTokensResponse> {
    const chain = CHAIN_MAP[chainId];

    const response = await this.client.get<MoralisWalletTokensResponse>(
      `/wallets/${address}/tokens`,
      {
        params: {
          chain,
          exclude_spam: options.excludeSpam ?? true,
          limit: options.limit ?? 100,
          cursor: options.cursor,
        },
      },
    );

    return response.data;
  }

  /**
   * Get native balance
   */
  async getNativeBalance(
    address: string,
    chainId: ChainId,
  ): Promise<{ balance: string; balanceFormatted: string }> {
    const chain = CHAIN_MAP[chainId];

    const response = await this.client.get<{ balance: string }>(`/${address}/balance`, {
      params: { chain },
    });

    // Convert wei to ether (18 decimals)
    const balanceWei = BigInt(response.data.balance);
    const balanceFormatted = Number(balanceWei) / 1e18;

    return {
      balance: response.data.balance,
      balanceFormatted: balanceFormatted.toString(),
    };
  }

  /**
   * Get wallet transactions
   */
  async getWalletTransactions(
    address: string,
    chainId: ChainId,
    options: {
      fromBlock?: number;
      toBlock?: number;
      fromDate?: string;
      toDate?: string;
      limit?: number;
      cursor?: string;
    } = {},
  ): Promise<MoralisTransactionsResponse> {
    const chain = CHAIN_MAP[chainId];

    const response = await this.client.get<MoralisTransactionsResponse>(`/${address}`, {
      params: {
        chain,
        from_block: options.fromBlock,
        to_block: options.toBlock,
        from_date: options.fromDate,
        to_date: options.toDate,
        limit: options.limit ?? 100,
        cursor: options.cursor,
      },
    });

    return response.data;
  }

  /**
   * Get wallet NFTs
   */
  async getWalletNfts(
    address: string,
    chainId: ChainId,
    options: {
      excludeSpam?: boolean;
      limit?: number;
      cursor?: string;
      tokenAddresses?: string[];
      normalizeMetadata?: boolean;
    } = {},
  ): Promise<MoralisNftsResponse> {
    const chain = CHAIN_MAP[chainId];

    const response = await this.client.get<MoralisNftsResponse>(`/${address}/nft`, {
      params: {
        chain,
        exclude_spam: options.excludeSpam ?? true,
        limit: options.limit ?? 100,
        cursor: options.cursor,
        token_addresses: options.tokenAddresses?.join(','),
        normalizeMetadata: options.normalizeMetadata ?? true,
      },
    });

    return response.data;
  }

  /**
   * Get token approvals for a wallet
   */
  async getWalletApprovals(
    address: string,
    chainId: ChainId,
    options: {
      limit?: number;
      cursor?: string;
    } = {},
  ): Promise<MoralisApprovalsResponse> {
    const chain = CHAIN_MAP[chainId];

    const response = await this.client.get<MoralisApprovalsResponse>(
      `/wallets/${address}/approvals`,
      {
        params: {
          chain,
          limit: options.limit ?? 100,
          cursor: options.cursor,
        },
      },
    );

    return response.data;
  }

  /**
   * Get wallet net worth
   */
  async getWalletNetWorth(
    address: string,
    chainIds?: ChainId[],
  ): Promise<{
    total_networth_usd: string;
    chains: Array<{
      chain: string;
      native_balance: string;
      native_balance_formatted: string;
      native_balance_usd: string;
      token_balance_usd: string;
      networth_usd: string;
    }>;
  }> {
    const chains =
      chainIds?.map((c) => CHAIN_MAP[c]) ?? undefined;

    const response = await this.client.get<{
      total_networth_usd: string;
      chains: Array<{
        chain: string;
        native_balance: string;
        native_balance_formatted: string;
        native_balance_usd: string;
        token_balance_usd: string;
        networth_usd: string;
      }>;
    }>(`/wallets/${address}/net-worth`, {
      params: {
        chains: chains?.join(','),
        exclude_spam: true,
      },
    });

    return response.data;
  }

  /**
   * Resolve ENS name to address
   */
  async resolveEns(name: string): Promise<{ address: string } | null> {
    try {
      const response = await this.client.get<{ address: string }>(
        `/resolve/ens/${name}`,
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Reverse resolve address to ENS name
   */
  async reverseResolveEns(address: string): Promise<{ name: string } | null> {
    try {
      const response = await this.client.get<{ name: string }>(
        `/resolve/${address}/reverse`,
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }
}
