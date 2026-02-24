/**
 * Allowance Provider tests
 */

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

import type { ProviderContext } from '@samterminal/core';
import type { SwapPluginConfig } from '../types/index.js';
import type { WalletManager } from '../utils/wallet.js';
import { maxUint256 } from 'viem';

// Mock types
jest.unstable_mockModule('../types/index.js', () => ({
  isNativeToken: jest.fn((address: string) => {
    const natives = [
      '0x0000000000000000000000000000000000000000',
      '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    ];
    return natives.includes(address.toLowerCase());
  }),
}));

// Import after mock is set up
const { createAllowanceProvider } = await import('./allowance.js');
type AllowanceQuery = import('./allowance.js').AllowanceQuery;

describe('AllowanceProvider', () => {
  let provider: ReturnType<typeof createAllowanceProvider>;
  let mockWalletManager: WalletManager;
  let mockConfig: SwapPluginConfig;
  let getWallet: () => WalletManager;

  beforeEach(() => {
    mockWalletManager = {
      getTokenAllowance: jest.fn().mockResolvedValue(1000000000000000000n as never),
      getBalance: jest.fn(),
    } as unknown as WalletManager;

    mockConfig = {
      defaultChain: 'base',
    } as SwapPluginConfig;

    getWallet = () => mockWalletManager;
    provider = createAllowanceProvider(getWallet, mockConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('provider metadata', () => {
    it('should have name swap:allowance', () => {
      expect(provider.name).toBe('swap:allowance');
    });

    it('should have type token', () => {
      expect(provider.type).toBe('token');
    });

    it('should have description', () => {
      expect(provider.description).toContain('allowance');
    });
  });

  describe('get - validation', () => {
    it('should return error when token is missing', async () => {
      const context: ProviderContext = {
        query: { owner: '0x123' } as AllowanceQuery,
      };

      const result = await provider.get(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Token address is required');
    });

    it('should return error when owner is missing', async () => {
      const context: ProviderContext = {
        query: { token: '0x456' } as AllowanceQuery,
      };

      const result = await provider.get(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Owner address is required');
    });
  });

  describe('get - native token', () => {
    it('should return unlimited allowance for native token', async () => {
      const context: ProviderContext = {
        query: {
          token: '0x0000000000000000000000000000000000000000',
          owner: '0xOwner',
        } as AllowanceQuery,
      };

      const result = await provider.get(context);

      expect(result.success).toBe(true);
      expect(result.data.isUnlimited).toBe(true);
      expect(result.data.allowance).toBe(maxUint256.toString());
    });

    it('should handle ETH address format', async () => {
      const context: ProviderContext = {
        query: {
          token: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
          owner: '0xOwner',
        } as AllowanceQuery,
      };

      const result = await provider.get(context);

      expect(result.success).toBe(true);
      expect(result.data.isUnlimited).toBe(true);
    });

    it('should not call wallet manager for native token', async () => {
      const context: ProviderContext = {
        query: {
          token: '0x0000000000000000000000000000000000000000',
          owner: '0xOwner',
        } as AllowanceQuery,
      };

      await provider.get(context);

      expect(mockWalletManager.getTokenAllowance).not.toHaveBeenCalled();
    });
  });

  describe('get - ERC20 token', () => {
    it('should call wallet manager for ERC20 token', async () => {
      const context: ProviderContext = {
        query: {
          token: '0xTokenAddress',
          owner: '0xOwnerAddress',
        } as AllowanceQuery,
      };

      await provider.get(context);

      expect(mockWalletManager.getTokenAllowance).toHaveBeenCalled();
    });

    it('should use default chain from config', async () => {
      const context: ProviderContext = {
        query: {
          token: '0xTokenAddress',
          owner: '0xOwnerAddress',
        } as AllowanceQuery,
      };

      await provider.get(context);

      expect(mockWalletManager.getTokenAllowance).toHaveBeenCalledWith(
        '0xTokenAddress',
        '0xOwnerAddress',
        expect.any(String),
        'base',
      );
    });

    it('should use provided chainId', async () => {
      const context: ProviderContext = {
        query: {
          token: '0xTokenAddress',
          owner: '0xOwnerAddress',
          chainId: 'ethereum',
        } as AllowanceQuery,
      };

      await provider.get(context);

      expect(mockWalletManager.getTokenAllowance).toHaveBeenCalledWith(
        '0xTokenAddress',
        '0xOwnerAddress',
        expect.any(String),
        'ethereum',
      );
    });

    it('should use custom spender if provided', async () => {
      const context: ProviderContext = {
        query: {
          token: '0xTokenAddress',
          owner: '0xOwnerAddress',
          spender: '0xCustomSpender',
        } as AllowanceQuery,
      };

      await provider.get(context);

      expect(mockWalletManager.getTokenAllowance).toHaveBeenCalledWith(
        '0xTokenAddress',
        '0xOwnerAddress',
        '0xCustomSpender',
        expect.any(String),
      );
    });

    it('should return allowance data on success', async () => {
      const context: ProviderContext = {
        query: {
          token: '0xTokenAddress',
          owner: '0xOwnerAddress',
        } as AllowanceQuery,
      };

      const result = await provider.get(context);

      expect(result.success).toBe(true);
      expect(result.data.token).toBe('0xTokenAddress');
      expect(result.data.owner).toBe('0xOwnerAddress');
      expect(result.data.allowance).toBeDefined();
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should mark as unlimited when allowance is high', async () => {
      jest.mocked(mockWalletManager.getTokenAllowance).mockResolvedValue(
        maxUint256 / BigInt(2) + BigInt(1) as never,
      );

      const context: ProviderContext = {
        query: {
          token: '0xTokenAddress',
          owner: '0xOwnerAddress',
        } as AllowanceQuery,
      };

      const result = await provider.get(context);

      expect(result.data.isUnlimited).toBe(true);
    });

    it('should mark as limited when allowance is low', async () => {
      jest.mocked(mockWalletManager.getTokenAllowance).mockResolvedValue(
        1000000000000000000n as never,
      );

      const context: ProviderContext = {
        query: {
          token: '0xTokenAddress',
          owner: '0xOwnerAddress',
        } as AllowanceQuery,
      };

      const result = await provider.get(context);

      expect(result.data.isUnlimited).toBe(false);
    });
  });

  describe('get - error handling', () => {
    it('should return error on wallet manager failure', async () => {
      jest.mocked(mockWalletManager.getTokenAllowance).mockRejectedValue(
        new Error('RPC error') as never,
      );

      const context: ProviderContext = {
        query: {
          token: '0xTokenAddress',
          owner: '0xOwnerAddress',
        } as AllowanceQuery,
      };

      const result = await provider.get(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('RPC error');
    });

    it('should handle non-Error exceptions', async () => {
      jest.mocked(mockWalletManager.getTokenAllowance).mockRejectedValue(
        'string error' as never,
      );

      const context: ProviderContext = {
        query: {
          token: '0xTokenAddress',
          owner: '0xOwnerAddress',
        } as AllowanceQuery,
      };

      const result = await provider.get(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to get allowance');
    });

    it('should include timestamp on error', async () => {
      jest.mocked(mockWalletManager.getTokenAllowance).mockRejectedValue(
        new Error('error') as never,
      );

      const context: ProviderContext = {
        query: {
          token: '0xTokenAddress',
          owner: '0xOwnerAddress',
        } as AllowanceQuery,
      };

      const result = await provider.get(context);

      expect(result.timestamp).toBeInstanceOf(Date);
    });
  });
});
