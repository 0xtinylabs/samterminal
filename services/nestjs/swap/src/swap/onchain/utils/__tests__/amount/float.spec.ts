/**
 * float.ts Unit Tests
 * Float to BigInt dönüşüm testleri
 */

import { floatToBigInt } from '@/swap/onchain/utils/amount/float';

// Mock ethers
jest.mock('ethers', () => ({
  ethers: {
    parseUnits: jest.fn().mockImplementation((value: string, decimals: number | bigint) => {
      const dec = typeof decimals === 'bigint' ? Number(decimals) : decimals;
      return BigInt(Math.floor(parseFloat(value) * Math.pow(10, dec)));
    }),
  },
}));

describe('floatToBigInt', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('basic conversions', () => {
    it('should convert 1.0 to 1 ETH (18 decimals)', () => {
      const result = floatToBigInt(1.0, 18n);
      expect(result).toBe(BigInt('1000000000000000000'));
    });

    it('should convert 0.5 to 0.5 ETH', () => {
      const result = floatToBigInt(0.5, 18n);
      expect(result).toBe(BigInt('500000000000000000'));
    });

    it('should convert 1.5 to 1.5 ETH', () => {
      const result = floatToBigInt(1.5, 18n);
      expect(result).toBe(BigInt('1500000000000000000'));
    });

    it('should convert 0 to 0', () => {
      const result = floatToBigInt(0, 18n);
      expect(result).toBe(0n);
    });
  });

  describe('different decimal places', () => {
    it('should handle 6 decimals (USDC)', () => {
      const result = floatToBigInt(1.0, 6n);
      expect(result).toBe(BigInt('1000000'));
    });

    it('should handle 8 decimals (WBTC)', () => {
      const result = floatToBigInt(1.0, 8n);
      expect(result).toBe(BigInt('100000000'));
    });

    it('should handle 0 decimals', () => {
      const result = floatToBigInt(100.0, 0n);
      expect(result).toBe(BigInt('100'));
    });
  });

  describe('default decimals', () => {
    it('should use 18 decimals by default', () => {
      const { ethers } = require('ethers');
      floatToBigInt(1.0);

      expect(ethers.parseUnits).toHaveBeenCalledWith('1.000000000000000000', 18n);
    });
  });

  describe('decimal precision', () => {
    it('should handle values with many decimal places', () => {
      const result = floatToBigInt(0.123456789, 18n);
      // Result should be truncated to 18 decimals
      expect(result).toBeGreaterThan(0n);
    });

    it('should handle very small values', () => {
      const result = floatToBigInt(0.000001, 18n);
      expect(result).toBe(BigInt('1000000000000'));
    });

    it('should truncate to decimals precision', () => {
      // 1.123456 with 6 decimals should become 1123456
      const result = floatToBigInt(1.123456, 6n);
      expect(result).toBe(BigInt('1123456'));
    });
  });

  describe('large numbers', () => {
    it('should handle large float values', () => {
      const result = floatToBigInt(1000000, 18n);
      // Note: Floating point precision may cause slight variations
      expect(result).toBeGreaterThan(BigInt('999999000000000000000000'));
      expect(result).toBeLessThan(BigInt('1000001000000000000000000'));
    });

    it('should handle very large amounts', () => {
      const result = floatToBigInt(999999999, 6n);
      expect(result).toBeGreaterThan(BigInt('999999998000000'));
      expect(result).toBeLessThan(BigInt('1000000000000000'));
    });
  });

  describe('edge cases', () => {
    it('should handle integer values', () => {
      const result = floatToBigInt(5, 18n);
      expect(result).toBe(BigInt('5000000000000000000'));
    });

    it('should handle values less than 1 wei', () => {
      // Very small value that would be less than 1 wei
      const result = floatToBigInt(0.0000000000000000001, 18n);
      // Should floor to 0 since it's less than 1 wei
      expect(result).toBe(0n);
    });

    it('should return bigint type', () => {
      const result = floatToBigInt(1.5, 18n);
      expect(typeof result).toBe('bigint');
    });
  });

  describe('toFixed precision', () => {
    it('should use toFixed with decimal precision', () => {
      const { ethers } = require('ethers');
      floatToBigInt(1.5, 6n);

      // value.toFixed(6) should be called
      expect(ethers.parseUnits).toHaveBeenCalledWith('1.500000', 6n);
    });

    it('should handle floating point by using toFixed', () => {
      const { ethers } = require('ethers');
      // 0.1 + 0.2 = 0.30000000000000004 in JavaScript
      floatToBigInt(0.1 + 0.2, 18n);

      // toFixed is called with decimal precision
      const callArg = ethers.parseUnits.mock.calls[0][0];
      // Result should be a string starting with "0.3"
      expect(callArg.startsWith('0.3')).toBe(true);
    });
  });

  describe('ethers integration', () => {
    it('should call ethers.parseUnits with string value', () => {
      const { ethers } = require('ethers');

      floatToBigInt(1.234, 18n);

      expect(ethers.parseUnits).toHaveBeenCalledWith(
        expect.any(String),
        18n
      );
    });

    it('should pass bigint decimals to parseUnits', () => {
      const { ethers } = require('ethers');

      floatToBigInt(1.0, 8n);

      expect(ethers.parseUnits).toHaveBeenCalledWith(
        expect.any(String),
        8n
      );
    });
  });

  describe('negative values', () => {
    it('should handle negative values (theoretical)', () => {
      // While tokens don't have negative values, the function should handle it
      const result = floatToBigInt(-1.0, 18n);
      expect(result).toBe(BigInt('-1000000000000000000'));
    });
  });
});
