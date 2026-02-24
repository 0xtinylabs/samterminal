/**
 * 0x API client for swap quotes and execution with rate limiting
 */

import axios, { type AxiosInstance } from 'axios';
import {
  TokenBucketRateLimiter,
  API_RATE_LIMITS,
  type RateLimiterConfig,
} from '@samterminal/core';
import type { ChainId } from '@samterminal/plugin-tokendata';
import type {
  ZeroXQuoteResponse,
  ZeroXPriceResponse,
  SwapPluginConfig,
} from '../types/index.js';

const ZERO_X_API_URL = 'https://api.0x.org';

/**
 * Chain ID mapping for 0x API
 */
const CHAIN_ID_MAP: Partial<Record<ChainId, number>> = {
  base: 8453,
  ethereum: 1,
  arbitrum: 42161,
  polygon: 137,
  optimism: 10,
  bsc: 56,
};

export interface ZeroXClientConfig {
  apiKey: string;
  timeout?: number;
  /** Custom rate limit config (default: 100 req/min) */
  rateLimitConfig?: RateLimiterConfig;
  /** Disable rate limiting (not recommended) */
  disableRateLimiting?: boolean;
}

export class ZeroXClient {
  private client: AxiosInstance;
  private config: SwapPluginConfig;
  private rateLimiter: TokenBucketRateLimiter | null;

  constructor(clientConfig: ZeroXClientConfig, pluginConfig: SwapPluginConfig = {}) {
    if (!clientConfig.apiKey) {
      throw new Error('0x API key is required');
    }

    this.config = pluginConfig;

    this.client = axios.create({
      baseURL: ZERO_X_API_URL,
      timeout: clientConfig.timeout ?? 30000,
      headers: {
        '0x-api-key': clientConfig.apiKey,
        '0x-version': 'v2',
        Accept: 'application/json',
      },
    });

    // Initialize rate limiter (100 req/min)
    if (clientConfig.disableRateLimiting) {
      this.rateLimiter = null;
    } else {
      this.rateLimiter = new TokenBucketRateLimiter(
        clientConfig.rateLimitConfig ?? API_RATE_LIMITS.ZEROX,
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
   * Get indicative price (no transaction data)
   */
  async getPrice(params: {
    sellToken: string;
    buyToken: string;
    sellAmount: string;
    chainId: ChainId;
    taker?: string;
    slippageBps?: number;
  }): Promise<ZeroXPriceResponse> {
    const chainIdNum = CHAIN_ID_MAP[params.chainId];
    if (!chainIdNum) {
      throw new Error(`Unsupported chain: ${params.chainId}`);
    }

    const queryParams: Record<string, string> = {
      sellToken: params.sellToken,
      buyToken: params.buyToken,
      sellAmount: params.sellAmount,
      chainId: String(chainIdNum),
    };

    if (params.taker) {
      queryParams.taker = params.taker;
    }

    if (params.slippageBps) {
      queryParams.slippageBps = String(params.slippageBps);
    }

    // Add fee parameters if configured
    if (this.config.feeBps && this.config.feeRecipient) {
      queryParams.swapFeeBps = String(this.config.feeBps);
      queryParams.swapFeeRecipient = this.config.feeRecipient;
      if (this.config.feeToken) {
        queryParams.swapFeeToken = this.config.feeToken;
      }
    }

    return this.withRateLimit(async () => {
      const response = await this.client.get<ZeroXPriceResponse>(
        '/swap/permit2/price',
        { params: queryParams },
      );
      return response.data;
    });
  }

  /**
   * Get firm quote with transaction data
   */
  async getQuote(params: {
    sellToken: string;
    buyToken: string;
    sellAmount: string;
    chainId: ChainId;
    taker: string;
    slippageBps?: number;
  }): Promise<ZeroXQuoteResponse> {
    const chainIdNum = CHAIN_ID_MAP[params.chainId];
    if (!chainIdNum) {
      throw new Error(`Unsupported chain: ${params.chainId}`);
    }

    const queryParams: Record<string, string> = {
      sellToken: params.sellToken,
      buyToken: params.buyToken,
      sellAmount: params.sellAmount,
      chainId: String(chainIdNum),
      taker: params.taker,
    };

    if (params.slippageBps) {
      queryParams.slippageBps = String(params.slippageBps);
    }

    // Add fee parameters if configured
    if (this.config.feeBps && this.config.feeRecipient) {
      queryParams.swapFeeBps = String(this.config.feeBps);
      queryParams.swapFeeRecipient = this.config.feeRecipient;
      if (this.config.feeToken) {
        queryParams.swapFeeToken = this.config.feeToken;
      }
    }

    return this.withRateLimit(async () => {
      const response = await this.client.get<ZeroXQuoteResponse>(
        '/swap/permit2/quote',
        { params: queryParams },
      );
      return response.data;
    });
  }

  /**
   * Get gas price for chain
   */
  async getGasPrice(chainId: ChainId): Promise<string> {
    const chainIdNum = CHAIN_ID_MAP[chainId];
    if (!chainIdNum) {
      throw new Error(`Unsupported chain: ${chainId}`);
    }

    return this.withRateLimit(async () => {
      // Use a simple quote to get current gas price
      const response = await this.client.get<{ gasPrice: string }>(
        '/swap/permit2/price',
        {
          params: {
            sellToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
            buyToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
            sellAmount: '1000000000000000000',
            chainId: String(chainIdNum),
          },
        },
      );
      return response.data.gasPrice;
    });
  }

  /**
   * Check if liquidity is available for a pair
   */
  async checkLiquidity(params: {
    sellToken: string;
    buyToken: string;
    sellAmount: string;
    chainId: ChainId;
  }): Promise<boolean> {
    try {
      const price = await this.getPrice(params);
      return price.liquidityAvailable;
    } catch (_error) {
      return false;
    }
  }

  /**
   * Get supported chains
   */
  getSupportedChains(): ChainId[] {
    return Object.keys(CHAIN_ID_MAP) as ChainId[];
  }

  /**
   * Check if chain is supported
   */
  isChainSupported(chainId: ChainId): boolean {
    return chainId in CHAIN_ID_MAP;
  }

  /**
   * Get numeric chain ID
   */
  getNumericChainId(chainId: ChainId): number | undefined {
    return CHAIN_ID_MAP[chainId];
  }
}

/**
 * Create a new ZeroXClient instance
 */
export function createZeroXClient(config: {
  apiKey: string;
  cacheTtl?: number;
  enableCache?: boolean;
  requestTimeout?: number;
  feeBps?: number;
  feeRecipient?: string;
  feeToken?: string;
}): ZeroXClient {
  return new ZeroXClient(
    {
      apiKey: config.apiKey,
      timeout: config.requestTimeout,
    },
    {
      cacheTtl: config.cacheTtl,
      enableCache: config.enableCache,
      feeBps: config.feeBps,
      feeRecipient: config.feeRecipient,
      feeToken: config.feeToken,
    },
  );
}
