/**
 * Swap action tests
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';

import type { ActionContext } from '@samterminal/core';
import type { ZeroXClient } from '../utils/zerox.js';
import type { WalletManager } from '../utils/wallet.js';
import type {
  SwapPluginConfig,
  SwapRequest,
  SwapDatabaseAdapter,
} from '../types/index.js';

// Mock viem to avoid loading the full module (prevents OOM)
jest.unstable_mockModule('viem', () => ({
  maxUint256: BigInt('115792089237316195423570985008687907853269984665640564039457584007913129639935'),
  isAddress: () => true,
}));

// Mock the utilities with ESM-compatible mocking
// Avoid importing the actual module (which transitively imports viem and causes OOM)
jest.unstable_mockModule('../utils/index.js', () => ({
  buildSecureSwapTransaction: jest.fn().mockResolvedValue({
    callData: '0xmockcalldata',
    permit: {
      permitted: { token: '0xToken', amount: BigInt('1000000000') },
      nonce: BigInt('12345'),
      deadline: BigInt('1700000000'),
      spender: '0xSpender',
    },
    signature: '0xmocksignature',
  } as never),
  // Re-export utility functions used by swap.ts
  normalizeAddress: (address: string) => address.toLowerCase(),
  isValidEvmAddress: (address: string) => /^0x[a-fA-F0-9]{40}$/.test(address),
  isValidPrivateKey: (privateKey: string) => {
    const cleaned = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;
    return /^[a-fA-F0-9]{64}$/.test(cleaned);
  },
  ensurePrivateKeyPrefix: (privateKey: string) =>
    privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`,
  floatToBigInt: (value: number, decimals: number) => {
    const valueStr = value.toFixed(decimals);
    const [intPart, decPart = ''] = valueStr.split('.');
    const paddedDec = decPart.padEnd(decimals, '0').slice(0, decimals);
    return BigInt(intPart + paddedDec);
  },
  bigIntToFloat: (value: bigint, decimals: number) => {
    const str = value.toString().padStart(decimals + 1, '0');
    const intPart = str.slice(0, str.length - decimals) || '0';
    const decPart = str.slice(str.length - decimals);
    return parseFloat(decPart ? `${intPart}.${decPart}` : intPart);
  },
  formatTokenAmount: (amount: bigint, decimals: number) => amount.toString(),
  calculateMinimumOutput: (amount: string, slippageBps: number) => {
    const amountBigInt = BigInt(amount);
    const slippageFactor = BigInt(10000 - slippageBps);
    return ((amountBigInt * slippageFactor) / BigInt(10000)).toString();
  },
  bpsToPercent: (bps: number) => bps / 100,
  weiToGwei: (wei: bigint | string) => {
    const weiBigInt = typeof wei === 'string' ? BigInt(wei) : wei;
    return Number(weiBigInt) / 1e9;
  },
  delay: (ms: number) => new Promise((resolve) => setTimeout(resolve, ms)),
  retry: async <T>(fn: () => Promise<T>) => fn(),
  Cache: class {
    get() { return undefined; }
    set() {}
    delete() {}
    clear() {}
  },
  createCacheKey: (...args: string[]) => args.join(':'),
}));

// Import after mock is set up
const { createSwapAction } = await import('./swap.js');

describe('createSwapAction', () => {
  let mockZeroXClient: ZeroXClient;
  let mockWalletManager: WalletManager;
  let mockDatabaseAdapter: SwapDatabaseAdapter;
  let getZeroX: () => ZeroXClient | null;
  let getWallet: () => WalletManager;
  let getDatabase: () => SwapDatabaseAdapter | undefined;
  let config: SwapPluginConfig;

  const testPrivateKey =
    '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
  const testAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

  beforeEach(() => {
    jest.clearAllMocks();

    mockZeroXClient = {
      getQuote: jest.fn().mockResolvedValue({
        sellAmount: '1000000000000000000',
        buyAmount: '3250000000',
        liquidityAvailable: true,
        transaction: {
          to: '0xRouterAddress',
          data: '0xSwapData',
          value: '1000000000000000000',
          gas: '200000',
          gasPrice: '1000000',
        },
      } as never),
    } as unknown as ZeroXClient;

    mockWalletManager = {
      getAccount: jest.fn().mockReturnValue({ address: testAddress } as never),
      getTokenDecimals: jest.fn().mockResolvedValue(18 as never),
      getNativeBalance: jest.fn().mockResolvedValue(BigInt('2000000000000000000') as never),
      getTokenBalance: jest.fn().mockResolvedValue(BigInt('2000000000000000000') as never),
      getTokenAllowance: jest.fn().mockResolvedValue(
        BigInt(
          '115792089237316195423570985008687907853269984665640564039457584007913129639935',
        ) as never,
      ),
      sendTransaction: jest.fn().mockResolvedValue('0xswaptxhash123' as never),
      approveToken: jest.fn().mockResolvedValue('0xapprovetxhash' as never),
      getGasPrice: jest.fn().mockResolvedValue(BigInt('1000000000') as never),
      estimateGas: jest.fn().mockResolvedValue(BigInt('21000') as never),
      createWalletClient: jest.fn().mockReturnValue({
        signTypedData: jest.fn().mockResolvedValue('0xsignature' as never),
      } as never),
      signTypedData: jest.fn().mockResolvedValue('0xsignature' as never),
    } as unknown as WalletManager;

    mockDatabaseAdapter = {
      logSwap: jest.fn().mockResolvedValue('swap-123' as never),
      logError: jest.fn().mockResolvedValue(undefined as never),
    } as unknown as SwapDatabaseAdapter;

    getZeroX = () => mockZeroXClient;
    getWallet = () => mockWalletManager;
    getDatabase = () => mockDatabaseAdapter;
    config = { defaultChain: 'base', defaultSlippageBps: 100 };
  });

  describe('action metadata', () => {
    it('should have correct name', () => {
      const action = createSwapAction(
        getZeroX,
        getWallet,
        getDatabase,
        config,
      );
      expect(action.name).toBe('swap:execute');
    });

    it('should have description', () => {
      const action = createSwapAction(
        getZeroX,
        getWallet,
        getDatabase,
        config,
      );
      expect(action.description).toBeDefined();
    });
  });

  describe('input validation', () => {
    it('should fail if fromToken is missing', async () => {
      const action = createSwapAction(
        getZeroX,
        getWallet,
        getDatabase,
        config,
      );
      const context: ActionContext = {
        input: { toToken: '0xUSDC', amount: 1 } as SwapRequest,
      };

      const result = await action.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Source token address is required');
    });

    it('should fail if toToken is missing', async () => {
      const action = createSwapAction(
        getZeroX,
        getWallet,
        getDatabase,
        config,
      );
      const context: ActionContext = {
        input: { fromToken: '0xETH' } as SwapRequest,
      };

      const result = await action.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Destination token address is required');
    });

    it('should fail if amount is zero', async () => {
      const action = createSwapAction(
        getZeroX,
        getWallet,
        getDatabase,
        config,
      );
      const context: ActionContext = {
        input: {
          fromToken: '0xETH',
          toToken: '0xUSDC',
          amount: 0,
        } as SwapRequest,
      };

      const result = await action.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Amount must be greater than 0');
    });

    it('should fail if privateKey is missing', async () => {
      const action = createSwapAction(
        getZeroX,
        getWallet,
        getDatabase,
        config,
      );
      const context: ActionContext = {
        input: {
          fromToken: '0xETH',
          toToken: '0xUSDC',
          amount: 1,
        } as SwapRequest,
      };

      const result = await action.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Private key required. Set WALLET_PRIVATE_KEY env or provide in request.');
    });

    it('should fail if privateKey is invalid', async () => {
      const action = createSwapAction(
        getZeroX,
        getWallet,
        getDatabase,
        config,
      );
      const context: ActionContext = {
        input: {
          fromToken: '0xETH',
          toToken: '0xUSDC',
          amount: 1,
          privateKey: 'invalid-key',
        } as SwapRequest,
      };

      const result = await action.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid private key format');
    });
  });

  describe('0x client requirement', () => {
    it('should fail if 0x client is not available', async () => {
      const action = createSwapAction(
        () => null,
        getWallet,
        getDatabase,
        config,
      );
      const context: ActionContext = {
        input: {
          fromToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
          toToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          amount: 1,
          privateKey: testPrivateKey,
        } as SwapRequest,
      };

      const result = await action.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('0x API key required for swaps');
    });
  });

  describe('balance validation', () => {
    it('should fail if insufficient native balance', async () => {
      jest.mocked(mockWalletManager.getNativeBalance).mockResolvedValue(
        BigInt('500000000000000000') as never,
      );

      const action = createSwapAction(
        getZeroX,
        getWallet,
        getDatabase,
        config,
      );
      const context: ActionContext = {
        input: {
          fromToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
          toToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          amount: 1,
          privateKey: testPrivateKey,
        } as SwapRequest,
      };

      const result = await action.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Insufficient balance');
    });

    it('should fail if insufficient token balance', async () => {
      jest.mocked(mockWalletManager.getTokenBalance).mockResolvedValue(
        BigInt('500000') as never,
      );
      jest.mocked(mockWalletManager.getTokenDecimals).mockResolvedValue(6 as never);

      const action = createSwapAction(
        getZeroX,
        getWallet,
        getDatabase,
        config,
      );
      const context: ActionContext = {
        input: {
          fromToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          toToken: '0x4200000000000000000000000000000000000006',
          amount: 1000,
          privateKey: testPrivateKey,
        } as SwapRequest,
      };

      const result = await action.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Insufficient balance');
    });
  });

  describe('liquidity check', () => {
    it('should fail if no liquidity available', async () => {
      jest.mocked(mockZeroXClient.getQuote).mockResolvedValue({
        liquidityAvailable: false,
      } as never);

      const action = createSwapAction(
        getZeroX,
        getWallet,
        getDatabase,
        config,
      );
      const context: ActionContext = {
        input: {
          fromToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
          toToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          amount: 1,
          privateKey: testPrivateKey,
        } as SwapRequest,
      };

      const result = await action.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No liquidity available for this swap');
    });
  });

  describe('native token swap', () => {
    it('should execute native ETH to token swap', async () => {
      const action = createSwapAction(
        getZeroX,
        getWallet,
        getDatabase,
        config,
      );
      const context: ActionContext = {
        input: {
          fromToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
          toToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          amount: 1,
          privateKey: testPrivateKey,
        } as SwapRequest,
      };

      const result = await action.execute(context);

      expect(result.success).toBe(true);
      expect((result.data as { txHash?: string })?.txHash).toBe(
        '0xswaptxhash123',
      );
      expect(mockWalletManager.sendTransaction).toHaveBeenCalled();
      // Should NOT approve for native tokens
      expect(mockWalletManager.approveToken).not.toHaveBeenCalled();
    });

    it('should handle 0x0...0 as native token', async () => {
      const action = createSwapAction(
        getZeroX,
        getWallet,
        getDatabase,
        config,
      );
      const context: ActionContext = {
        input: {
          fromToken: '0x0000000000000000000000000000000000000000',
          toToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          amount: 1,
          privateKey: testPrivateKey,
        } as SwapRequest,
      };

      const result = await action.execute(context);

      expect(result.success).toBe(true);
    });
  });

  describe('ERC20 token swap', () => {
    it('should approve Permit2 if allowance insufficient', async () => {
      jest.mocked(mockWalletManager.getTokenAllowance).mockResolvedValue(
        BigInt(0) as never,
      );
      jest.mocked(mockWalletManager.getTokenDecimals).mockResolvedValue(6 as never);
      jest.mocked(mockWalletManager.getTokenBalance).mockResolvedValue(
        BigInt('2000000000') as never,
      );

      jest.mocked(mockZeroXClient.getQuote).mockResolvedValue({
        sellAmount: '1000000000',
        buyAmount: '300000000000000000',
        liquidityAvailable: true,
        transaction: {
          to: '0xRouter',
          data: '0xData',
          value: '0',
          gas: '200000',
          gasPrice: '1000000',
        },
      } as never);

      const action = createSwapAction(
        getZeroX,
        getWallet,
        getDatabase,
        config,
      );
      const context: ActionContext = {
        input: {
          fromToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          toToken: '0x4200000000000000000000000000000000000006',
          amount: 1000,
          privateKey: testPrivateKey,
        } as SwapRequest,
      };

      const result = await action.execute(context);

      expect(result.success).toBe(true);
      expect(mockWalletManager.approveToken).toHaveBeenCalledWith(
        '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        '0x000000000022D473030F116dDEE9F6B43aC78BA3',
        'unlimited',
        expect.any(String),
        'base',
      );
    });

    it('should skip approval if allowance sufficient', async () => {
      jest.mocked(mockWalletManager.getTokenDecimals).mockResolvedValue(6 as never);
      jest.mocked(mockWalletManager.getTokenBalance).mockResolvedValue(
        BigInt('2000000000') as never,
      );

      jest.mocked(mockZeroXClient.getQuote).mockResolvedValue({
        sellAmount: '1000000000',
        buyAmount: '300000000000000000',
        liquidityAvailable: true,
        transaction: {
          to: '0xRouter',
          data: '0xData',
          value: '0',
          gas: '200000',
          gasPrice: '1000000',
        },
      } as never);

      const action = createSwapAction(
        getZeroX,
        getWallet,
        getDatabase,
        config,
      );
      const context: ActionContext = {
        input: {
          fromToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          toToken: '0x4200000000000000000000000000000000000006',
          amount: 1000,
          privateKey: testPrivateKey,
        } as SwapRequest,
      };

      const result = await action.execute(context);

      expect(result.success).toBe(true);
      expect(mockWalletManager.approveToken).not.toHaveBeenCalled();
    });
  });

  describe('database logging', () => {
    it('should log successful swap to database', async () => {
      const action = createSwapAction(
        getZeroX,
        getWallet,
        getDatabase,
        config,
      );
      const context: ActionContext = {
        input: {
          fromToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
          toToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          amount: 1,
          privateKey: testPrivateKey,
        } as SwapRequest,
      };

      await action.execute(context);

      expect(mockDatabaseAdapter.logSwap).toHaveBeenCalledWith(
        expect.objectContaining({
          fromToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
          toToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          txHash: '0xswaptxhash123',
          chainId: 'base',
          status: 'confirmed',
        }),
      );
    });

    it('should log errors to database', async () => {
      jest.mocked(mockZeroXClient.getQuote).mockRejectedValue(
        new Error('API Error') as never,
      );

      const action = createSwapAction(
        getZeroX,
        getWallet,
        getDatabase,
        config,
      );
      const context: ActionContext = {
        input: {
          fromToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
          toToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          amount: 1,
          privateKey: testPrivateKey,
        } as SwapRequest,
      };

      await action.execute(context);

      expect(mockDatabaseAdapter.logError).toHaveBeenCalledWith(
        testAddress,
        'API Error',
      );
    });

    it('should continue if database logging fails', async () => {
      jest.mocked(mockDatabaseAdapter.logSwap).mockRejectedValue(
        new Error('DB Error') as never,
      );

      const action = createSwapAction(
        getZeroX,
        getWallet,
        getDatabase,
        config,
      );
      const context: ActionContext = {
        input: {
          fromToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
          toToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          amount: 1,
          privateKey: testPrivateKey,
        } as SwapRequest,
      };

      const result = await action.execute(context);

      // Swap should still succeed even if logging fails
      expect(result.success).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should return error message for failures', async () => {
      jest.mocked(mockWalletManager.sendTransaction).mockRejectedValue(
        new Error('Transaction reverted') as never,
      );

      const action = createSwapAction(
        getZeroX,
        getWallet,
        getDatabase,
        config,
      );
      const context: ActionContext = {
        input: {
          fromToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
          toToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          amount: 1,
          privateKey: testPrivateKey,
        } as SwapRequest,
      };

      const result = await action.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Transaction reverted');
    });

    it('should handle non-Error thrown values', async () => {
      jest.mocked(mockWalletManager.sendTransaction).mockRejectedValue(
        'string error' as never,
      );

      const action = createSwapAction(
        getZeroX,
        getWallet,
        getDatabase,
        config,
      );
      const context: ActionContext = {
        input: {
          fromToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
          toToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          amount: 1,
          privateKey: testPrivateKey,
        } as SwapRequest,
      };

      const result = await action.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Swap failed');
    });
  });

  describe('configuration', () => {
    it('should use custom recipient if provided', async () => {
      const action = createSwapAction(
        getZeroX,
        getWallet,
        getDatabase,
        config,
      );
      const context: ActionContext = {
        input: {
          fromToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
          toToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          amount: 1,
          privateKey: testPrivateKey,
          recipient: '0xRecipientAddress',
        } as SwapRequest,
      };

      await action.execute(context);

      expect(mockZeroXClient.getQuote).toHaveBeenCalledWith(
        expect.objectContaining({
          taker: '0xRecipientAddress',
        }),
      );
    });

    it('should use custom gas price if provided', async () => {
      const action = createSwapAction(
        getZeroX,
        getWallet,
        getDatabase,
        config,
      );
      const context: ActionContext = {
        input: {
          fromToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
          toToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          amount: 1,
          privateKey: testPrivateKey,
          gasPrice: '50000000000',
        } as SwapRequest,
      };

      await action.execute(context);

      expect(mockWalletManager.sendTransaction).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.any(String),
        '50000000000',
        expect.any(String),
        expect.any(String),
      );
    });
  });
});
