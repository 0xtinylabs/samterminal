/**
 * Utilities for @samterminal/plugin-tokendata
 */

export { Cache, createCacheKey } from './cache.js';
export { DexScreenerClient, type DexScreenerClientConfig } from './dexscreener.js';
export {
  CoinGeckoClient,
  type CoinGeckoClientConfig,
  type CoinGeckoSimplePrice,
  type CoinGeckoCoinMarket,
} from './coingecko.js';
export {
  MoralisClient,
  type MoralisClientConfig,
  type MoralisTokenMetadata,
  type MoralisTokenPrice,
  type MoralisTokenOwner,
  type MoralisSecurityData,
} from './moralis.js';

/**
 * Normalize address to lowercase
 */
export function normalizeAddress(address: string): string {
  return address.toLowerCase();
}

/**
 * Validate Ethereum address format
 */
export function isValidEvmAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Validate Solana address format
 */
export function isValidSolanaAddress(address: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
}

/**
 * Format large numbers for display
 */
export function formatNumber(value: number, decimals: number = 2): string {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(decimals)}B`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(decimals)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(decimals)}K`;
  }
  return value.toFixed(decimals);
}

/**
 * Format USD value
 */
export function formatUsd(value: number): string {
  if (value < 0.01) {
    return `$${value.toExponential(2)}`;
  }
  if (value < 1) {
    return `$${value.toFixed(4)}`;
  }
  return `$${formatNumber(value)}`;
}

/**
 * Format percentage
 */
export function formatPercentage(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

/**
 * Delay execution
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    onError?: (error: Error, attempt: number) => void;
  } = {},
): Promise<T> {
  const { maxRetries = 3, baseDelay = 1000, maxDelay = 10000, onError } = options;

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (onError) {
        onError(lastError, attempt);
      }

      if (attempt < maxRetries) {
        const delayMs = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
        await delay(delayMs);
      }
    }
  }

  throw lastError;
}
