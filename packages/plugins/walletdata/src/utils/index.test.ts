/**
 * WalletData Utils tests
 */

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

import {
  normalizeAddress,
  isValidEvmAddress,
  isEnsName,
  formatWei,
  parseEther,
  formatUsd,
  formatTokenBalance,
  truncateAddress,
  delay,
  retry,
  calculateChange,
  sortTokensByValue,
} from './index.js';

describe('normalizeAddress', () => {
  it('should convert address to lowercase', () => {
    const address = '0xAbCdEf1234567890AbCdEf1234567890AbCdEf12';
    expect(normalizeAddress(address)).toBe(address.toLowerCase());
  });

  it('should not change already lowercase address', () => {
    const address = '0xabcdef1234567890abcdef1234567890abcdef12';
    expect(normalizeAddress(address)).toBe(address);
  });
});

describe('isValidEvmAddress', () => {
  it('should return true for valid address', () => {
    expect(isValidEvmAddress('0xAbCdEf1234567890AbCdEf1234567890AbCdEf12')).toBe(true);
  });

  it('should return true for lowercase address', () => {
    expect(isValidEvmAddress('0xabcdef1234567890abcdef1234567890abcdef12')).toBe(true);
  });

  it('should return false for address without 0x', () => {
    expect(isValidEvmAddress('AbCdEf1234567890AbCdEf1234567890AbCdEf12')).toBe(false);
  });

  it('should return false for short address', () => {
    expect(isValidEvmAddress('0x1234')).toBe(false);
  });

  it('should return false for long address', () => {
    expect(isValidEvmAddress('0x' + '1'.repeat(50))).toBe(false);
  });

  it('should return false for non-hex characters', () => {
    expect(isValidEvmAddress('0xGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG')).toBe(false);
  });
});

describe('isEnsName', () => {
  it('should return true for .eth domain', () => {
    expect(isEnsName('vitalik.eth')).toBe(true);
  });

  it('should return true for .xyz domain', () => {
    expect(isEnsName('test.xyz')).toBe(true);
  });

  it('should return false for regular address', () => {
    expect(isEnsName('0x1234567890123456789012345678901234567890')).toBe(false);
  });

  it('should return false for other domains', () => {
    expect(isEnsName('test.com')).toBe(false);
  });
});

describe('formatWei', () => {
  it('should convert wei to ether', () => {
    expect(formatWei('1000000000000000000')).toBe(1);
  });

  it('should handle bigint input', () => {
    expect(formatWei(1000000000000000000n)).toBe(1);
  });

  it('should handle custom decimals', () => {
    expect(formatWei('1000000', 6)).toBe(1);
  });

  it('should handle zero', () => {
    expect(formatWei('0')).toBe(0);
  });

  it('should handle small values', () => {
    expect(formatWei('1000000000')).toBe(0.000000001);
  });
});

describe('parseEther', () => {
  it('should convert ether to wei', () => {
    expect(parseEther(1)).toBe(1000000000000000000n);
  });

  it('should handle string input', () => {
    expect(parseEther('1')).toBe(1000000000000000000n);
  });

  it('should handle decimal values', () => {
    expect(parseEther(0.5)).toBe(500000000000000000n);
  });

  it('should handle zero', () => {
    expect(parseEther(0)).toBe(0n);
  });
});

describe('formatUsd', () => {
  it('should format zero', () => {
    expect(formatUsd(0)).toBe('$0.00');
  });

  it('should format small values in exponential', () => {
    expect(formatUsd(0.001)).toBe('$1.00e-3');
  });

  it('should format very small values in exponential', () => {
    expect(formatUsd(0.000001)).toBe('$1.00e-6');
  });

  it('should format values under 1', () => {
    expect(formatUsd(0.1234)).toBe('$0.1234');
  });

  it('should format normal values', () => {
    expect(formatUsd(123.45)).toBe('$123.45');
  });

  it('should format thousands with K', () => {
    expect(formatUsd(1234)).toBe('$1.23K');
  });

  it('should format millions with M', () => {
    expect(formatUsd(1234567)).toBe('$1.23M');
  });

  it('should format billions with B', () => {
    expect(formatUsd(1234567890)).toBe('$1.23B');
  });
});

describe('formatTokenBalance', () => {
  it('should format zero balance', () => {
    expect(formatTokenBalance('0', 18)).toBe('0');
  });

  it('should format small balance in exponential', () => {
    expect(formatTokenBalance('100', 18)).toContain('e');
  });

  it('should format normal balance', () => {
    expect(formatTokenBalance('1000000000000000000', 18)).toBe('1.00');
  });

  it('should format large balance with K', () => {
    expect(formatTokenBalance('1500000000000000000000', 18)).toBe('1.50K');
  });

  it('should format millions with M', () => {
    expect(formatTokenBalance('1500000000000000000000000', 18)).toBe('1.50M');
  });

  it('should format billions with B', () => {
    expect(formatTokenBalance('1500000000000000000000000000', 18)).toBe('1.50B');
  });

  it('should respect custom decimals', () => {
    expect(formatTokenBalance('1000000', 6)).toBe('1.00');
  });

  it('should respect maxDecimals', () => {
    const result = formatTokenBalance('123456789012345678', 18, 4);
    expect(result).toBe('0.1235');
  });
});

describe('truncateAddress', () => {
  it('should truncate long address', () => {
    const address = '0x1234567890123456789012345678901234567890';
    expect(truncateAddress(address)).toBe('0x1234...7890');
  });

  it('should use custom char count', () => {
    const address = '0x1234567890123456789012345678901234567890';
    expect(truncateAddress(address, 6)).toBe('0x123456...567890');
  });

  it('should not truncate short address', () => {
    const address = '0x1234';
    expect(truncateAddress(address, 4)).toBe('0x1234');
  });
});

describe('delay', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should delay execution', async () => {
    const promise = delay(1000);
    jest.advanceTimersByTime(1000);
    await expect(promise).resolves.toBeUndefined();
  });
});

describe('retry', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return result on first success', async () => {
    const fn = jest.fn().mockResolvedValue('success' as never);
    const result = await retry(fn);
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error('fail') as never)
      .mockResolvedValue('success' as never);

    const promise = retry(fn, { maxRetries: 3, baseDelay: 100 });

    // Advance through first retry delay
    await jest.advanceTimersByTimeAsync(100);

    const result = await promise;
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should throw after max retries', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('always fail') as never);

    const promise = retry(fn, { maxRetries: 3, baseDelay: 100 });

    // Catch the rejection to prevent unhandled rejection warning
    promise.catch(() => {});

    // Advance through all retry delays
    await jest.advanceTimersByTimeAsync(100);
    await jest.advanceTimersByTimeAsync(200);

    await expect(promise).rejects.toThrow('always fail');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should call onError callback', async () => {
    const onError = jest.fn();
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error('fail') as never)
      .mockResolvedValue('success' as never);

    const promise = retry(fn, { maxRetries: 3, baseDelay: 100, onError });
    await jest.advanceTimersByTimeAsync(100);
    await promise;

    expect(onError).toHaveBeenCalledWith(expect.any(Error), 1);
  });

  it('should use exponential backoff', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error('fail 1') as never)
      .mockRejectedValueOnce(new Error('fail 2') as never)
      .mockResolvedValue('success' as never);

    const promise = retry(fn, { maxRetries: 3, baseDelay: 100, maxDelay: 1000 });

    // First retry: 100ms
    await jest.advanceTimersByTimeAsync(100);
    // Second retry: 200ms (100 * 2^1)
    await jest.advanceTimersByTimeAsync(200);

    const result = await promise;
    expect(result).toBe('success');
  });

  it('should respect maxDelay', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error('fail 1') as never)
      .mockRejectedValueOnce(new Error('fail 2') as never)
      .mockRejectedValueOnce(new Error('fail 3') as never)
      .mockResolvedValue('success' as never);

    const promise = retry(fn, { maxRetries: 4, baseDelay: 1000, maxDelay: 2000 });

    // First retry: 1000ms
    await jest.advanceTimersByTimeAsync(1000);
    // Second retry: 2000ms (capped by maxDelay)
    await jest.advanceTimersByTimeAsync(2000);
    // Third retry: 2000ms (capped by maxDelay)
    await jest.advanceTimersByTimeAsync(2000);

    const result = await promise;
    expect(result).toBe('success');
  });
});

describe('calculateChange', () => {
  it('should calculate positive change', () => {
    const result = calculateChange(150, 100);
    expect(result.change).toBe(50);
    expect(result.changePercent).toBe(50);
  });

  it('should calculate negative change', () => {
    const result = calculateChange(50, 100);
    expect(result.change).toBe(-50);
    expect(result.changePercent).toBe(-50);
  });

  it('should handle zero previous value', () => {
    const result = calculateChange(100, 0);
    expect(result.change).toBe(100);
    expect(result.changePercent).toBe(0);
  });

  it('should handle no change', () => {
    const result = calculateChange(100, 100);
    expect(result.change).toBe(0);
    expect(result.changePercent).toBe(0);
  });
});

describe('sortTokensByValue', () => {
  const tokens = [
    { symbol: 'A', valueUsd: 100 },
    { symbol: 'B', valueUsd: 500 },
    { symbol: 'C', valueUsd: 250 },
  ];

  it('should sort descending by default', () => {
    const sorted = sortTokensByValue(tokens);
    expect(sorted[0].symbol).toBe('B');
    expect(sorted[1].symbol).toBe('C');
    expect(sorted[2].symbol).toBe('A');
  });

  it('should sort ascending when specified', () => {
    const sorted = sortTokensByValue(tokens, 'asc');
    expect(sorted[0].symbol).toBe('A');
    expect(sorted[1].symbol).toBe('C');
    expect(sorted[2].symbol).toBe('B');
  });

  it('should not mutate original array', () => {
    const original = [...tokens];
    sortTokensByValue(tokens);
    expect(tokens).toEqual(original);
  });

  it('should handle empty array', () => {
    const sorted = sortTokensByValue([]);
    expect(sorted).toEqual([]);
  });
});
