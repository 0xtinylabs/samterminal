/**
 * Helper utilities tests
 */


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
  it('should lowercase address', () => {
    expect(normalizeAddress('0xAbCdEf123456789012345678901234567890AbCd')).toBe(
      '0xabcdef123456789012345678901234567890abcd',
    );
  });
});

describe('isValidEvmAddress', () => {
  it('should return true for valid address', () => {
    expect(isValidEvmAddress('0x1234567890123456789012345678901234567890')).toBe(true);
  });

  it('should return false for invalid address', () => {
    expect(isValidEvmAddress('0x123')).toBe(false);
    expect(isValidEvmAddress('1234567890123456789012345678901234567890')).toBe(false);
    expect(isValidEvmAddress('0xGGGG567890123456789012345678901234567890')).toBe(false);
  });

  it('should handle uppercase addresses', () => {
    expect(isValidEvmAddress('0xABCDEF7890123456789012345678901234567890')).toBe(true);
  });
});

describe('isEnsName', () => {
  it('should return true for .eth domains', () => {
    expect(isEnsName('vitalik.eth')).toBe(true);
  });

  it('should return true for .xyz domains', () => {
    expect(isEnsName('example.xyz')).toBe(true);
  });

  it('should return false for regular addresses', () => {
    expect(isEnsName('0x1234567890123456789012345678901234567890')).toBe(false);
  });

  it('should return false for other domains', () => {
    expect(isEnsName('example.com')).toBe(false);
  });
});

describe('formatWei', () => {
  it('should format wei to ether with default decimals', () => {
    expect(formatWei('1000000000000000000')).toBe(1);
  });

  it('should format wei with custom decimals', () => {
    expect(formatWei('1000000', 6)).toBe(1);
  });

  it('should handle bigint input', () => {
    expect(formatWei(BigInt('2000000000000000000'))).toBe(2);
  });

  it('should handle zero', () => {
    expect(formatWei('0')).toBe(0);
  });

  it('should handle small values', () => {
    expect(formatWei('1000000000000000', 18)).toBe(0.001);
  });
});

describe('parseEther', () => {
  it('should parse number to wei', () => {
    expect(parseEther(1)).toBe(BigInt('1000000000000000000'));
  });

  it('should parse string to wei', () => {
    expect(parseEther('2.5')).toBe(BigInt('2500000000000000000'));
  });

  it('should handle zero', () => {
    expect(parseEther(0)).toBe(BigInt(0));
  });
});

describe('formatUsd', () => {
  it('should format small values with exponential', () => {
    expect(formatUsd(0.001)).toBe('$1.00e-3');
  });

  it('should format values less than 1', () => {
    expect(formatUsd(0.1234)).toBe('$0.1234');
  });

  it('should format regular values', () => {
    expect(formatUsd(123.45)).toBe('$123.45');
  });

  it('should format thousands', () => {
    expect(formatUsd(1234.56)).toBe('$1.23K');
  });

  it('should format millions', () => {
    expect(formatUsd(1234567)).toBe('$1.23M');
  });

  it('should format billions', () => {
    expect(formatUsd(1234567890)).toBe('$1.23B');
  });

  it('should handle zero', () => {
    expect(formatUsd(0)).toBe('$0.00');
  });
});

describe('formatTokenBalance', () => {
  it('should format zero balance', () => {
    expect(formatTokenBalance('0', 18)).toBe('0');
  });

  it('should format very small balances', () => {
    expect(formatTokenBalance('1', 18)).toMatch(/e/);
  });

  it('should format small balances', () => {
    expect(formatTokenBalance('100000000000000', 18)).toBe('0.000100');
  });

  it('should format thousands', () => {
    expect(formatTokenBalance('1500000000000000000000', 18)).toBe('1.50K');
  });

  it('should format millions', () => {
    expect(formatTokenBalance('1500000000000000000000000', 18)).toBe('1.50M');
  });

  it('should format billions', () => {
    expect(formatTokenBalance('1500000000000000000000000000', 18)).toBe('1.50B');
  });

  it('should respect maxDecimals', () => {
    expect(formatTokenBalance('100000000000000000', 18, 2)).toBe('0.10');
  });
});

describe('truncateAddress', () => {
  it('should truncate address with default chars', () => {
    expect(truncateAddress('0x1234567890123456789012345678901234567890')).toBe('0x1234...7890');
  });

  it('should truncate with custom chars', () => {
    expect(truncateAddress('0x1234567890123456789012345678901234567890', 6)).toBe('0x123456...567890');
  });

  it('should not truncate short addresses', () => {
    expect(truncateAddress('0x1234', 4)).toBe('0x1234');
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
  it('should return result on first success', async () => {
    const fn = jest.fn().mockResolvedValue('success');
    const result = await retry(fn);
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and succeed', async () => {
    const fn = jest.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce('success');

    const result = await retry(fn, { baseDelay: 1, maxDelay: 1 });

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should throw after max retries', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('always fail'));

    await expect(
      retry(fn, { maxRetries: 2, baseDelay: 1, maxDelay: 1 })
    ).rejects.toThrow('always fail');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should call onError callback', async () => {
    const fn = jest.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce('success');
    const onError = jest.fn();

    await retry(fn, { baseDelay: 1, maxDelay: 1, onError });

    expect(onError).toHaveBeenCalledWith(expect.any(Error), 1);
  });

  it('should respect maxDelay cap', async () => {
    // This test verifies that maxDelay caps the exponential backoff
    // baseDelay: 5000, maxDelay: 10 means delay will be capped at 10ms
    const fn = jest.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce('success');

    const result = await retry(fn, { maxRetries: 3, baseDelay: 5000, maxDelay: 10 });

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe('calculateChange', () => {
  it('should calculate positive change', () => {
    const result = calculateChange(110, 100);
    expect(result.change).toBe(10);
    expect(result.changePercent).toBe(10);
  });

  it('should calculate negative change', () => {
    const result = calculateChange(90, 100);
    expect(result.change).toBe(-10);
    expect(result.changePercent).toBe(-10);
  });

  it('should handle zero previous value', () => {
    const result = calculateChange(100, 0);
    expect(result.change).toBe(100);
    expect(result.changePercent).toBe(0);
  });
});

describe('sortTokensByValue', () => {
  const tokens = [
    { name: 'Token A', valueUsd: 100 },
    { name: 'Token B', valueUsd: 500 },
    { name: 'Token C', valueUsd: 200 },
  ];

  it('should sort descending by default', () => {
    const sorted = sortTokensByValue(tokens);
    expect(sorted[0].name).toBe('Token B');
    expect(sorted[1].name).toBe('Token C');
    expect(sorted[2].name).toBe('Token A');
  });

  it('should sort ascending when specified', () => {
    const sorted = sortTokensByValue(tokens, 'asc');
    expect(sorted[0].name).toBe('Token A');
    expect(sorted[1].name).toBe('Token C');
    expect(sorted[2].name).toBe('Token B');
  });

  it('should not mutate original array', () => {
    const original = [...tokens];
    sortTokensByValue(tokens);
    expect(tokens).toEqual(original);
  });
});
