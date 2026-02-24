/**
 * Utilities for @samterminal/plugin-walletdata
 */

export { Cache, createCacheKey } from './cache.js';
export { MoralisWalletClient, type MoralisWalletClientConfig } from './moralis.js';
export { RpcClient, type RpcClientConfig } from './rpc.js';

/**
 * Validate and normalize Ethereum address
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
 * Check if address is ENS name
 */
export function isEnsName(address: string): boolean {
  return address.endsWith('.eth') || address.endsWith('.xyz');
}

/**
 * Format wei to ether
 */
export function formatWei(wei: string | bigint, decimals: number = 18): number {
  const value = typeof wei === 'string' ? BigInt(wei) : wei;
  return Number(value) / Math.pow(10, decimals);
}

/**
 * Parse ether to wei
 */
export function parseEther(ether: number | string): bigint {
  const value = typeof ether === 'string' ? parseFloat(ether) : ether;
  return BigInt(Math.floor(value * 1e18));
}

/**
 * Format USD value
 */
export function formatUsd(value: number): string {
  if (value < 0.01) {
    return value > 0 ? `$${value.toExponential(2)}` : '$0.00';
  }
  if (value < 1) {
    return `$${value.toFixed(4)}`;
  }
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(2)}B`;
  }
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(2)}K`;
  }
  return `$${value.toFixed(2)}`;
}

/**
 * Format token balance
 */
export function formatTokenBalance(
  balance: string | bigint,
  decimals: number,
  maxDecimals: number = 6,
): string {
  const value = formatWei(balance, decimals);

  if (value === 0) return '0';
  if (value < 0.000001) return value.toExponential(2);
  if (value < 1) return value.toFixed(maxDecimals);
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(2)}K`;

  return value.toFixed(Math.min(maxDecimals, 2));
}

/**
 * Truncate address for display
 */
export function truncateAddress(address: string, chars: number = 4): string {
  if (address.length <= chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
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

/**
 * Calculate portfolio change
 */
export function calculateChange(
  currentValue: number,
  previousValue: number,
): { change: number; changePercent: number } {
  const change = currentValue - previousValue;
  const changePercent = previousValue > 0 ? (change / previousValue) * 100 : 0;

  return { change, changePercent };
}

/**
 * Sort tokens by value
 */
export function sortTokensByValue<T extends { valueUsd: number }>(
  tokens: T[],
  order: 'asc' | 'desc' = 'desc',
): T[] {
  return [...tokens].sort((a, b) =>
    order === 'desc' ? b.valueUsd - a.valueUsd : a.valueUsd - b.valueUsd,
  );
}
