/**
 * Quote provider tests
 */


import { createQuoteProvider } from './quote.js';
import type { ProviderContext } from '@samterminal/core';
import type { ZeroXClient } from '../utils/zerox.js';
import type { WalletManager } from '../utils/wallet.js';
import type { SwapPluginConfig, QuoteRequest } from '../types/index.js';

describe('createQuoteProvider', () => {
  let mockZeroXClient: ZeroXClient;
  let mockWalletManager: WalletManager;
  let getZeroX: () => ZeroXClient | null;
  let getWallet: () => WalletManager;
  let config: SwapPluginConfig;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-15T12:00:00Z'));

    mockZeroXClient = {
      getPrice: jest.fn().mockResolvedValue({
        sellAmount: '1000000000000000000',
        buyAmount: '3250000000',
        price: '3250',
        minBuyAmount: '3217500000',
        liquidityAvailable: true,
        gas: '200000',
        gasPrice: '1000000',
        route: {
          fills: [
            {
              source: 'Uniswap_V3',
              proportionBps: '6000',
              from: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
              to: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
            },
            {
              source: 'Aerodrome',
              proportionBps: '4000',
              from: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
              to: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
            },
          ],
          tokens: [],
        },
      }),
    } as unknown as ZeroXClient;

    mockWalletManager = {
      getTokenDecimals: jest.fn().mockResolvedValue(18),
    } as unknown as WalletManager;

    getZeroX = () => mockZeroXClient;
    getWallet = () => mockWalletManager;
    config = { defaultChain: 'base', defaultSlippageBps: 100 };
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('provider metadata', () => {
    it('should have correct name', () => {
      const provider = createQuoteProvider(getZeroX, getWallet, config);
      expect(provider.name).toBe('swap:quote');
    });

    it('should have type token', () => {
      const provider = createQuoteProvider(getZeroX, getWallet, config);
      expect(provider.type).toBe('token');
    });

    it('should have description', () => {
      const provider = createQuoteProvider(getZeroX, getWallet, config);
      expect(provider.description).toBeDefined();
    });
  });

  describe('input validation', () => {
    it('should fail if fromToken is missing', async () => {
      const provider = createQuoteProvider(getZeroX, getWallet, config);
      const context: ProviderContext = {
        query: { toToken: '0xUSDC', amount: 1 } as QuoteRequest,
      };

      const result = await provider.get(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Source token address is required');
    });

    it('should fail if toToken is missing', async () => {
      const provider = createQuoteProvider(getZeroX, getWallet, config);
      const context: ProviderContext = {
        query: { fromToken: '0xETH', amount: 1 } as QuoteRequest,
      };

      const result = await provider.get(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Destination token address is required');
    });

    it('should fail if amount is zero', async () => {
      const provider = createQuoteProvider(getZeroX, getWallet, config);
      const context: ProviderContext = {
        query: { fromToken: '0xETH', toToken: '0xUSDC', amount: 0 } as QuoteRequest,
      };

      const result = await provider.get(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Amount must be greater than 0');
    });

    it('should fail if amount is negative', async () => {
      const provider = createQuoteProvider(getZeroX, getWallet, config);
      const context: ProviderContext = {
        query: { fromToken: '0xETH', toToken: '0xUSDC', amount: -1 } as QuoteRequest,
      };

      const result = await provider.get(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Amount must be greater than 0');
    });
  });

  describe('0x client requirement', () => {
    it('should fail if 0x client is not available', async () => {
      const provider = createQuoteProvider(
        () => null,
        getWallet,
        config,
      );
      const context: ProviderContext = {
        query: {
          fromToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
          toToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          amount: 1,
        } as QuoteRequest,
      };

      const result = await provider.get(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('0x API key required for quotes');
    });
  });

  describe('successful quotes', () => {
    it('should return quote for ETH->USDC', async () => {
      jest.mocked(mockWalletManager.getTokenDecimals).mockImplementation(
        async (tokenAddress: string) => {
          if (tokenAddress === '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913') {
            return 6; // USDC
          }
          return 18; // ETH
        },
      );

      const provider = createQuoteProvider(getZeroX, getWallet, config);
      const context: ProviderContext = {
        query: {
          fromToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
          toToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          amount: 1,
        } as QuoteRequest,
      };

      const result = await provider.get(context);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();

      const quote = result.data as {
        fromToken: string;
        toToken: string;
        sellAmount: string;
        buyAmount: string;
        price: number;
        sources: Array<{ name: string; proportion: number }>;
        allowanceTarget: string;
      };

      expect(quote.fromToken).toBe(
        '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      );
      expect(quote.toToken).toBe('0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913');
      expect(parseFloat(quote.sellAmount)).toBe(1);
      expect(quote.sources).toHaveLength(2);
      expect(quote.allowanceTarget).toBe(
        '0x000000000022D473030F116dDEE9F6B43aC78BA3',
      );
    });

    it('should convert native token addresses for API call', async () => {
      const provider = createQuoteProvider(getZeroX, getWallet, config);
      const context: ProviderContext = {
        query: {
          fromToken: '0x0000000000000000000000000000000000000000',
          toToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          amount: 1,
        } as QuoteRequest,
      };

      await provider.get(context);

      expect(mockZeroXClient.getPrice).toHaveBeenCalledWith(
        expect.objectContaining({
          sellToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        }),
      );
    });

    it('should use config defaults', async () => {
      const provider = createQuoteProvider(getZeroX, getWallet, {
        defaultChain: 'ethereum',
        defaultSlippageBps: 50,
      });
      const context: ProviderContext = {
        query: {
          fromToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
          toToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          amount: 1,
        } as QuoteRequest,
      };

      await provider.get(context);

      expect(mockZeroXClient.getPrice).toHaveBeenCalledWith(
        expect.objectContaining({
          chainId: 'ethereum',
          slippageBps: 50,
        }),
      );
    });

    it('should override config with query params', async () => {
      const provider = createQuoteProvider(getZeroX, getWallet, config);
      const context: ProviderContext = {
        query: {
          fromToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
          toToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          amount: 1,
          chainId: 'arbitrum',
          slippageBps: 200,
        } as QuoteRequest,
      };

      await provider.get(context);

      expect(mockZeroXClient.getPrice).toHaveBeenCalledWith(
        expect.objectContaining({
          chainId: 'arbitrum',
          slippageBps: 200,
        }),
      );
    });

    it('should include taker when provided', async () => {
      const provider = createQuoteProvider(getZeroX, getWallet, config);
      const context: ProviderContext = {
        query: {
          fromToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
          toToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          amount: 1,
          taker: '0xTakerAddress',
        } as QuoteRequest,
      };

      await provider.get(context);

      expect(mockZeroXClient.getPrice).toHaveBeenCalledWith(
        expect.objectContaining({
          taker: '0xTakerAddress',
        }),
      );
    });

    it('should parse sources correctly', async () => {
      const provider = createQuoteProvider(getZeroX, getWallet, config);
      const context: ProviderContext = {
        query: {
          fromToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
          toToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          amount: 1,
        } as QuoteRequest,
      };

      const result = await provider.get(context);
      const quote = result.data as {
        sources: Array<{ name: string; proportion: number }>;
      };

      expect(quote.sources[0].name).toBe('Uniswap_V3');
      expect(quote.sources[0].proportion).toBe(0.6);
      expect(quote.sources[1].name).toBe('Aerodrome');
      expect(quote.sources[1].proportion).toBe(0.4);
    });

    it('should calculate gas cost', async () => {
      const provider = createQuoteProvider(getZeroX, getWallet, config);
      const context: ProviderContext = {
        query: {
          fromToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
          toToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          amount: 1,
        } as QuoteRequest,
      };

      const result = await provider.get(context);
      const quote = result.data as {
        gasEstimate: string;
        gasPrice: string;
        gasCostNative: string;
      };

      expect(quote.gasEstimate).toBe('200000');
      expect(quote.gasPrice).toBe('1000000');
      // 200000 * 1000000 = 200000000000 wei = 0.0000002 ETH
      expect(parseFloat(quote.gasCostNative)).toBeCloseTo(0.0000002, 10);
    });
  });

  describe('no liquidity handling', () => {
    it('should return error if no liquidity', async () => {
      jest.mocked(mockZeroXClient.getPrice).mockResolvedValue({
        liquidityAvailable: false,
      } as any);

      const provider = createQuoteProvider(getZeroX, getWallet, config);
      const context: ProviderContext = {
        query: {
          fromToken: '0xToken1',
          toToken: '0xToken2',
          amount: 1,
        } as QuoteRequest,
      };

      const result = await provider.get(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No liquidity available for this pair');
    });
  });

  describe('caching', () => {
    it('should cache quotes', async () => {
      const provider = createQuoteProvider(getZeroX, getWallet, config);
      const context: ProviderContext = {
        query: {
          fromToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
          toToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          amount: 1,
        } as QuoteRequest,
      };

      // First call
      await provider.get(context);
      expect(mockZeroXClient.getPrice).toHaveBeenCalledTimes(1);

      // Second call should be cached
      const result2 = await provider.get(context);
      expect(mockZeroXClient.getPrice).toHaveBeenCalledTimes(1);
      expect(result2.cached).toBe(true);
    });

    it('should respect cache TTL', async () => {
      const provider = createQuoteProvider(getZeroX, getWallet, {
        ...config,
        cacheTtl: 5000,
      });
      const context: ProviderContext = {
        query: {
          fromToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
          toToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          amount: 1,
        } as QuoteRequest,
      };

      // First call
      await provider.get(context);
      expect(mockZeroXClient.getPrice).toHaveBeenCalledTimes(1);

      // Advance time past TTL
      jest.advanceTimersByTime(6000);

      // Should fetch fresh data
      await provider.get(context);
      expect(mockZeroXClient.getPrice).toHaveBeenCalledTimes(2);
    });

    it('should skip cache when disabled', async () => {
      const provider = createQuoteProvider(getZeroX, getWallet, {
        ...config,
        enableCache: false,
      });
      const context: ProviderContext = {
        query: {
          fromToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
          toToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          amount: 1,
        } as QuoteRequest,
      };

      await provider.get(context);
      await provider.get(context);

      expect(mockZeroXClient.getPrice).toHaveBeenCalledTimes(2);
    });

    it('should use different cache keys for different params', async () => {
      const provider = createQuoteProvider(getZeroX, getWallet, config);

      await provider.get({
        query: {
          fromToken: '0xToken1',
          toToken: '0xToken2',
          amount: 1,
        } as QuoteRequest,
      });

      await provider.get({
        query: {
          fromToken: '0xToken1',
          toToken: '0xToken2',
          amount: 2,
        } as QuoteRequest,
      });

      expect(mockZeroXClient.getPrice).toHaveBeenCalledTimes(2);
    });
  });

  describe('error handling', () => {
    it('should handle API errors', async () => {
      jest.mocked(mockZeroXClient.getPrice).mockRejectedValue(
        new Error('API rate limit exceeded'),
      );

      const provider = createQuoteProvider(getZeroX, getWallet, config);
      const context: ProviderContext = {
        query: {
          fromToken: '0xToken1',
          toToken: '0xToken2',
          amount: 1,
        } as QuoteRequest,
      };

      const result = await provider.get(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('API rate limit exceeded');
    });

    it('should handle non-Error thrown values', async () => {
      jest.mocked(mockZeroXClient.getPrice).mockRejectedValue('string error');

      const provider = createQuoteProvider(getZeroX, getWallet, config);
      const context: ProviderContext = {
        query: {
          fromToken: '0xToken1',
          toToken: '0xToken2',
          amount: 1,
        } as QuoteRequest,
      };

      const result = await provider.get(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to get quote');
    });
  });
});
