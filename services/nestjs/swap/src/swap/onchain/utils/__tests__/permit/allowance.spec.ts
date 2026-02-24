/**
 * allowance.ts Unit Tests
 * Token allowance kontrolü ve approval işlemi testleri
 */

import { allowance } from '@/swap/onchain/utils/permit/allowance';
import { Wallet } from 'ethers';

// Mock dependencies
jest.mock('viem', () => ({
  maxUint256: BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'),
}));

jest.mock('@/config/config', () => ({
  CONFIG: {
    swap: {
      permit2: '0x000000000022D473030F116dDEE9F6B43aC78BA3',
    },
  },
}));

// Mock internal utilities
const mockTokenFunctions = {
  allowance: jest.fn(),
  approve: jest.fn(),
};

jest.mock('@/swap/onchain/utils', () => ({
  TOKEN: {
    tokenContract: jest.fn().mockReturnValue({}),
    tokenFunctions: jest.fn().mockReturnValue({
      allowance: jest.fn().mockResolvedValue(0n),
      approve: jest.fn().mockResolvedValue({
        wait: jest.fn().mockResolvedValue({}),
      }),
    }),
  },
}));

describe('allowance', () => {
  const TEST_TOKEN = '0x1234567890abcdef1234567890abcdef12345678';
  const PERMIT2_ADDRESS = '0x000000000022D473030F116dDEE9F6B43aC78BA3';

  let mockWallet: Partial<Wallet>;
  let mockBeforeSending: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockWallet = {
      address: '0xTestWalletAddress1234567890abcdef12345678',
    };

    mockBeforeSending = jest.fn().mockResolvedValue(undefined);
  });

  describe('allowance check', () => {
    it('should call tokenFunctions.allowance with wallet address and permit2', async () => {
      const { TOKEN } = require('@/swap/onchain/utils');
      const mockAllowance = jest.fn().mockResolvedValue(0n);

      TOKEN.tokenFunctions.mockReturnValue({
        allowance: mockAllowance,
        approve: jest.fn().mockResolvedValue({ wait: jest.fn() }),
      });

      await allowance(TEST_TOKEN, mockWallet as Wallet, mockBeforeSending);

      expect(mockAllowance).toHaveBeenCalledWith(mockWallet.address, PERMIT2_ADDRESS);
    });

    it('should create token contract with token address and wallet', async () => {
      const { TOKEN } = require('@/swap/onchain/utils');

      TOKEN.tokenFunctions.mockReturnValue({
        allowance: jest.fn().mockResolvedValue(0n),
        approve: jest.fn().mockResolvedValue({ wait: jest.fn() }),
      });

      await allowance(TEST_TOKEN, mockWallet as Wallet, mockBeforeSending);

      expect(TOKEN.tokenContract).toHaveBeenCalledWith(TEST_TOKEN, mockWallet);
    });
  });

  describe('approval flow', () => {
    it('should call approve when allowance is 0', async () => {
      const { TOKEN } = require('@/swap/onchain/utils');
      const { maxUint256 } = require('viem');

      const mockApprove = jest.fn().mockResolvedValue({
        wait: jest.fn().mockResolvedValue({}),
      });

      TOKEN.tokenFunctions.mockReturnValue({
        allowance: jest.fn().mockResolvedValue(0n),
        approve: mockApprove,
      });

      await allowance(TEST_TOKEN, mockWallet as Wallet, mockBeforeSending);

      expect(mockApprove).toHaveBeenCalledWith(PERMIT2_ADDRESS, maxUint256);
    });

    it('should call approve when allowance is less than maxUint256', async () => {
      const { TOKEN } = require('@/swap/onchain/utils');
      const { maxUint256 } = require('viem');

      const partialAllowance = BigInt('1000000000000000000'); // 1 token
      const mockApprove = jest.fn().mockResolvedValue({
        wait: jest.fn().mockResolvedValue({}),
      });

      TOKEN.tokenFunctions.mockReturnValue({
        allowance: jest.fn().mockResolvedValue(partialAllowance),
        approve: mockApprove,
      });

      await allowance(TEST_TOKEN, mockWallet as Wallet, mockBeforeSending);

      expect(mockApprove).toHaveBeenCalledWith(PERMIT2_ADDRESS, maxUint256);
    });

    it('should NOT call approve when allowance equals maxUint256', async () => {
      const { TOKEN } = require('@/swap/onchain/utils');
      const { maxUint256 } = require('viem');

      const mockApprove = jest.fn();

      TOKEN.tokenFunctions.mockReturnValue({
        allowance: jest.fn().mockResolvedValue(maxUint256),
        approve: mockApprove,
      });

      await allowance(TEST_TOKEN, mockWallet as Wallet, mockBeforeSending);

      expect(mockApprove).not.toHaveBeenCalled();
    });

    it('should wait for transaction confirmation', async () => {
      const { TOKEN } = require('@/swap/onchain/utils');

      const mockWait = jest.fn().mockResolvedValue({});
      const mockApprove = jest.fn().mockResolvedValue({
        wait: mockWait,
      });

      TOKEN.tokenFunctions.mockReturnValue({
        allowance: jest.fn().mockResolvedValue(0n),
        approve: mockApprove,
      });

      await allowance(TEST_TOKEN, mockWallet as Wallet, mockBeforeSending);

      expect(mockWait).toHaveBeenCalled();
    });
  });

  describe('beforeSending callback', () => {
    it('should call beforeSending callback before approve', async () => {
      const { TOKEN } = require('@/swap/onchain/utils');

      const callOrder: string[] = [];

      mockBeforeSending.mockImplementation(async () => {
        callOrder.push('beforeSending');
      });

      const mockApprove = jest.fn().mockImplementation(async () => {
        callOrder.push('approve');
        return { wait: jest.fn() };
      });

      TOKEN.tokenFunctions.mockReturnValue({
        allowance: jest.fn().mockResolvedValue(0n),
        approve: mockApprove,
      });

      await allowance(TEST_TOKEN, mockWallet as Wallet, mockBeforeSending);

      expect(callOrder).toEqual(['beforeSending', 'approve']);
    });

    it('should call beforeSending only when approval is needed', async () => {
      const { TOKEN } = require('@/swap/onchain/utils');
      const { maxUint256 } = require('viem');

      TOKEN.tokenFunctions.mockReturnValue({
        allowance: jest.fn().mockResolvedValue(maxUint256),
        approve: jest.fn(),
      });

      await allowance(TEST_TOKEN, mockWallet as Wallet, mockBeforeSending);

      expect(mockBeforeSending).not.toHaveBeenCalled();
    });

    it('should handle beforeSending being undefined', async () => {
      const { TOKEN } = require('@/swap/onchain/utils');

      TOKEN.tokenFunctions.mockReturnValue({
        allowance: jest.fn().mockResolvedValue(0n),
        approve: jest.fn().mockResolvedValue({ wait: jest.fn() }),
      });

      // Should not throw when beforeSending is called via optional chaining
      await expect(
        allowance(TEST_TOKEN, mockWallet as Wallet, undefined as any)
      ).resolves.not.toThrow();
    });
  });

  describe('error handling', () => {
    it('should throw error when approval fails', async () => {
      const { TOKEN } = require('@/swap/onchain/utils');

      TOKEN.tokenFunctions.mockReturnValue({
        allowance: jest.fn().mockResolvedValue(0n),
        approve: jest.fn().mockRejectedValue(new Error('Approval failed')),
      });

      await expect(
        allowance(TEST_TOKEN, mockWallet as Wallet, mockBeforeSending)
      ).rejects.toThrow('Token approval failed: Approval failed');
    });

    it('should throw error with message when TX fails', async () => {
      const { TOKEN } = require('@/swap/onchain/utils');

      TOKEN.tokenFunctions.mockReturnValue({
        allowance: jest.fn().mockResolvedValue(0n),
        approve: jest.fn().mockRejectedValue(new Error('TX failed')),
      });

      await expect(
        allowance(TEST_TOKEN, mockWallet as Wallet, mockBeforeSending)
      ).rejects.toThrow('Token approval failed: TX failed');
    });

    it('should throw error when wait() rejects', async () => {
      const { TOKEN } = require('@/swap/onchain/utils');

      TOKEN.tokenFunctions.mockReturnValue({
        allowance: jest.fn().mockResolvedValue(0n),
        approve: jest.fn().mockResolvedValue({
          wait: jest.fn().mockRejectedValue(new Error('Transaction reverted')),
        }),
      });

      await expect(
        allowance(TEST_TOKEN, mockWallet as Wallet, mockBeforeSending)
      ).rejects.toThrow('Token approval failed: Transaction reverted');
    });
  });

  describe('approval parameters', () => {
    it('should approve permit2 contract address', async () => {
      const { TOKEN } = require('@/swap/onchain/utils');

      const mockApprove = jest.fn().mockResolvedValue({ wait: jest.fn() });

      TOKEN.tokenFunctions.mockReturnValue({
        allowance: jest.fn().mockResolvedValue(0n),
        approve: mockApprove,
      });

      await allowance(TEST_TOKEN, mockWallet as Wallet, mockBeforeSending);

      const [spender] = mockApprove.mock.calls[0];
      expect(spender).toBe(PERMIT2_ADDRESS);
    });

    it('should approve maxUint256 amount (unlimited)', async () => {
      const { TOKEN } = require('@/swap/onchain/utils');
      const { maxUint256 } = require('viem');

      const mockApprove = jest.fn().mockResolvedValue({ wait: jest.fn() });

      TOKEN.tokenFunctions.mockReturnValue({
        allowance: jest.fn().mockResolvedValue(0n),
        approve: mockApprove,
      });

      await allowance(TEST_TOKEN, mockWallet as Wallet, mockBeforeSending);

      const [, amount] = mockApprove.mock.calls[0];
      expect(amount).toBe(maxUint256);
    });
  });

  describe('different allowance states', () => {
    it('should approve when allowance is very small', async () => {
      const { TOKEN } = require('@/swap/onchain/utils');

      const mockApprove = jest.fn().mockResolvedValue({ wait: jest.fn() });

      TOKEN.tokenFunctions.mockReturnValue({
        allowance: jest.fn().mockResolvedValue(1n), // 1 wei
        approve: mockApprove,
      });

      await allowance(TEST_TOKEN, mockWallet as Wallet, mockBeforeSending);

      expect(mockApprove).toHaveBeenCalled();
    });

    it('should approve when allowance is large but not max', async () => {
      const { TOKEN } = require('@/swap/onchain/utils');
      const { maxUint256 } = require('viem');

      const largeAllowance = maxUint256 - 1n;
      const mockApprove = jest.fn().mockResolvedValue({ wait: jest.fn() });

      TOKEN.tokenFunctions.mockReturnValue({
        allowance: jest.fn().mockResolvedValue(largeAllowance),
        approve: mockApprove,
      });

      await allowance(TEST_TOKEN, mockWallet as Wallet, mockBeforeSending);

      expect(mockApprove).toHaveBeenCalled();
    });
  });
});
