/**
 * Approve action tests
 */


import { createApproveAction } from './approve.js';
import type { ActionContext } from '@samterminal/core';
import type { WalletManager } from '../utils/wallet.js';
import type { SwapPluginConfig, ApprovalRequest } from '../types/index.js';
import { maxUint256 } from 'viem';

describe('createApproveAction', () => {
  let mockWalletManager: WalletManager;
  let getWallet: () => WalletManager;
  let config: SwapPluginConfig;

  beforeEach(() => {
    mockWalletManager = {
      getAccount: jest.fn().mockReturnValue({
        address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      }),
      getTokenAllowance: jest.fn().mockResolvedValue(BigInt(0)),
      approveToken: jest.fn().mockResolvedValue('0xapproveTxHash123'),
    } as unknown as WalletManager;

    getWallet = () => mockWalletManager;
    config = { defaultChain: 'base' };
  });

  describe('action metadata', () => {
    it('should have correct name', () => {
      const action = createApproveAction(getWallet, config);
      expect(action.name).toBe('swap:approve');
    });

    it('should have description', () => {
      const action = createApproveAction(getWallet, config);
      expect(action.description).toBeDefined();
    });
  });

  describe('input validation', () => {
    it('should fail if token is missing', async () => {
      const action = createApproveAction(getWallet, config);
      const context: ActionContext = {
        input: {} as ApprovalRequest,
      };

      const result = await action.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Token address is required');
    });

    it('should fail if private key is missing', async () => {
      const action = createApproveAction(getWallet, config);
      const context: ActionContext = {
        input: { token: '0xToken' } as ApprovalRequest,
      };

      const result = await action.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Private key required. Set WALLET_PRIVATE_KEY env or provide in request.');
    });

    it('should fail if private key is invalid', async () => {
      const action = createApproveAction(getWallet, config);
      const context: ActionContext = {
        input: {
          token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          privateKey: 'invalid-key',
        } as ApprovalRequest,
      };

      const result = await action.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid private key format');
    });
  });

  describe('native token handling', () => {
    it('should skip approval for native ETH (0x0...0)', async () => {
      const action = createApproveAction(getWallet, config);
      const context: ActionContext = {
        input: {
          token: '0x0000000000000000000000000000000000000000',
          privateKey:
            '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
          spender: '0xSpender',
        } as ApprovalRequest,
      };

      const result = await action.execute(context);

      expect(result.success).toBe(true);
      expect((result.data as { message?: string })?.message).toBe(
        'Native tokens do not require approval',
      );
      expect(mockWalletManager.approveToken).not.toHaveBeenCalled();
    });

    it('should skip approval for native ETH (0xeee...)', async () => {
      const action = createApproveAction(getWallet, config);
      const context: ActionContext = {
        input: {
          token: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
          privateKey:
            '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
          spender: '0xSpender',
        } as ApprovalRequest,
      };

      const result = await action.execute(context);

      expect(result.success).toBe(true);
      expect((result.data as { message?: string })?.message).toBe(
        'Native tokens do not require approval',
      );
    });
  });

  describe('already approved handling', () => {
    it('should skip approval if already approved for unlimited', async () => {
      jest.mocked(mockWalletManager.getTokenAllowance).mockResolvedValue(
        maxUint256,
      );

      const action = createApproveAction(getWallet, config);
      const context: ActionContext = {
        input: {
          token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          privateKey:
            '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
          spender: '0xSpender',
        } as ApprovalRequest,
      };

      const result = await action.execute(context);

      expect(result.success).toBe(true);
      expect((result.data as { message?: string })?.message).toBe(
        'Token already approved',
      );
      expect(mockWalletManager.approveToken).not.toHaveBeenCalled();
    });

    it('should skip if allowance is greater than half of maxUint256', async () => {
      jest.mocked(mockWalletManager.getTokenAllowance).mockResolvedValue(
        maxUint256 / BigInt(2) + BigInt(1),
      );

      const action = createApproveAction(getWallet, config);
      const context: ActionContext = {
        input: {
          token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          privateKey:
            '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
          spender: '0xSpender',
        } as ApprovalRequest,
      };

      const result = await action.execute(context);

      expect(result.success).toBe(true);
      expect((result.data as { message?: string })?.message).toBe(
        'Token already approved',
      );
    });
  });

  describe('successful approval', () => {
    it('should approve token and return tx hash', async () => {
      const action = createApproveAction(getWallet, config);
      const context: ActionContext = {
        input: {
          token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          privateKey:
            '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
          spender: '0xCustomSpender',
        } as ApprovalRequest,
      };

      const result = await action.execute(context);

      expect(result.success).toBe(true);
      expect((result.data as { txHash?: string })?.txHash).toBe(
        '0xapproveTxHash123',
      );
      expect(mockWalletManager.approveToken).toHaveBeenCalledWith(
        '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        '0xCustomSpender',
        'unlimited',
        expect.any(String),
        'base',
      );
    });

    it('should use default Permit2 spender if not provided', async () => {
      const action = createApproveAction(getWallet, config);
      const context: ActionContext = {
        input: {
          token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          privateKey:
            '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
        } as ApprovalRequest,
      };

      await action.execute(context);

      expect(mockWalletManager.approveToken).toHaveBeenCalledWith(
        '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        '0x000000000022D473030F116dDEE9F6B43aC78BA3', // Permit2
        'unlimited',
        expect.any(String),
        'base',
      );
    });

    it('should use chain from input if provided', async () => {
      const action = createApproveAction(getWallet, config);
      const context: ActionContext = {
        input: {
          token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          privateKey:
            '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
          chainId: 'ethereum',
        } as ApprovalRequest,
      };

      await action.execute(context);

      expect(mockWalletManager.approveToken).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        'unlimited',
        expect.any(String),
        'ethereum',
      );
    });

    it('should add 0x prefix to private key if missing', async () => {
      const action = createApproveAction(getWallet, config);
      const context: ActionContext = {
        input: {
          token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          privateKey:
            'ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
        } as ApprovalRequest,
      };

      await action.execute(context);

      expect(mockWalletManager.approveToken).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        'unlimited',
        '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
        expect.any(String),
      );
    });
  });

  describe('error handling', () => {
    it('should handle approval errors', async () => {
      jest.mocked(mockWalletManager.approveToken).mockRejectedValue(
        new Error('Approval failed: insufficient gas'),
      );

      const action = createApproveAction(getWallet, config);
      const context: ActionContext = {
        input: {
          token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          privateKey:
            '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
        } as ApprovalRequest,
      };

      const result = await action.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Approval failed: insufficient gas');
    });

    it('should handle non-Error thrown values', async () => {
      jest.mocked(mockWalletManager.approveToken).mockRejectedValue(
        'string error',
      );

      const action = createApproveAction(getWallet, config);
      const context: ActionContext = {
        input: {
          token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          privateKey:
            '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
        } as ApprovalRequest,
      };

      const result = await action.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to approve token');
    });

    it('should handle allowance check errors', async () => {
      jest.mocked(mockWalletManager.getTokenAllowance).mockRejectedValue(
        new Error('RPC error'),
      );

      const action = createApproveAction(getWallet, config);
      const context: ActionContext = {
        input: {
          token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          privateKey:
            '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
        } as ApprovalRequest,
      };

      const result = await action.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('RPC error');
    });
  });
});
