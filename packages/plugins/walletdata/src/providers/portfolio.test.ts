/**
 * Wallet portfolio provider tests
 */


import { createWalletPortfolioProvider } from './portfolio.js';
import type { WalletDataPluginConfig, WalletPortfolio } from '../types/index.js';
import type { MoralisWalletClient } from '../utils/moralis.js';
import type { Cache } from '../utils/cache.js';
import type { ProviderContext } from '@samterminal/core';

describe('WalletPortfolioProvider', () => {
  let mockMoralis: MoralisWalletClient;
  let mockCache: Cache<WalletPortfolio>;
  let config: WalletDataPluginConfig;

  beforeEach(() => {
    mockMoralis = {
      getWalletTokens: jest.fn(),
    } as unknown as MoralisWalletClient;

    mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      has: jest.fn(),
      delete: jest.fn(),
      clear: jest.fn(),
    } as unknown as Cache<WalletPortfolio>;

    config = {
      defaultChain: 'base',
      enableCache: true,
      cacheTtl: 30000,
      excludeSpam: true,
    };
  });

  const createContext = (query: unknown): ProviderContext => ({
    query,
    params: {},
    user: undefined,
    metadata: {},
  });

  describe('provider metadata', () => {
    it('should have correct name and type', () => {
      const provider = createWalletPortfolioProvider(
        () => mockMoralis,
        () => mockCache,
        config,
      );

      expect(provider.name).toBe('walletdata:portfolio');
      expect(provider.type).toBe('wallet');
    });
  });

  describe('get', () => {
    it('should return error when address is missing', async () => {
      const provider = createWalletPortfolioProvider(
        () => mockMoralis,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({}));

      expect(result.success).toBe(false);
      expect(result.error).toBe('Wallet address is required');
    });

    it('should return error when Moralis not available', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);

      const provider = createWalletPortfolioProvider(
        () => null,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({ address: '0xWallet' }));

      expect(result.success).toBe(false);
      expect(result.error).toBe('Moralis API key required for portfolio data');
    });

    it('should return cached data when available', async () => {
      const cachedPortfolio: WalletPortfolio = {
        address: '0xwallet',
        chainId: 'base',
        totalValueUsd: 5000,
        nativeValueUsd: 3000,
        tokenValueUsd: 2000,
        tokenCount: 5,
        topTokens: [],
        lastUpdated: new Date().toISOString(),
      };

      jest.mocked(mockCache.get).mockReturnValue(cachedPortfolio);

      const provider = createWalletPortfolioProvider(
        () => mockMoralis,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({ address: '0xWallet' }));

      expect(result.success).toBe(true);
      expect(result.cached).toBe(true);
      expect(result.data).toEqual(cachedPortfolio);
    });

    it('should calculate portfolio summary from tokens', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockMoralis.getWalletTokens).mockResolvedValue({
        result: [
          {
            native_token: true,
            balance: '1000000000000000000',
            balance_formatted: '1.0',
            usd_value: 3000,
          },
          {
            native_token: false,
            token_address: '0xToken1',
            name: 'Token 1',
            symbol: 'TK1',
            decimals: 18,
            balance: '100000000',
            balance_formatted: '100',
            usd_price: 10,
            usd_value: 1000,
            usd_price_24hr_usd_change: 50,
          },
          {
            native_token: false,
            token_address: '0xToken2',
            name: 'Token 2',
            symbol: 'TK2',
            decimals: 18,
            balance: '200000000',
            balance_formatted: '200',
            usd_price: 5,
            usd_value: 500,
            usd_price_24hr_usd_change: -25,
          },
        ],
      } as any);

      const provider = createWalletPortfolioProvider(
        () => mockMoralis,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({ address: '0xWallet' }));

      expect(result.success).toBe(true);
      expect(result.data?.totalValueUsd).toBe(4500); // 3000 + 1000 + 500
      expect(result.data?.nativeValueUsd).toBe(3000);
      expect(result.data?.tokenValueUsd).toBe(1500); // 1000 + 500
      expect(result.data?.tokenCount).toBe(2);
    });

    it('should include top 10 tokens sorted by value', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);

      // Create 15 tokens
      const tokens = Array.from({ length: 15 }, (_, i) => ({
        native_token: false,
        token_address: `0xToken${i}`,
        name: `Token ${i}`,
        symbol: `TK${i}`,
        decimals: 18,
        balance: '1000000000000000000',
        balance_formatted: '1',
        usd_value: (15 - i) * 100, // Descending values
      }));

      jest.mocked(mockMoralis.getWalletTokens).mockResolvedValue({
        result: tokens,
      } as any);

      const provider = createWalletPortfolioProvider(
        () => mockMoralis,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({ address: '0xWallet' }));

      expect(result.data?.topTokens).toHaveLength(10);
      expect(result.data?.topTokens[0].valueUsd).toBe(1500); // Highest value
      expect(result.data?.topTokens[9].valueUsd).toBe(600); // 10th highest
    });

    it('should calculate 24h change', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockMoralis.getWalletTokens).mockResolvedValue({
        result: [
          {
            native_token: false,
            token_address: '0xToken1',
            decimals: 18,
            balance: '1',
            balance_formatted: '1',
            usd_value: 1100, // Current value
            usd_price_24hr_usd_change: 100, // Gained $100
          },
          {
            native_token: false,
            token_address: '0xToken2',
            decimals: 18,
            balance: '1',
            balance_formatted: '1',
            usd_value: 450, // Current value
            usd_price_24hr_usd_change: -50, // Lost $50
          },
        ],
      } as any);

      const provider = createWalletPortfolioProvider(
        () => mockMoralis,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({ address: '0xWallet' }));

      expect(result.data?.change24h).toBe(50); // 100 - 50
    });

    it('should cache result after fetching', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockMoralis.getWalletTokens).mockResolvedValue({
        result: [
          {
            native_token: true,
            usd_value: 1000,
          },
        ],
      } as any);

      const provider = createWalletPortfolioProvider(
        () => mockMoralis,
        () => mockCache,
        config,
      );

      await provider.get(createContext({ address: '0xWallet' }));

      expect(mockCache.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          address: '0xwallet',
          totalValueUsd: 1000,
        }),
        30000,
      );
    });

    it('should handle Moralis errors', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockMoralis.getWalletTokens).mockRejectedValue(new Error('API Error'));

      const provider = createWalletPortfolioProvider(
        () => mockMoralis,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({ address: '0xWallet' }));

      expect(result.success).toBe(false);
      expect(result.error).toBe('API Error');
    });

    it('should not use cache when disabled', async () => {
      const noCacheConfig: WalletDataPluginConfig = {
        ...config,
        enableCache: false,
      };

      jest.mocked(mockMoralis.getWalletTokens).mockResolvedValue({ result: [] } as any);

      const provider = createWalletPortfolioProvider(
        () => mockMoralis,
        () => mockCache,
        noCacheConfig,
      );

      await provider.get(createContext({ address: '0xWallet' }));

      expect(mockCache.get).not.toHaveBeenCalled();
      expect(mockCache.set).not.toHaveBeenCalled();
    });
  });
});
