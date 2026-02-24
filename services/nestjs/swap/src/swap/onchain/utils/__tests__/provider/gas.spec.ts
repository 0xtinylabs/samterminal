/**
 * gas.ts Unit Tests
 * Gas hesaplama testleri
 */

// Mock RPC provider with factory function
jest.mock('@/swap/onchain/utils/provider', () => {
  const mockGetFeeData = jest.fn().mockResolvedValue({
    gasPrice: BigInt('1000000000'), // 1 gwei
    maxFeePerGas: BigInt('2000000000'), // 2 gwei
    maxPriorityFeePerGas: BigInt('100000000'), // 0.1 gwei
  });

  return {
    RPC: {
      rpcProvider: {
        getFeeData: mockGetFeeData,
      },
    },
    __mockGetFeeData: mockGetFeeData,
  };
});

import { getGasInformation, GAS_LIMIT } from '@/swap/onchain/utils/provider/gas';

describe('gas', () => {
  let mockGetFeeData: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Get reference to mock
    const { __mockGetFeeData } = require('@/swap/onchain/utils/provider');
    mockGetFeeData = __mockGetFeeData;

    // Reset to default mock response
    mockGetFeeData.mockResolvedValue({
      gasPrice: BigInt('1000000000'),
      maxFeePerGas: BigInt('2000000000'),
      maxPriorityFeePerGas: BigInt('100000000'),
    });
  });

  describe('GAS_LIMIT constant', () => {
    it('should be 6_000_000', () => {
      expect(GAS_LIMIT).toBe(6_000_000n);
    });

    it('should be a bigint', () => {
      expect(typeof GAS_LIMIT).toBe('bigint');
    });
  });

  describe('getGasInformation', () => {
    describe('with default gas limit', () => {
      it('should use default GAS_LIMIT when not provided', async () => {
        const result = await getGasInformation();

        expect(result.gasLimit).toBe(GAS_LIMIT);
      });

      it('should calculate gas as gasLimit * gasPrice', async () => {
        const result = await getGasInformation();

        const expectedGas = GAS_LIMIT * BigInt('1000000000');
        expect(result.gas).toBe(expectedGas);
      });
    });

    describe('with custom gas limit', () => {
      it('should use provided gas limit', async () => {
        const customLimit = BigInt('100000');
        const result = await getGasInformation(customLimit);

        expect(result.gasLimit).toBe(customLimit);
      });

      it('should calculate gas with custom limit', async () => {
        const customLimit = BigInt('100000');
        const result = await getGasInformation(customLimit);

        const expectedGas = customLimit * BigInt('1000000000');
        expect(result.gas).toBe(expectedGas);
      });
    });

    describe('returned data', () => {
      it('should return gasPrice from provider', async () => {
        const result = await getGasInformation();

        expect(result.gasPrice).toBe(BigInt('1000000000'));
      });

      it('should return maxFeePerGas from provider', async () => {
        const result = await getGasInformation();

        expect(result.maxFeePerGas).toBe(BigInt('2000000000'));
      });

      it('should return maxPriorityFeePerGas from provider', async () => {
        const result = await getGasInformation();

        expect(result.maxPriorityFeePerGas).toBe(BigInt('100000000'));
      });

      it('should return all required fields', async () => {
        const result = await getGasInformation();

        expect(result).toHaveProperty('gas');
        expect(result).toHaveProperty('gasPrice');
        expect(result).toHaveProperty('gasLimit');
        expect(result).toHaveProperty('maxFeePerGas');
        expect(result).toHaveProperty('maxPriorityFeePerGas');
      });
    });

    describe('null value handling', () => {
      it('should default gasPrice to 0n when null', async () => {
        mockGetFeeData.mockResolvedValue({
          gasPrice: null,
          maxFeePerGas: BigInt('2000000000'),
          maxPriorityFeePerGas: BigInt('100000000'),
        });

        const result = await getGasInformation();

        expect(result.gasPrice).toBe(0n);
        expect(result.gas).toBe(0n); // gasLimit * 0 = 0
      });

      it('should default maxFeePerGas to 0n when null', async () => {
        mockGetFeeData.mockResolvedValue({
          gasPrice: BigInt('1000000000'),
          maxFeePerGas: null,
          maxPriorityFeePerGas: BigInt('100000000'),
        });

        const result = await getGasInformation();

        expect(result.maxFeePerGas).toBe(0n);
      });

      it('should default maxPriorityFeePerGas to 0n when null', async () => {
        mockGetFeeData.mockResolvedValue({
          gasPrice: BigInt('1000000000'),
          maxFeePerGas: BigInt('2000000000'),
          maxPriorityFeePerGas: null,
        });

        const result = await getGasInformation();

        expect(result.maxPriorityFeePerGas).toBe(0n);
      });
    });

    describe('EIP-1559 support', () => {
      it('should support EIP-1559 gas fields', async () => {
        mockGetFeeData.mockResolvedValue({
          gasPrice: BigInt('1000000000'),
          maxFeePerGas: BigInt('3000000000'),
          maxPriorityFeePerGas: BigInt('500000000'),
        });

        const result = await getGasInformation();

        expect(result.maxFeePerGas).toBe(BigInt('3000000000'));
        expect(result.maxPriorityFeePerGas).toBe(BigInt('500000000'));
      });
    });

    describe('RPC provider integration', () => {
      it('should call rpcProvider.getFeeData', async () => {
        await getGasInformation();

        expect(mockGetFeeData).toHaveBeenCalledTimes(1);
      });

      it('should handle provider errors', async () => {
        mockGetFeeData.mockRejectedValue(new Error('RPC error'));

        await expect(getGasInformation()).rejects.toThrow('RPC error');
      });
    });

    describe('gas calculation accuracy', () => {
      it('should calculate correct gas for high gas price', async () => {
        const highGasPrice = BigInt('100000000000'); // 100 gwei
        mockGetFeeData.mockResolvedValue({
          gasPrice: highGasPrice,
          maxFeePerGas: null,
          maxPriorityFeePerGas: null,
        });

        const result = await getGasInformation();

        expect(result.gas).toBe(GAS_LIMIT * highGasPrice);
      });

      it('should handle very small gas prices', async () => {
        const lowGasPrice = BigInt('1'); // 1 wei
        mockGetFeeData.mockResolvedValue({
          gasPrice: lowGasPrice,
          maxFeePerGas: null,
          maxPriorityFeePerGas: null,
        });

        const result = await getGasInformation();

        expect(result.gas).toBe(GAS_LIMIT * lowGasPrice);
      });
    });
  });
});
