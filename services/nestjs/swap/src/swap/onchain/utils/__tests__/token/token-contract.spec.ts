/**
 * token-contract.ts Unit Tests
 * Token contract oluşturma testleri
 */

// Mock dependencies before import
const mockContract = {
  name: jest.fn().mockResolvedValue('Test Token'),
  symbol: jest.fn().mockResolvedValue('TEST'),
  decimals: jest.fn().mockResolvedValue(18n),
  balanceOf: jest.fn().mockResolvedValue(BigInt('1000000000000000000')),
  connect: jest.fn().mockReturnThis(),
};

const mockRpcProvider = {
  getBalance: jest.fn(),
};

const mockErc20Abi = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function balanceOf(address) view returns (uint256)',
];

jest.mock('ethers', () => ({
  ethers: {
    Contract: jest.fn().mockImplementation(() => mockContract),
  },
  Wallet: jest.fn(),
}));

jest.mock('@/swap/onchain/utils/provider', () => ({
  RPC: {
    rpcProvider: mockRpcProvider,
  },
}));

jest.mock('@/web3/abi', () => ({
  ABI: {
    JSON: {
      erc20: mockErc20Abi,
    },
  },
}));

import { tokenContract } from '@/swap/onchain/utils/token/token-contract';
import { Wallet } from 'ethers';

describe('tokenContract', () => {
  const TEST_TOKEN_ADDRESS = '0x1234567890abcdef1234567890abcdef12345678';

  let mockWallet: Partial<Wallet>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockWallet = {
      address: '0xWalletAddress1234567890abcdef123456789012',
    };
  });

  describe('contract creation', () => {
    it('should create ethers.Contract with token address', () => {
      const { ethers } = require('ethers');

      tokenContract(TEST_TOKEN_ADDRESS);

      expect(ethers.Contract).toHaveBeenCalledWith(
        TEST_TOKEN_ADDRESS,
        expect.any(Object),
        expect.anything()
      );
    });

    it('should use ERC20 ABI', () => {
      const { ethers } = require('ethers');

      tokenContract(TEST_TOKEN_ADDRESS);

      expect(ethers.Contract).toHaveBeenCalledWith(
        expect.any(String),
        mockErc20Abi,
        expect.anything()
      );
    });

    it('should return contract instance', () => {
      const result = tokenContract(TEST_TOKEN_ADDRESS);

      expect(result).toBe(mockContract);
    });
  });

  describe('without wallet', () => {
    it('should use rpcProvider when no wallet provided', () => {
      const { ethers } = require('ethers');

      tokenContract(TEST_TOKEN_ADDRESS);

      expect(ethers.Contract).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        mockRpcProvider
      );
    });

    it('should not call connect when no wallet', () => {
      tokenContract(TEST_TOKEN_ADDRESS);

      expect(mockContract.connect).not.toHaveBeenCalled();
    });
  });

  describe('with wallet', () => {
    it('should use wallet as provider when provided', () => {
      const { ethers } = require('ethers');

      tokenContract(TEST_TOKEN_ADDRESS, mockWallet as Wallet);

      expect(ethers.Contract).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        mockWallet
      );
    });

    it('should call connect with wallet', () => {
      tokenContract(TEST_TOKEN_ADDRESS, mockWallet as Wallet);

      expect(mockContract.connect).toHaveBeenCalledWith(mockWallet);
    });
  });

  describe('edge cases', () => {
    it('should handle undefined wallet parameter', () => {
      const { ethers } = require('ethers');

      tokenContract(TEST_TOKEN_ADDRESS, undefined);

      expect(ethers.Contract).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        mockRpcProvider
      );
    });

    it('should handle different token addresses', () => {
      const { ethers } = require('ethers');
      const anotherToken = '0xabcdef1234567890abcdef1234567890abcdef12';

      tokenContract(anotherToken);

      expect(ethers.Contract).toHaveBeenCalledWith(
        anotherToken,
        expect.any(Object),
        expect.anything()
      );
    });
  });
});
