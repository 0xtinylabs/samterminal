/**
 * bigint.ts Unit Tests
 * BigInt to float dönüşüm testleri
 */

import { bigintToFloat } from '@/swap/onchain/utils/amount/bigint';

// Mock ethers
jest.mock('ethers', () => ({
  ethers: {
    formatUnits: jest.fn().mockImplementation((value: bigint, decimals: number) => {
      return (Number(value) / Math.pow(10, decimals)).toString();
    }),
  },
}));

describe('bigintToFloat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('basic conversions', () => {
    it('should convert 1 ETH (18 decimals) to 1.0', () => {
      const oneEther = BigInt('1000000000000000000');
      const result = bigintToFloat(oneEther, 18);
      expect(result).toBe(1);
    });

    it('should convert 0.5 ETH to 0.5', () => {
      const halfEther = BigInt('500000000000000000');
      const result = bigintToFloat(halfEther, 18);
      expect(result).toBe(0.5);
    });

    it('should convert 1.5 ETH to 1.5', () => {
      const oneAndHalf = BigInt('1500000000000000000');
      const result = bigintToFloat(oneAndHalf, 18);
      expect(result).toBe(1.5);
    });

    it('should convert 0 to 0', () => {
      const result = bigintToFloat(0n, 18);
      expect(result).toBe(0);
    });
  });

  describe('different decimal places', () => {
    it('should handle 6 decimals (USDC)', () => {
      const oneUSDC = BigInt('1000000'); // 1 USDC
      const result = bigintToFloat(oneUSDC, 6);
      expect(result).toBe(1);
    });

    it('should handle 8 decimals (WBTC)', () => {
      const oneWBTC = BigInt('100000000'); // 1 WBTC
      const result = bigintToFloat(oneWBTC, 8);
      expect(result).toBe(1);
    });

    it('should handle 0 decimals', () => {
      const wholeNumber = BigInt('100');
      const result = bigintToFloat(wholeNumber, 0);
      expect(result).toBe(100);
    });
  });

  describe('default decimals', () => {
    it('should use 18 decimals by default', () => {
      const { ethers } = require('ethers');
      const oneEther = BigInt('1000000000000000000');

      bigintToFloat(oneEther);

      expect(ethers.formatUnits).toHaveBeenCalledWith(oneEther, 18);
    });
  });

  describe('large numbers', () => {
    it('should handle large token amounts', () => {
      const largeAmount = BigInt('1000000000000000000000000'); // 1 million ETH
      const result = bigintToFloat(largeAmount, 18);
      expect(result).toBe(1000000);
    });

    it('should handle very small amounts', () => {
      const tinyAmount = BigInt('1'); // 1 wei
      const result = bigintToFloat(tinyAmount, 18);
      expect(result).toBe(1e-18);
    });
  });

  describe('precision', () => {
    it('should maintain precision for common amounts', () => {
      const amount = BigInt('123456789012345678'); // ~0.123 ETH
      const result = bigintToFloat(amount, 18);
      expect(result).toBeCloseTo(0.123456789012345678, 10);
    });
  });

  describe('edge cases', () => {
    it('should handle negative decimals gracefully', () => {
      // While not typical, function should handle it
      const amount = BigInt('100');
      // formatUnits with negative decimals would multiply instead of divide
      expect(() => bigintToFloat(amount, -1)).not.toThrow();
    });

    it('should return number type', () => {
      const result = bigintToFloat(BigInt('1000000000000000000'), 18);
      expect(typeof result).toBe('number');
    });
  });

  describe('ethers integration', () => {
    it('should call ethers.formatUnits with correct parameters', () => {
      const { ethers } = require('ethers');
      const amount = BigInt('1234567890');

      bigintToFloat(amount, 6);

      expect(ethers.formatUnits).toHaveBeenCalledWith(amount, 6);
    });
  });
});
