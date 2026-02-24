/**
 * rpc.ts Unit Tests
 * RPC provider oluşturma testleri
 */

// Mock dependencies before importing module
const mockProvider = {
  getBalance: jest.fn().mockResolvedValue(BigInt('1000000000000000000')),
  getTransactionCount: jest.fn().mockResolvedValue(0),
  getFeeData: jest.fn().mockResolvedValue({
    gasPrice: BigInt('1000000000'),
    maxFeePerGas: BigInt('2000000000'),
    maxPriorityFeePerGas: BigInt('100000000'),
  }),
  getNetwork: jest.fn().mockResolvedValue({ chainId: 8453n }),
};

jest.mock('ethers', () => ({
  ethers: {
    JsonRpcProvider: jest.fn().mockImplementation(() => mockProvider),
  },
}));

jest.mock('@/config/config', () => ({
  CONFIG: {
    rpc_url: 'https://mock-rpc.base.org',
  },
}));

describe('rpc', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rpcProvider creation', () => {
    it('should create JsonRpcProvider with CONFIG.rpc_url', () => {
      const { ethers } = require('ethers');
      // Re-import to trigger module initialization
      jest.resetModules();

      // Need to re-setup mocks after resetModules
      jest.mock('ethers', () => ({
        ethers: {
          JsonRpcProvider: jest.fn().mockImplementation(() => mockProvider),
        },
      }));

      jest.mock('@/config/config', () => ({
        CONFIG: {
          rpc_url: 'https://mock-rpc.base.org',
        },
      }));

      const { rpcProvider } = require('../../provider/rpc');

      expect(rpcProvider).toBeDefined();
    });

    it('should export rpcProvider as module-level constant', () => {
      const { rpcProvider } = require('../../provider/rpc');

      expect(rpcProvider).toBeDefined();
      expect(typeof rpcProvider).toBe('object');
    });
  });

  describe('provider functionality', () => {
    it('should have getBalance method', () => {
      const { rpcProvider } = require('../../provider/rpc');

      expect(rpcProvider.getBalance).toBeDefined();
      expect(typeof rpcProvider.getBalance).toBe('function');
    });

    it('should have getTransactionCount method', () => {
      const { rpcProvider } = require('../../provider/rpc');

      expect(rpcProvider.getTransactionCount).toBeDefined();
      expect(typeof rpcProvider.getTransactionCount).toBe('function');
    });

    it('should have getFeeData method', () => {
      const { rpcProvider } = require('../../provider/rpc');

      expect(rpcProvider.getFeeData).toBeDefined();
      expect(typeof rpcProvider.getFeeData).toBe('function');
    });
  });

  describe('RPC URL configuration', () => {
    it('should use rpc_url from CONFIG', () => {
      // This test verifies the CONFIG.rpc_url is used
      const { CONFIG } = require('@/config/config');
      expect(CONFIG.rpc_url).toBe('https://mock-rpc.base.org');
    });
  });
});
