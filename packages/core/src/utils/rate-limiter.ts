/**
 * Token Bucket Rate Limiter for external API calls
 * Prevents quota exhaustion and IP bans
 */

import { sleep } from './retry.js';

/**
 * Rate limiter configuration
 */
export interface RateLimiterConfig {
  /** Maximum tokens in the bucket */
  maxTokens: number;
  /** Tokens added per interval */
  refillRate: number;
  /** Refill interval in milliseconds */
  refillIntervalMs: number;
  /** Whether to queue requests when rate limited (vs reject) */
  queueRequests?: boolean;
  /** Maximum queue size (if queueRequests is true) */
  maxQueueSize?: number;
  /** Maximum wait time in queue (ms) */
  maxWaitMs?: number;
}

/**
 * Preset rate limit configurations for common APIs
 */
export const API_RATE_LIMITS = {
  // DexScreener: 300 req/min for pairs, 60 req/min for profiles
  DEXSCREENER_PAIRS: {
    maxTokens: 300,
    refillRate: 300,
    refillIntervalMs: 60000,
    queueRequests: true,
    maxQueueSize: 50,
    maxWaitMs: 30000,
  },
  DEXSCREENER_PROFILES: {
    maxTokens: 60,
    refillRate: 60,
    refillIntervalMs: 60000,
    queueRequests: true,
    maxQueueSize: 20,
    maxWaitMs: 30000,
  },

  // CoinGecko: 30 calls/min (demo tier)
  COINGECKO: {
    maxTokens: 30,
    refillRate: 30,
    refillIntervalMs: 60000,
    queueRequests: true,
    maxQueueSize: 30,
    maxWaitMs: 60000,
  },

  // Moralis: ~25 req/s conservative (1000 CU/s, avg 40 CU per request)
  MORALIS: {
    maxTokens: 25,
    refillRate: 25,
    refillIntervalMs: 1000,
    queueRequests: true,
    maxQueueSize: 100,
    maxWaitMs: 30000,
  },

  // OpenAI: ~16 req/s (1000 RPM / 60)
  OPENAI: {
    maxTokens: 16,
    refillRate: 16,
    refillIntervalMs: 1000,
    queueRequests: true,
    maxQueueSize: 50,
    maxWaitMs: 60000,
  },

  // Anthropic: Conservative 50 RPM (Tier 1)
  ANTHROPIC: {
    maxTokens: 50,
    refillRate: 50,
    refillIntervalMs: 60000,
    queueRequests: true,
    maxQueueSize: 30,
    maxWaitMs: 120000,
  },

  // 0x API: ~100 req/min
  ZEROX: {
    maxTokens: 100,
    refillRate: 100,
    refillIntervalMs: 60000,
    queueRequests: true,
    maxQueueSize: 50,
    maxWaitMs: 30000,
  },

  // Alchemy RPC: ~330 req/s (generous)
  ALCHEMY: {
    maxTokens: 30,
    refillRate: 30,
    refillIntervalMs: 100,
    queueRequests: true,
    maxQueueSize: 100,
    maxWaitMs: 10000,
  },
} as const satisfies Record<string, RateLimiterConfig>;

/**
 * Rate limit exceeded error
 */
export class RateLimitError extends Error {
  constructor(
    message: string,
    public readonly retryAfterMs?: number,
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}

/**
 * Token Bucket Rate Limiter
 *
 * Implements the token bucket algorithm:
 * - Bucket starts full with maxTokens
 * - Each request consumes 1 token
 * - Tokens are refilled at refillRate per refillIntervalMs
 * - Requests are queued or rejected when bucket is empty
 */
export class TokenBucketRateLimiter {
  private tokens: number;
  private lastRefill: number;
  private queue: Array<{
    resolve: () => void;
    reject: (error: Error) => void;
    timestamp: number;
  }> = [];
  private processing = false;

  constructor(private readonly config: RateLimiterConfig) {
    this.tokens = config.maxTokens;
    this.lastRefill = Date.now();
  }

  /**
   * Refill tokens based on elapsed time
   */
  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const intervals = Math.floor(elapsed / this.config.refillIntervalMs);

    if (intervals > 0) {
      const tokensToAdd = intervals * this.config.refillRate;
      this.tokens = Math.min(this.config.maxTokens, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }
  }

  /**
   * Calculate time until next token is available
   */
  private getTimeUntilNextToken(): number {
    if (this.tokens > 0) return 0;

    const elapsed = Date.now() - this.lastRefill;
    const timeUntilRefill = this.config.refillIntervalMs - elapsed;
    return Math.max(0, timeUntilRefill);
  }

  /**
   * Process queued requests
   */
  private async processQueue(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    try {
      while (this.queue.length > 0) {
        this.refill();

        // Check for expired requests
        const now = Date.now();
        const maxWait = this.config.maxWaitMs ?? 30000;

        // Remove and reject expired requests
        while (this.queue.length > 0) {
          const oldest = this.queue[0];
          if (now - oldest.timestamp > maxWait) {
            this.queue.shift();
            oldest.reject(
              new RateLimitError(
                `Request timed out waiting for rate limit (waited ${maxWait}ms)`,
              ),
            );
          } else {
            break;
          }
        }

        if (this.queue.length === 0) break;

        if (this.tokens >= 1) {
          this.tokens -= 1;
          const request = this.queue.shift();
          request?.resolve();
        } else {
          // Wait for next refill
          const waitTime = this.getTimeUntilNextToken();
          await sleep(Math.max(waitTime, 10));
        }
      }
    } finally {
      this.processing = false;
    }
  }

  /**
   * Acquire a token to make a request
   * Returns a promise that resolves when a token is available
   */
  async acquire(): Promise<void> {
    this.refill();

    // Fast path: token available immediately
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return;
    }

    // No tokens available
    if (!this.config.queueRequests) {
      const retryAfter = this.getTimeUntilNextToken();
      throw new RateLimitError(
        `Rate limit exceeded. Retry after ${retryAfter}ms`,
        retryAfter,
      );
    }

    // Check queue size
    const maxQueueSize = this.config.maxQueueSize ?? 100;
    if (this.queue.length >= maxQueueSize) {
      throw new RateLimitError(
        `Rate limit queue full (${maxQueueSize} requests waiting)`,
      );
    }

    // Queue the request
    return new Promise((resolve, reject) => {
      this.queue.push({ resolve, reject, timestamp: Date.now() });
      this.processQueue();
    });
  }

  /**
   * Execute a function with rate limiting
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    return fn();
  }

  /**
   * Get current state (for monitoring)
   */
  getState(): {
    availableTokens: number;
    queueSize: number;
    maxTokens: number;
  } {
    this.refill();
    return {
      availableTokens: this.tokens,
      queueSize: this.queue.length,
      maxTokens: this.config.maxTokens,
    };
  }

  /**
   * Reset the rate limiter
   */
  reset(): void {
    this.tokens = this.config.maxTokens;
    this.lastRefill = Date.now();
    // Reject all queued requests
    while (this.queue.length > 0) {
      const request = this.queue.shift();
      request?.reject(new RateLimitError('Rate limiter reset'));
    }
  }
}

/**
 * Multi-endpoint rate limiter manager
 * Manages separate rate limiters for different API endpoints
 */
export class RateLimiterManager {
  private limiters: Map<string, TokenBucketRateLimiter> = new Map();

  /**
   * Get or create a rate limiter for an endpoint
   */
  getLimiter(name: string, config: RateLimiterConfig): TokenBucketRateLimiter {
    let limiter = this.limiters.get(name);
    if (!limiter) {
      limiter = new TokenBucketRateLimiter(config);
      this.limiters.set(name, limiter);
    }
    return limiter;
  }

  /**
   * Execute with rate limiting for a specific endpoint
   */
  async execute<T>(
    name: string,
    config: RateLimiterConfig,
    fn: () => Promise<T>,
  ): Promise<T> {
    const limiter = this.getLimiter(name, config);
    return limiter.execute(fn);
  }

  /**
   * Get all limiter states (for monitoring)
   */
  getAllStates(): Record<string, ReturnType<TokenBucketRateLimiter['getState']>> {
    const states: Record<string, ReturnType<TokenBucketRateLimiter['getState']>> = {};
    for (const [name, limiter] of this.limiters) {
      states[name] = limiter.getState();
    }
    return states;
  }

  /**
   * Reset all limiters
   */
  resetAll(): void {
    for (const limiter of this.limiters.values()) {
      limiter.reset();
    }
  }
}

// Global rate limiter manager instance
let globalManager: RateLimiterManager | null = null;

/**
 * Get the global rate limiter manager
 */
export function getRateLimiterManager(): RateLimiterManager {
  if (!globalManager) {
    globalManager = new RateLimiterManager();
  }
  return globalManager;
}

/**
 * Helper to create a rate-limited wrapper for an API client method
 */
export function withRateLimit<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  limiterName: string,
  config: RateLimiterConfig,
): T {
  const manager = getRateLimiterManager();
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    return manager.execute(limiterName, config, () =>
      fn(...args) as Promise<ReturnType<T>>,
    );
  }) as T;
}
