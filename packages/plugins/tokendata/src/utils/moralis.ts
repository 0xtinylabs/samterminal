/**
 * Moralis API client for token security and metadata with rate limiting
 */

import axios, { type AxiosInstance } from 'axios';
import {
  TokenBucketRateLimiter,
  API_RATE_LIMITS,
  type RateLimiterConfig,
} from '@samterminal/core';
import type { ChainId, TokenSecurity, TokenHolder } from '../types/index.js';

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

export interface MoralisClientConfig {
  apiKey: string;
  timeout?: number;
  /** Custom rate limit config (default: 25 req/s for free tier) */
  rateLimitConfig?: RateLimiterConfig;
  /** Disable rate limiting (not recommended) */
  disableRateLimiting?: boolean;
}

export interface MoralisTokenMetadata {
  address: string;
  name: string;
  symbol: string;
  decimals: string;
  logo?: string;
  logo_hash?: string;
  thumbnail?: string;
  block_number?: string;
  validated?: number;
  created_at?: string;
  possible_spam?: boolean;
  verified_contract?: boolean;
}

export interface MoralisTokenPrice {
  tokenName: string;
  tokenSymbol: string;
  tokenLogo?: string;
  tokenDecimals: string;
  nativePrice?: {
    value: string;
    decimals: number;
    name: string;
    symbol: string;
    address: string;
  };
  usdPrice: number;
  usdPriceFormatted?: string;
  exchangeAddress?: string;
  exchangeName?: string;
  '24hrPercentChange'?: string;
}

export interface MoralisTokenOwner {
  balance: string;
  balance_formatted: string;
  is_contract: boolean;
  owner_address: string;
  owner_address_label?: string;
  usd_value?: string;
  percentage_relative_to_total_supply?: number;
}

export interface MoralisSecurityData {
  is_contract: boolean;
  is_verified: boolean;
  is_honeypot: boolean;
  is_mintable: boolean;
  is_proxy: boolean;
  has_blacklist: boolean;
  has_whitelist: boolean;
  has_trading_cooldown: boolean;
  buy_tax?: number;
  sell_tax?: number;
  transfer_tax?: number;
  owner_address?: string;
  is_owner_renounced: boolean;
}

export class MoralisClient {
  private client: AxiosInstance;
  private rateLimiter: TokenBucketRateLimiter | null;

  constructor(config: MoralisClientConfig) {
    if (!config.apiKey) {
      throw new Error('Moralis API key is required');
    }

    this.client = axios.create({
      baseURL: MORALIS_BASE_URL,
      timeout: config.timeout ?? 10000,
      headers: {
        'X-API-Key': config.apiKey,
        'Accept': 'application/json',
      },
    });

    // Initialize rate limiter (25 req/s for free tier)
    if (config.disableRateLimiting) {
      this.rateLimiter = null;
    } else {
      this.rateLimiter = new TokenBucketRateLimiter(
        config.rateLimitConfig ?? API_RATE_LIMITS.MORALIS,
      );
    }
  }

  /**
   * Execute request with rate limiting
   */
  private async withRateLimit<T>(fn: () => Promise<T>): Promise<T> {
    if (this.rateLimiter) {
      return this.rateLimiter.execute(fn);
    }
    return fn();
  }

  /**
   * Get token metadata
   */
  async getTokenMetadata(
    chainId: ChainId,
    addresses: string[],
  ): Promise<MoralisTokenMetadata[]> {
    const chain = CHAIN_MAP[chainId];
    return this.withRateLimit(async () => {
      const response = await this.client.get<MoralisTokenMetadata[]>(
        '/erc20/metadata',
        {
          params: {
            chain,
            addresses: addresses.join(','),
          },
        },
      );
      return response.data;
    });
  }

  /**
   * Get token price
   */
  async getTokenPrice(
    chainId: ChainId,
    address: string,
  ): Promise<MoralisTokenPrice | null> {
    const chain = CHAIN_MAP[chainId];

    return this.withRateLimit(async () => {
      try {
        const response = await this.client.get<MoralisTokenPrice>(
          `/erc20/${address}/price`,
          {
            params: { chain },
          },
        );
        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          return null;
        }
        // Strip sensitive headers from axios errors
        if (axios.isAxiosError(error) && error.config?.headers) {
          delete error.config.headers['X-API-Key'];
          delete error.config.headers['Authorization'];
        }
        throw error;
      }
    });
  }

  /**
   * Get token owners/holders
   */
  async getTokenOwners(
    chainId: ChainId,
    address: string,
    options: {
      limit?: number;
      cursor?: string;
      order?: 'ASC' | 'DESC';
    } = {},
  ): Promise<{
    result: MoralisTokenOwner[];
    cursor?: string;
    page?: number;
    page_size?: number;
  }> {
    const chain = CHAIN_MAP[chainId];

    return this.withRateLimit(async () => {
      const response = await this.client.get<{
        result: MoralisTokenOwner[];
        cursor?: string;
        page?: number;
        page_size?: number;
      }>(`/erc20/${address}/owners`, {
        params: {
          chain,
          limit: options.limit ?? 100,
          cursor: options.cursor,
          order: options.order ?? 'DESC',
        },
      });
      return response.data;
    });
  }

  /**
   * Get token security data (custom implementation based on available data)
   */
  async getTokenSecurity(
    chainId: ChainId,
    address: string,
  ): Promise<TokenSecurity | null> {
    try {
      const [metadata] = await this.getTokenMetadata(chainId, [address]);

      if (!metadata) {
        return null;
      }

      // Build security profile from available data
      const warnings: string[] = [];
      let riskLevel: TokenSecurity['riskLevel'] = 'low';

      if (metadata.possible_spam) {
        warnings.push('Token flagged as possible spam');
        riskLevel = 'high';
      }

      if (!metadata.verified_contract) {
        warnings.push('Contract not verified');
        if (riskLevel === 'low') riskLevel = 'medium';
      }

      return {
        address,
        chainId,
        isVerified: metadata.verified_contract ?? false,
        isHoneypot: false, // Would need deeper analysis
        isMintable: false, // Would need contract analysis
        isProxy: false, // Would need contract analysis
        hasBlacklist: false, // Would need contract analysis
        hasWhitelist: false, // Would need contract analysis
        hasTradingCooldown: false, // Would need contract analysis
        isOwnerRenounced: false, // Would need contract analysis
        riskLevel,
        warnings,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      // Strip sensitive headers from axios errors
      if (axios.isAxiosError(error) && error.config?.headers) {
        delete error.config.headers['X-API-Key'];
        delete error.config.headers['Authorization'];
      }
      throw error;
    }
  }

  /**
   * Get token holders formatted
   */
  async getTokenHolders(
    chainId: ChainId,
    address: string,
    limit: number = 100,
  ): Promise<TokenHolder[]> {
    const { result } = await this.getTokenOwners(chainId, address, { limit });

    return result.map((owner) => ({
      address: owner.owner_address,
      balance: owner.balance,
      balanceFormatted: parseFloat(owner.balance_formatted),
      percentage: owner.percentage_relative_to_total_supply ?? 0,
      isContract: owner.is_contract,
      label: owner.owner_address_label,
    }));
  }
}
