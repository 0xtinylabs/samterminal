/**
 * Utilities for @samterminal/plugin-swap
 */

export { Cache, createCacheKey } from './cache.js';
export { ZeroXClient, createZeroXClient, type ZeroXClientConfig } from './zerox.js';
export {
  WalletManager,
  createWalletManager,
  floatToBigInt,
  bigIntToFloat,
  formatTokenAmount,
  type WalletManagerConfig,
} from './wallet.js';
export {
  generateNonce,
  generateDeadline,
  createPermit2Domain,
  createPermitMessage,
  createPermitWithWitnessMessage,
  createWitnessFromCallData,
  signPermit2,
  signPermitWithWitness,
  encodePermit2AndSwap,
  encodePermit2WithWitness,
  buildSecureSwapTransaction,
  type PermitData,
  type WitnessData,
  type SignedPermit,
} from './permit2.js';
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
 * Format basis points to percentage
 */
export function bpsToPercent(bps: number): number {
  return bps / 100;
}

/**
 * Format percentage to basis points
 */
export function percentToBps(percent: number): number {
  return Math.round(percent * 100);
}

/**
 * Calculate price impact
 */
export function calculatePriceImpact(
  inputAmount: number,
  outputAmount: number,
  spotPrice: number,
): number {
  const expectedOutput = inputAmount * spotPrice;
  if (expectedOutput === 0) return 0;

  return ((expectedOutput - outputAmount) / expectedOutput) * 100;
}

/**
 * Calculate minimum output after slippage
 */
export function calculateMinimumOutput(amount: string, slippageBps: number): string {
  const amountBigInt = BigInt(amount);
  const slippageFactor = BigInt(10000 - slippageBps);
  const minOutput = (amountBigInt * slippageFactor) / BigInt(10000);
  return minOutput.toString();
}

/**
 * Format gas price from wei to gwei
 */
export function weiToGwei(wei: bigint | string): number {
  const weiBigInt = typeof wei === 'string' ? BigInt(wei) : wei;
  return Number(weiBigInt) / 1e9;
}

/**
 * Format gas price from gwei to wei
 */
export function gweiToWei(gwei: number): bigint {
  return BigInt(Math.floor(gwei * 1e9));
}

/**
 * Validate private key format
 */
export function isValidPrivateKey(privateKey: string): boolean {
  // Should be 64 hex chars (32 bytes) with or without 0x prefix
  const cleaned = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;
  return /^[a-fA-F0-9]{64}$/.test(cleaned);
}

/**
 * Ensure private key has 0x prefix
 */
export function ensurePrivateKeyPrefix(privateKey: string): `0x${string}` {
  if (privateKey.startsWith('0x')) {
    return privateKey as `0x${string}`;
  }
  return `0x${privateKey}`;
}
