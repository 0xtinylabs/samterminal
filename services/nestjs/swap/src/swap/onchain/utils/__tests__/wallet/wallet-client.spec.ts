/**
 * wallet-client.ts Unit Tests
 * Wallet ve client oluşturma testleri
 */

// Mock dependencies
const mockWallet = {
  address: '0xTestWalletAddress1234567890abcdef12345678',
  privateKey: '0x' + 'a'.repeat(64),
  connect: jest.fn().mockReturnThis(),
};

const mockAccount = {
  address: '0xTestWalletAddress1234567890abcdef12345678',
  signMessage: jest.fn(),
  signTypedData: jest.fn(),
};

const mockPublicClientInstance = {
  chain: { id: 8453, name: 'Base' },
  getBalance: jest.fn().mockResolvedValue(BigInt('1000000000000000000')),
};

const mockWalletClientInstance = {
  account: mockAccount,
  chain: { id: 8453, name: 'Base' },
  signTypedData: jest.fn().mockResolvedValue('0xsignature'),
  sendTransaction: jest.fn().mockResolvedValue('0xtxhash'),
};

const mockRpcProvider = {
  getBalance: jest.fn(),
  getTransactionCount: jest.fn(),
};

jest.mock('ethers', () => ({
  ethers: {
    Wallet: jest.fn().mockImplementation(() => mockWallet),
  },
}));

jest.mock('viem/accounts', () => ({
  privateKeyToAccount: jest.fn().mockReturnValue(mockAccount),
}));

jest.mock('viem', () => ({
  createPublicClient: jest.fn().mockReturnValue(mockPublicClientInstance),
  createWalletClient: jest.fn().mockReturnValue(mockWalletClientInstance),
  http: jest.fn().mockReturnValue('http-transport'),
}));

jest.mock('viem/chains', () => ({
  base: { id: 8453, name: 'Base' },
}));

jest.mock('@/swap/onchain/utils/provider', () => ({
  RPC: {
    rpcProvider: mockRpcProvider,
  },
}));

import { walletClient, walletAccount, publicClient, walletPublicClient } from '@/swap/onchain/utils/wallet/wallet-client';

describe('wallet-client', () => {
  const TEST_PRIVATE_KEY = '0x' + 'a'.repeat(64);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('walletClient', () => {
    it('should create ethers.Wallet with private key', () => {
      const { ethers } = require('ethers');

      walletClient(TEST_PRIVATE_KEY);

      expect(ethers.Wallet).toHaveBeenCalledWith(TEST_PRIVATE_KEY, mockRpcProvider);
    });

    it('should return wallet instance', () => {
      const result = walletClient(TEST_PRIVATE_KEY);

      expect(result).toBe(mockWallet);
    });

    it('should use RPC provider', () => {
      const { ethers } = require('ethers');

      walletClient(TEST_PRIVATE_KEY);

      const [, provider] = ethers.Wallet.mock.calls[0];
      expect(provider).toBe(mockRpcProvider);
    });
  });

  describe('walletAccount', () => {
    it('should create viem account from private key', () => {
      const { privateKeyToAccount } = require('viem/accounts');

      walletAccount(TEST_PRIVATE_KEY);

      expect(privateKeyToAccount).toHaveBeenCalledWith(TEST_PRIVATE_KEY);
    });

    it('should return account instance', () => {
      const result = walletAccount(TEST_PRIVATE_KEY);

      expect(result).toBe(mockAccount);
    });

    it('should cast private key to 0x-prefixed string', () => {
      const { privateKeyToAccount } = require('viem/accounts');
      const keyWithoutPrefix = 'a'.repeat(64);

      // Function casts to `0x${string}` type
      walletAccount('0x' + keyWithoutPrefix);

      expect(privateKeyToAccount).toHaveBeenCalledWith('0x' + keyWithoutPrefix);
    });
  });

  describe('publicClient', () => {
    it('should create viem publicClient', () => {
      const { createPublicClient } = require('viem');

      publicClient();

      expect(createPublicClient).toHaveBeenCalled();
    });

    it('should use Base chain', () => {
      const { createPublicClient } = require('viem');
      const { base } = require('viem/chains');

      publicClient();

      expect(createPublicClient).toHaveBeenCalledWith(
        expect.objectContaining({
          chain: base,
        })
      );
    });

    it('should use http transport', () => {
      const { createPublicClient, http } = require('viem');

      publicClient();

      expect(http).toHaveBeenCalled();
      expect(createPublicClient).toHaveBeenCalledWith(
        expect.objectContaining({
          transport: 'http-transport',
        })
      );
    });

    it('should return public client instance', () => {
      const result = publicClient();

      expect(result).toBe(mockPublicClientInstance);
    });
  });

  describe('walletPublicClient', () => {
    it('should create wallet account from private key', () => {
      const { privateKeyToAccount } = require('viem/accounts');

      walletPublicClient(TEST_PRIVATE_KEY);

      expect(privateKeyToAccount).toHaveBeenCalledWith(TEST_PRIVATE_KEY);
    });

    it('should create viem walletClient', () => {
      const { createWalletClient } = require('viem');

      walletPublicClient(TEST_PRIVATE_KEY);

      expect(createWalletClient).toHaveBeenCalled();
    });

    it('should use account derived from private key', () => {
      const { createWalletClient } = require('viem');

      walletPublicClient(TEST_PRIVATE_KEY);

      expect(createWalletClient).toHaveBeenCalledWith(
        expect.objectContaining({
          account: mockAccount,
        })
      );
    });

    it('should use Base chain', () => {
      const { createWalletClient } = require('viem');
      const { base } = require('viem/chains');

      walletPublicClient(TEST_PRIVATE_KEY);

      expect(createWalletClient).toHaveBeenCalledWith(
        expect.objectContaining({
          chain: base,
        })
      );
    });

    it('should use http transport', () => {
      const { createWalletClient, http } = require('viem');

      walletPublicClient(TEST_PRIVATE_KEY);

      expect(http).toHaveBeenCalled();
      expect(createWalletClient).toHaveBeenCalledWith(
        expect.objectContaining({
          transport: 'http-transport',
        })
      );
    });

    it('should return wallet client instance', () => {
      const result = walletPublicClient(TEST_PRIVATE_KEY);

      expect(result).toBe(mockWalletClientInstance);
    });
  });

  describe('error handling', () => {
    it('should propagate error for invalid private key in walletClient', () => {
      const { ethers } = require('ethers');
      ethers.Wallet.mockImplementationOnce(() => {
        throw new Error('Invalid private key');
      });

      expect(() => walletClient('invalid')).toThrow('Invalid private key');
    });

    it('should propagate error for invalid private key in walletAccount', () => {
      const { privateKeyToAccount } = require('viem/accounts');
      privateKeyToAccount.mockImplementationOnce(() => {
        throw new Error('Invalid private key format');
      });

      expect(() => walletAccount('invalid')).toThrow('Invalid private key format');
    });
  });

  describe('integration between functions', () => {
    it('walletClient and walletPublicClient should use same private key', () => {
      const { ethers } = require('ethers');
      const { privateKeyToAccount } = require('viem/accounts');

      walletClient(TEST_PRIVATE_KEY);
      walletPublicClient(TEST_PRIVATE_KEY);

      expect(ethers.Wallet.mock.calls[0][0]).toBe(TEST_PRIVATE_KEY);
      expect(privateKeyToAccount.mock.calls[0][0]).toBe(TEST_PRIVATE_KEY);
    });
  });
});
