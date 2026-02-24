/**
 * CoinGecko API client with rate limiting
 */

import axios, { type AxiosInstance } from 'axios';
import {
  TokenBucketRateLimiter,
  API_RATE_LIMITS,
  type RateLimiterConfig,
} from '@samterminal/core';
import type { ChainId, CoinGeckoTokenInfo } from '../types/index.js';

const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';
const COINGECKO_PRO_URL = 'https://pro-api.coingecko.com/api/v3';

/**
 * CoinGecko platform ID mapping
 */
const PLATFORM_MAP: Record<ChainId, string> = {
  base: 'base',
  ethereum: 'ethereum',
  arbitrum: 'arbitrum-one',
  polygon: 'polygon-pos',
  optimism: 'optimistic-ethereum',
  bsc: 'binance-smart-chain',
};

export interface CoinGeckoClientConfig {
  apiKey?: string;
  timeout?: number;
  /** Custom rate limit config (default: 30 req/min for demo tier) */
  rateLimitConfig?: RateLimiterConfig;
  /** Disable rate limiting (not recommended) */
  disableRateLimiting?: boolean;
}

export interface CoinGeckoSimplePrice {
  [coinId: string]: {
    usd?: number;
    usd_market_cap?: number;
    usd_24h_vol?: number;
    usd_24h_change?: number;
    eth?: number;
  };
}

export interface CoinGeckoCoinMarket {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  fully_diluted_valuation: number | null;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap_change_24h: number;
  market_cap_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number | null;
  max_supply: number | null;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  last_updated: string;
}

export class CoinGeckoClient {
  private client: AxiosInstance;
  private isPro: boolean;
  private rateLimiter: TokenBucketRateLimiter | null;

  constructor(config: CoinGeckoClientConfig = {}) {
    this.isPro = !!config.apiKey;

    this.client = axios.create({
      baseURL: this.isPro ? COINGECKO_PRO_URL : COINGECKO_BASE_URL,
      timeout: config.timeout ?? 10000,
      headers: config.apiKey
        ? { 'x-cg-pro-api-key': config.apiKey }
        : undefined,
    });

    // Initialize rate limiter (30 req/min for demo, higher for Pro)
    if (config.disableRateLimiting) {
      this.rateLimiter = null;
    } else {
      this.rateLimiter = new TokenBucketRateLimiter(
        config.rateLimitConfig ?? API_RATE_LIMITS.COINGECKO,
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
   * Get token info by contract address
   */
  async getTokenInfo(chainId: ChainId, contractAddress: string): Promise<CoinGeckoTokenInfo | null> {
    const platform = PLATFORM_MAP[chainId];
    if (!platform) {
      throw new Error(`Unsupported chain: ${chainId}`);
    }

    return this.withRateLimit(async () => {
      try {
        const response = await this.client.get<CoinGeckoTokenInfo>(
          `/coins/${platform}/contract/${contractAddress.toLowerCase()}`,
        );
        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    });
  }

  /**
   * Get simple price for coin IDs
   */
  async getSimplePrice(
    coinIds: string[],
    vsCurrencies: string[] = ['usd'],
    options: {
      includeMarketCap?: boolean;
      include24hVol?: boolean;
      include24hChange?: boolean;
    } = {},
  ): Promise<CoinGeckoSimplePrice> {
    const params = new URLSearchParams({
      ids: coinIds.join(','),
      vs_currencies: vsCurrencies.join(','),
    });

    if (options.includeMarketCap) {
      params.append('include_market_cap', 'true');
    }
    if (options.include24hVol) {
      params.append('include_24hr_vol', 'true');
    }
    if (options.include24hChange) {
      params.append('include_24hr_change', 'true');
    }

    return this.withRateLimit(async () => {
      const response = await this.client.get<CoinGeckoSimplePrice>(
        `/simple/price?${params.toString()}`,
      );
      return response.data;
    });
  }

  /**
   * Get token price by contract address
   */
  async getTokenPrice(
    chainId: ChainId,
    contractAddress: string,
    vsCurrencies: string[] = ['usd'],
    options: {
      includeMarketCap?: boolean;
      include24hVol?: boolean;
      include24hChange?: boolean;
    } = {},
  ): Promise<CoinGeckoSimplePrice | null> {
    const platform = PLATFORM_MAP[chainId];
    if (!platform) {
      throw new Error(`Unsupported chain: ${chainId}`);
    }

    const params = new URLSearchParams({
      contract_addresses: contractAddress.toLowerCase(),
      vs_currencies: vsCurrencies.join(','),
    });

    if (options.includeMarketCap) {
      params.append('include_market_cap', 'true');
    }
    if (options.include24hVol) {
      params.append('include_24hr_vol', 'true');
    }
    if (options.include24hChange) {
      params.append('include_24hr_change', 'true');
    }

    return this.withRateLimit(async () => {
      try {
        const response = await this.client.get<CoinGeckoSimplePrice>(
          `/simple/token_price/${platform}?${params.toString()}`,
        );
        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    });
  }

  /**
   * Get coins market data
   */
  async getCoinsMarkets(
    vsCurrency: string = 'usd',
    options: {
      ids?: string[];
      category?: string;
      order?: 'market_cap_desc' | 'volume_desc' | 'id_asc';
      perPage?: number;
      page?: number;
    } = {},
  ): Promise<CoinGeckoCoinMarket[]> {
    const params = new URLSearchParams({
      vs_currency: vsCurrency,
      order: options.order ?? 'market_cap_desc',
      per_page: String(options.perPage ?? 100),
      page: String(options.page ?? 1),
      sparkline: 'false',
    });

    if (options.ids && options.ids.length > 0) {
      params.append('ids', options.ids.join(','));
    }
    if (options.category) {
      params.append('category', options.category);
    }

    return this.withRateLimit(async () => {
      const response = await this.client.get<CoinGeckoCoinMarket[]>(
        `/coins/markets?${params.toString()}`,
      );
      return response.data;
    });
  }

  /**
   * Search for coins
   */
  async search(
    query: string,
  ): Promise<{
    coins: Array<{
      id: string;
      name: string;
      api_symbol: string;
      symbol: string;
      market_cap_rank: number;
      thumb: string;
      large: string;
    }>;
  }> {
    return this.withRateLimit(async () => {
      const response = await this.client.get<{
        coins: Array<{
          id: string;
          name: string;
          api_symbol: string;
          symbol: string;
          market_cap_rank: number;
          thumb: string;
          large: string;
        }>;
      }>(`/search?query=${encodeURIComponent(query)}`);
      return response.data;
    });
  }

  /**
   * Get trending coins
   */
  async getTrending(): Promise<{
    coins: Array<{
      item: {
        id: string;
        coin_id: number;
        name: string;
        symbol: string;
        market_cap_rank: number;
        thumb: string;
        small: string;
        large: string;
        slug: string;
        price_btc: number;
        score: number;
      };
    }>;
  }> {
    return this.withRateLimit(async () => {
      const response = await this.client.get('/search/trending');
      return response.data;
    });
  }
}
