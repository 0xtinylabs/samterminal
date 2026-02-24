/**
 * Token price provider tests
 */


import { createTokenPriceProvider } from './price.js';
import type { TokenDataPluginConfig, TokenPrice } from '../types/index.js';
import type { DexScreenerClient } from '../utils/dexscreener.js';
import type { CoinGeckoClient } from '../utils/coingecko.js';
import type { Cache } from '../utils/cache.js';
import type { ProviderContext } from '@samterminal/core';

describe('TokenPriceProvider', () => {
  let mockDexScreener: DexScreenerClient;
  let mockCoinGecko: CoinGeckoClient;
  let mockCache: Cache<TokenPrice>;
  let config: TokenDataPluginConfig;

  beforeEach(() => {
    mockDexScreener = {
      getBestPair: jest.fn(),
      getTokenPairs: jest.fn(),
      getTokenPrice: jest.fn(),
    } as unknown as DexScreenerClient;

    mockCoinGecko = {
      getTokenInfo: jest.fn(),
    } as unknown as CoinGeckoClient;

    mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      has: jest.fn(),
      delete: jest.fn(),
      clear: jest.fn(),
    } as unknown as Cache<TokenPrice>;

    config = {
      defaultChain: 'base',
      enableCache: true,
      cacheTtl: 30000,
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
      const provider = createTokenPriceProvider(
        () => mockDexScreener,
        () => mockCoinGecko,
        () => mockCache,
        config,
      );

      expect(provider.name).toBe('tokendata:price');
      expect(provider.type).toBe('token');
    });
  });

  describe('get', () => {
    it('should return error when address is missing', async () => {
      const provider = createTokenPriceProvider(
        () => mockDexScreener,
        () => mockCoinGecko,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({}));

      expect(result.success).toBe(false);
      expect(result.error).toBe('Token address is required');
    });

    it('should return cached data when available', async () => {
      const cachedPrice: TokenPrice = {
        address: '0xToken',
        chainId: 'base',
        priceUsd: 1.5,
        lastUpdated: new Date().toISOString(),
      };

      jest.mocked(mockCache.get).mockReturnValue(cachedPrice);

      const provider = createTokenPriceProvider(
        () => mockDexScreener,
        () => mockCoinGecko,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({ address: '0xToken' }));

      expect(result.success).toBe(true);
      expect(result.cached).toBe(true);
      expect(result.data).toEqual(cachedPrice);
      expect(mockDexScreener.getBestPair).not.toHaveBeenCalled();
    });

    it('should fetch from DexScreener when not cached', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockDexScreener.getBestPair).mockResolvedValue({
        priceUsd: '1.5',
        priceNative: '0.0005',
        priceChange: { h24: 5.5, h1: 0.5 },
      } as any);

      const provider = createTokenPriceProvider(
        () => mockDexScreener,
        () => mockCoinGecko,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({ address: '0xToken' }));

      expect(result.success).toBe(true);
      expect(result.data?.priceUsd).toBe(1.5);
      expect(result.data?.priceNative).toBe(0.0005);
      expect(result.data?.priceChange24h).toBe(5.5);
      expect(mockDexScreener.getBestPair).toHaveBeenCalledWith('0xToken', 'base');
    });

    it('should use query chainId over default', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockDexScreener.getBestPair).mockResolvedValue({
        priceUsd: '1.0',
        priceNative: '0.001',
      } as any);

      const provider = createTokenPriceProvider(
        () => mockDexScreener,
        () => mockCoinGecko,
        () => mockCache,
        config,
      );

      await provider.get(createContext({ address: '0xToken', chainId: 'ethereum' }));

      expect(mockDexScreener.getBestPair).toHaveBeenCalledWith('0xToken', 'ethereum');
    });

    it('should return error when token not found', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockDexScreener.getBestPair).mockResolvedValue(null);

      const provider = createTokenPriceProvider(
        () => mockDexScreener,
        () => mockCoinGecko,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({ address: '0xNonExistent' }));

      expect(result.success).toBe(false);
      expect(result.error).toBe('Token not found on DEX');
    });

    it('should cache result after fetching', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockDexScreener.getBestPair).mockResolvedValue({
        priceUsd: '2.0',
        priceNative: '0.001',
      } as any);

      const provider = createTokenPriceProvider(
        () => mockDexScreener,
        () => mockCoinGecko,
        () => mockCache,
        config,
      );

      await provider.get(createContext({ address: '0xToken' }));

      expect(mockCache.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ priceUsd: 2.0 }),
        30000,
      );
    });

    it('should not use cache when disabled', async () => {
      const noCacheConfig: TokenDataPluginConfig = {
        ...config,
        enableCache: false,
      };

      jest.mocked(mockDexScreener.getBestPair).mockResolvedValue({
        priceUsd: '1.0',
        priceNative: '0.001',
      } as any);

      const provider = createTokenPriceProvider(
        () => mockDexScreener,
        () => mockCoinGecko,
        () => mockCache,
        noCacheConfig,
      );

      await provider.get(createContext({ address: '0xToken' }));

      expect(mockCache.get).not.toHaveBeenCalled();
      expect(mockCache.set).not.toHaveBeenCalled();
    });

    it('should include CoinGecko history data when requested', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockDexScreener.getBestPair).mockResolvedValue({
        priceUsd: '1.0',
        priceNative: '0.001',
      } as any);
      jest.mocked(mockCoinGecko.getTokenInfo).mockResolvedValue({
        market_data: {
          price_change_percentage_7d: 10.5,
          price_change_percentage_30d: 25.0,
          ath: { usd: 5.0 },
          ath_date: { usd: '2024-01-01' },
          atl: { usd: 0.1 },
          atl_date: { usd: '2023-01-01' },
        },
      } as any);

      const provider = createTokenPriceProvider(
        () => mockDexScreener,
        () => mockCoinGecko,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({
        address: '0xToken',
        includeHistory: true,
      }));

      expect(result.data?.priceChange7d).toBe(10.5);
      expect(result.data?.priceChange30d).toBe(25.0);
      expect(result.data?.ath).toBe(5.0);
      expect(result.data?.atl).toBe(0.1);
    });

    it('should handle CoinGecko errors gracefully', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockDexScreener.getBestPair).mockResolvedValue({
        priceUsd: '1.0',
        priceNative: '0.001',
      } as any);
      jest.mocked(mockCoinGecko.getTokenInfo).mockRejectedValue(new Error('CoinGecko error'));

      const provider = createTokenPriceProvider(
        () => mockDexScreener,
        () => mockCoinGecko,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({
        address: '0xToken',
        includeHistory: true,
      }));

      // Should still return DexScreener data
      expect(result.success).toBe(true);
      expect(result.data?.priceUsd).toBe(1.0);
    });

    it('should handle DexScreener errors', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockDexScreener.getBestPair).mockRejectedValue(new Error('API Error'));

      const provider = createTokenPriceProvider(
        () => mockDexScreener,
        () => mockCoinGecko,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({ address: '0xToken' }));

      expect(result.success).toBe(false);
      expect(result.error).toBe('API Error');
    });

    it('should work without CoinGecko client', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockDexScreener.getBestPair).mockResolvedValue({
        priceUsd: '1.0',
        priceNative: '0.001',
      } as any);

      const provider = createTokenPriceProvider(
        () => mockDexScreener,
        () => null, // No CoinGecko
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({
        address: '0xToken',
        includeHistory: true,
      }));

      expect(result.success).toBe(true);
      expect(result.data?.priceUsd).toBe(1.0);
    });
  });
});
