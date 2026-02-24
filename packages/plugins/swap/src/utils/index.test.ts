/**
 * Utility function tests
 */

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

import {
  normalizeAddress,
  isValidEvmAddress,
  delay,
  retry,
  bpsToPercent,
  percentToBps,
  calculatePriceImpact,
  calculateMinimumOutput,
  weiToGwei,
  gweiToWei,
  isValidPrivateKey,
  ensurePrivateKeyPrefix,
} from './index.js';

describe('normalizeAddress', () => {
  it('should lowercase an address', () => {
    const address = '0xABCDEF1234567890ABCDEF1234567890ABCDEF12';
    expect(normalizeAddress(address)).toBe(
      '0xabcdef1234567890abcdef1234567890abcdef12',
    );
  });

  it('should handle already lowercase addresses', () => {
    const address = '0xabcdef1234567890abcdef1234567890abcdef12';
    expect(normalizeAddress(address)).toBe(address);
  });

  it('should handle mixed case addresses', () => {
    const address = '0xAbCdEf1234567890aBcDeF1234567890AbCdEf12';
    expect(normalizeAddress(address)).toBe(
      '0xabcdef1234567890abcdef1234567890abcdef12',
    );
  });
});

describe('isValidEvmAddress', () => {
  it('should return true for valid addresses', () => {
    expect(isValidEvmAddress('0x1234567890123456789012345678901234567890')).toBe(
      true,
    );
    expect(isValidEvmAddress('0xabcdef1234567890abcdef1234567890abcdef12')).toBe(
      true,
    );
    expect(isValidEvmAddress('0xABCDEF1234567890ABCDEF1234567890ABCDEF12')).toBe(
      true,
    );
  });

  it('should return false for invalid addresses', () => {
    expect(isValidEvmAddress('')).toBe(false);
    expect(isValidEvmAddress('0x')).toBe(false);
    expect(isValidEvmAddress('0x123')).toBe(false);
    expect(isValidEvmAddress('1234567890123456789012345678901234567890')).toBe(
      false,
    );
    expect(isValidEvmAddress('0xGGGGGG1234567890123456789012345678901234')).toBe(
      false,
    );
    expect(
      isValidEvmAddress('0x12345678901234567890123456789012345678901'),
    ).toBe(false); // Too long
    expect(isValidEvmAddress('0x123456789012345678901234567890123456789')).toBe(
      false,
    ); // Too short
  });
});

describe('delay', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should resolve after specified time', async () => {
    const promise = delay(1000);
    jest.advanceTimersByTime(1000);
    await expect(promise).resolves.toBeUndefined();
  });

  it('should not resolve before specified time', async () => {
    let resolved = false;
    delay(1000).then(() => {
      resolved = true;
    });

    jest.advanceTimersByTime(500);
    await Promise.resolve(); // Flush microtasks
    expect(resolved).toBe(false);

    jest.advanceTimersByTime(500);
    await Promise.resolve();
    expect(resolved).toBe(true);
  });
});

describe('retry', () => {
  it('should return result on first success', async () => {
    const fn = jest.fn().mockResolvedValue('success' as never);
    const result = await retry(fn);
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and eventually succeed', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error('fail1') as never)
      .mockRejectedValueOnce(new Error('fail2') as never)
      .mockResolvedValue('success' as never);

    const result = await retry(fn, { maxRetries: 3, baseDelay: 1, maxDelay: 1 });

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should throw after max retries', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('persistent failure') as never);

    await expect(
      retry(fn, { maxRetries: 2, baseDelay: 1, maxDelay: 1 })
    ).rejects.toThrow('persistent failure');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should call onError callback', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('fail') as never);
    const onError = jest.fn();

    await expect(
      retry(fn, { maxRetries: 2, baseDelay: 1, maxDelay: 1, onError })
    ).rejects.toThrow();

    expect(onError).toHaveBeenCalledTimes(2);
    expect(onError).toHaveBeenCalledWith(expect.any(Error), 1);
    expect(onError).toHaveBeenCalledWith(expect.any(Error), 2);
  });

  it('should respect maxDelay cap', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error('fail') as never)
      .mockResolvedValue('success' as never);

    const result = await retry(fn, {
      maxRetries: 4,
      baseDelay: 5000, // Would be very slow without maxDelay
      maxDelay: 10, // But capped to 10ms
    });

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should handle non-Error thrown values', async () => {
    const fn = jest.fn().mockRejectedValue('string error' as never);

    await expect(
      retry(fn, { maxRetries: 1, baseDelay: 1, maxDelay: 1 })
    ).rejects.toThrow('string error');
  });
});

describe('bpsToPercent', () => {
  it('should convert basis points to percentage', () => {
    expect(bpsToPercent(100)).toBe(1);
    expect(bpsToPercent(50)).toBe(0.5);
    expect(bpsToPercent(10000)).toBe(100);
    expect(bpsToPercent(0)).toBe(0);
    expect(bpsToPercent(1)).toBe(0.01);
  });
});

describe('percentToBps', () => {
  it('should convert percentage to basis points', () => {
    expect(percentToBps(1)).toBe(100);
    expect(percentToBps(0.5)).toBe(50);
    expect(percentToBps(100)).toBe(10000);
    expect(percentToBps(0)).toBe(0);
    expect(percentToBps(0.01)).toBe(1);
  });

  it('should round to nearest integer', () => {
    expect(percentToBps(0.005)).toBe(1);
    expect(percentToBps(0.004)).toBe(0);
  });
});

describe('calculatePriceImpact', () => {
  it('should calculate price impact correctly', () => {
    // If spot price is 1:1 and we get less output, there's impact
    expect(calculatePriceImpact(100, 99, 1)).toBeCloseTo(1, 5);
    expect(calculatePriceImpact(100, 95, 1)).toBeCloseTo(5, 5);
    expect(calculatePriceImpact(100, 100, 1)).toBeCloseTo(0, 5);
  });

  it('should handle different spot prices', () => {
    // 1 ETH should get 3000 USDC, but only gets 2970
    expect(calculatePriceImpact(1, 2970, 3000)).toBeCloseTo(1, 5);
  });

  it('should return 0 for zero expected output', () => {
    expect(calculatePriceImpact(100, 50, 0)).toBe(0);
  });

  it('should handle negative impact (bonus)', () => {
    // Getting more than expected is negative impact (good for user)
    expect(calculatePriceImpact(100, 101, 1)).toBeCloseTo(-1, 5);
  });
});

describe('calculateMinimumOutput', () => {
  it('should calculate minimum output with slippage', () => {
    // 100 with 1% slippage = 99
    expect(calculateMinimumOutput('100', 100)).toBe('99');

    // 1000000 with 0.5% slippage = 995000
    expect(calculateMinimumOutput('1000000', 50)).toBe('995000');

    // 10000 with 0% slippage = 10000
    expect(calculateMinimumOutput('10000', 0)).toBe('10000');
  });

  it('should handle large amounts', () => {
    const largeAmount = '1000000000000000000'; // 1e18
    expect(calculateMinimumOutput(largeAmount, 100)).toBe('990000000000000000');
  });
});

describe('weiToGwei', () => {
  it('should convert wei to gwei', () => {
    expect(weiToGwei(BigInt('1000000000'))).toBe(1);
    expect(weiToGwei(BigInt('20000000000'))).toBe(20);
    expect(weiToGwei(BigInt('500000000'))).toBe(0.5);
  });

  it('should handle string input', () => {
    expect(weiToGwei('1000000000')).toBe(1);
    expect(weiToGwei('20000000000')).toBe(20);
  });
});

describe('gweiToWei', () => {
  it('should convert gwei to wei', () => {
    expect(gweiToWei(1)).toBe(BigInt('1000000000'));
    expect(gweiToWei(20)).toBe(BigInt('20000000000'));
    expect(gweiToWei(0.5)).toBe(BigInt('500000000'));
  });

  it('should floor decimal values', () => {
    expect(gweiToWei(1.5)).toBe(BigInt('1500000000'));
    expect(gweiToWei(1.999999999)).toBe(BigInt('1999999999'));
  });
});

describe('isValidPrivateKey', () => {
  it('should return true for valid private keys', () => {
    // 64 hex chars with 0x prefix
    expect(
      isValidPrivateKey(
        '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
      ),
    ).toBe(true);
    // 64 hex chars without prefix
    expect(
      isValidPrivateKey(
        'ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
      ),
    ).toBe(true);
    // Uppercase
    expect(
      isValidPrivateKey(
        '0xAC0974BEC39A17E36BA4A6B4D238FF944BACB478CBED5EFCAE784D7BF4F2FF80',
      ),
    ).toBe(true);
  });

  it('should return false for invalid private keys', () => {
    expect(isValidPrivateKey('')).toBe(false);
    expect(isValidPrivateKey('0x')).toBe(false);
    expect(isValidPrivateKey('0x123')).toBe(false);
    expect(isValidPrivateKey('not-a-private-key')).toBe(false);
    // Too short
    expect(
      isValidPrivateKey(
        '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff',
      ),
    ).toBe(false);
    // Too long
    expect(
      isValidPrivateKey(
        '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff8000',
      ),
    ).toBe(false);
    // Invalid chars
    expect(
      isValidPrivateKey(
        '0xgg0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
      ),
    ).toBe(false);
  });
});

describe('ensurePrivateKeyPrefix', () => {
  it('should add 0x prefix if missing', () => {
    expect(
      ensurePrivateKeyPrefix(
        'ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
      ),
    ).toBe(
      '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
    );
  });

  it('should keep existing 0x prefix', () => {
    expect(
      ensurePrivateKeyPrefix(
        '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
      ),
    ).toBe(
      '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
    );
  });

  it('should return correct type', () => {
    const result = ensurePrivateKeyPrefix('abc123');
    expect(result.startsWith('0x')).toBe(true);
  });
});
