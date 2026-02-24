/**
 * Retry utilities for handling transient failures
 */

import type { RetryConfig } from '../types/index.js';

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  delayMs: 1000,
  backoffMultiplier: 2,
  maxDelayMs: 30000,
};

/**
 * Calculate delay for the next retry attempt
 */
export function calculateRetryDelay(
  attempt: number,
  config: RetryConfig,
): number {
  const baseDelay = config.delayMs;
  const multiplier = config.backoffMultiplier ?? 1;
  const delay = baseDelay * Math.pow(multiplier, attempt - 1);

  return config.maxDelayMs ? Math.min(delay, config.maxDelayMs) : delay;
}

/**
 * Sleep for a given duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {},
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < finalConfig.maxAttempts) {
        const delay = calculateRetryDelay(attempt, finalConfig);
        await sleep(delay);
      }
    }
  }

  throw lastError ?? new Error('Retry failed');
}

/**
 * Retry with custom condition for retryable errors
 */
export async function retryIf<T>(
  fn: () => Promise<T>,
  shouldRetry: (error: Error) => boolean,
  config: Partial<RetryConfig> = {},
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (!shouldRetry(lastError) || attempt >= finalConfig.maxAttempts) {
        throw lastError;
      }

      const delay = calculateRetryDelay(attempt, finalConfig);
      await sleep(delay);
    }
  }

  throw lastError ?? new Error('Retry failed');
}

/**
 * Create a retryable wrapper for a function
 */
export function withRetry<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  config: Partial<RetryConfig> = {},
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    return retry(() => fn(...args) as Promise<ReturnType<T>>, config);
  }) as T;
}

/**
 * Retry with timeout
 */
export async function retryWithTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  config: Partial<RetryConfig> = {},
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await retry(async () => {
      if (controller.signal.aborted) {
        throw new Error('Operation timed out');
      }
      return fn();
    }, config);
  } finally {
    clearTimeout(timeoutId);
  }
}
