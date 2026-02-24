/**
 * DexScreener API client with rate limiting
 */

import axios, { type AxiosInstance } from 'axios';
import {
  TokenBucketRateLimiter,
  API_RATE_LIMITS,
  type RateLimiterConfig,
} from '@samterminal/core';
import type {
  ChainId,
  DexScreenerPairsResponse,
  DexScreenerTokenResponse,
  PairData,
} from '../types/index.js';

const DEXSCREENER_BASE_URL = 'https://api.dexscreener.com';

/**
 * Retry with exponential backoff
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000,
): Promise<T> {
  let lastError: Error | undefined;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      // Don't retry on 4xx errors (except 429 rate limit)
      if (
        axios.isAxiosError(error) &&
        error.response?.status &&
        error.response.status >= 400 &&
        error.response.status < 500 &&
        error.response.status !== 429
      ) {
        throw error;
      }
      if (attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

/**
 * Chain ID mapping for DexScreener
 */
const CHAIN_MAP: Record<ChainId, string> = {
  base: 'base',
  ethereum: 'ethereum',
  arbitrum: 'arbitrum',
  polygon: 'polygon',
  optimism: 'optimism',
  bsc: 'bsc',
};

export interface DexScreenerClientConfig {
  apiKey?: string;
  timeout?: number;
  /** Custom rate limit config for pairs endpoints (default: 300 req/min) */
  pairsRateLimitConfig?: RateLimiterConfig;
  /** Custom rate limit config for profiles endpoints (default: 60 req/min) */
  profilesRateLimitConfig?: RateLimiterConfig;
  /** Disable rate limiting (not recommended) */
  disableRateLimiting?: boolean;
}

export class DexScreenerClient {
  private client: AxiosInstance;
  private pairsLimiter: TokenBucketRateLimiter | null;
  private profilesLimiter: TokenBucketRateLimiter | null;

  constructor(config: DexScreenerClientConfig = {}) {
    this.client = axios.create({
      baseURL: DEXSCREENER_BASE_URL,
      timeout: config.timeout ?? 10000,
      headers: config.apiKey
        ? { 'X-API-Key': config.apiKey }
        : undefined,
    });

    // Initialize rate limiters
    if (config.disableRateLimiting) {
      this.pairsLimiter = null;
      this.profilesLimiter = null;
    } else {
      this.pairsLimiter = new TokenBucketRateLimiter(
        config.pairsRateLimitConfig ?? API_RATE_LIMITS.DEXSCREENER_PAIRS,
      );
      this.profilesLimiter = new TokenBucketRateLimiter(
        config.profilesRateLimitConfig ?? API_RATE_LIMITS.DEXSCREENER_PROFILES,
      );
    }
  }

  /**
   * Execute request with appropriate rate limiting
   */
  private async withRateLimit<T>(
    fn: () => Promise<T>,
    useProfilesLimit = false,
  ): Promise<T> {
    const limiter = useProfilesLimit ? this.profilesLimiter : this.pairsLimiter;
    if (limiter) {
      return limiter.execute(fn);
    }
    return fn();
  }

  /**
   * Get pair data by pair address
   */
  async getPairByAddress(chainId: ChainId, pairAddress: string): Promise<PairData | null> {
    const chain = CHAIN_MAP[chainId];
    if (!chain) {
      throw new Error(`Unsupported chain: ${chainId}`);
    }

    return this.withRateLimit(async () => {
      return withRetry(async () => {
        const response = await this.client.get<DexScreenerPairsResponse>(
          `/latest/dex/pairs/${chain}/${pairAddress}`,
        );

        if (!response.data.pairs || response.data.pairs.length === 0) {
          return null;
        }

        return response.data.pairs[0];
      });
    });
  }

  /**
   * Get all pairs for a token address
   */
  async getTokenPairs(tokenAddress: string, chainId?: ChainId): Promise<PairData[]> {
    let url = `/latest/dex/tokens/${tokenAddress}`;

    if (chainId) {
      const chain = CHAIN_MAP[chainId];
      if (!chain) {
        throw new Error(`Unsupported chain: ${chainId}`);
      }
      url = `/latest/dex/tokens/${tokenAddress}?chain=${chain}`;
    }

    return this.withRateLimit(async () => {
      return withRetry(async () => {
        const response = await this.client.get<DexScreenerTokenResponse>(url);
        return response.data.pairs ?? [];
      });
    });
  }

  /**
   * Search for tokens by query
   */
  async searchTokens(query: string): Promise<PairData[]> {
    return this.withRateLimit(async () => {
      return withRetry(async () => {
        const response = await this.client.get<DexScreenerTokenResponse>(
          `/latest/dex/search?q=${encodeURIComponent(query)}`,
        );
        return response.data.pairs ?? [];
      });
    });
  }

  /**
   * Get top boosted tokens (uses profiles rate limit)
   */
  async getBoostedTokens(): Promise<PairData[]> {
    return this.withRateLimit(async () => {
      const response = await this.client.get<DexScreenerTokenResponse>(
        '/token-boosts/top/v1',
      );
      return response.data.pairs ?? [];
    }, true); // Use profiles rate limit
  }

  /**
   * Get latest token profiles (uses profiles rate limit)
   */
  async getLatestProfiles(): Promise<PairData[]> {
    return this.withRateLimit(async () => {
      const response = await this.client.get<DexScreenerTokenResponse>(
        '/token-profiles/latest/v1',
      );
      return response.data.pairs ?? [];
    }, true); // Use profiles rate limit
  }

  /**
   * Get best pair for a token (highest liquidity)
   */
  async getBestPair(tokenAddress: string, chainId?: ChainId): Promise<PairData | null> {
    const pairs = await this.getTokenPairs(tokenAddress, chainId);

    if (pairs.length === 0) {
      return null;
    }

    // Sort by liquidity and return the best one
    const sortedPairs = pairs.sort((a, b) => {
      const liqA = a.liquidity?.usd ?? 0;
      const liqB = b.liquidity?.usd ?? 0;
      return liqB - liqA;
    });

    return sortedPairs[0];
  }

  /**
   * Get token price from best pair
   */
  async getTokenPrice(tokenAddress: string, chainId?: ChainId): Promise<number | null> {
    const pair = await this.getBestPair(tokenAddress, chainId);

    if (!pair) {
      return null;
    }

    return parseFloat(pair.priceUsd);
  }
}
