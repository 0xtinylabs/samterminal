/**
 * Token market data provider tests
 */


import { createTokenMarketProvider } from './market.js';
import type { TokenDataPluginConfig, TokenMarketData } from '../types/index.js';
import type { DexScreenerClient } from '../utils/dexscreener.js';
import type { CoinGeckoClient } from '../utils/coingecko.js';
import type { MoralisClient } from '../utils/moralis.js';
import type { Cache } from '../utils/cache.js';
import type { ProviderContext } from '@samterminal/core';

describe('TokenMarketProvider', () => {
  let mockDexScreener: DexScreenerClient;
  let mockCoinGecko: CoinGeckoClient;
  let mockMoralis: MoralisClient;
  let mockCache: Cache<TokenMarketData>;
  let config: TokenDataPluginConfig;

  beforeEach(() => {
    mockDexScreener = {
      getBestPair: jest.fn(),
    } as unknown as DexScreenerClient;

    mockCoinGecko = {
      getTokenInfo: jest.fn(),
    } as unknown as CoinGeckoClient;

    mockMoralis = {
      getTokenOwners: jest.fn(),
    } as unknown as MoralisClient;

    mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      has: jest.fn(),
      delete: jest.fn(),
      clear: jest.fn(),
    } as unknown as Cache<TokenMarketData>;

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
      const provider = createTokenMarketProvider(
        () => mockDexScreener,
        () => mockCoinGecko,
        () => mockMoralis,
        () => mockCache,
        config,
      );

      expect(provider.name).toBe('tokendata:market');
      expect(provider.type).toBe('market');
    });
  });

  describe('get', () => {
    it('should return error when address is missing', async () => {
      const provider = createTokenMarketProvider(
        () => mockDexScreener,
        () => mockCoinGecko,
        () => mockMoralis,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({}));

      expect(result.success).toBe(false);
      expect(result.error).toBe('Token address is required');
    });

    it('should return cached data when available', async () => {
      const cachedMarket: TokenMarketData = {
        address: '0xToken',
        chainId: 'base',
        marketCap: 1000000,
        volume24h: 50000,
        liquidity: 200000,
        lastUpdated: new Date().toISOString(),
      };

      jest.mocked(mockCache.get).mockReturnValue(cachedMarket);

      const provider = createTokenMarketProvider(
        () => mockDexScreener,
        () => mockCoinGecko,
        () => mockMoralis,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({ address: '0xToken' }));

      expect(result.success).toBe(true);
      expect(result.cached).toBe(true);
      expect(result.data).toEqual(cachedMarket);
      expect(mockDexScreener.getBestPair).not.toHaveBeenCalled();
    });

    it('should fetch market data from DexScreener', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockDexScreener.getBestPair).mockResolvedValue({
        marketCap: 1000000,
        fdv: 5000000,
        volume: { h24: 50000 },
        liquidity: { usd: 200000 },
      } as any);

      const provider = createTokenMarketProvider(
        () => mockDexScreener,
        () => null,
        () => null,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({ address: '0xToken' }));

      expect(result.success).toBe(true);
      expect(result.data?.marketCap).toBe(1000000);
      expect(result.data?.fullyDilutedValuation).toBe(5000000);
      expect(result.data?.volume24h).toBe(50000);
      expect(result.data?.liquidity).toBe(200000);
    });

    it('should use query chainId over default', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockDexScreener.getBestPair).mockResolvedValue({
        marketCap: 1000000,
      } as any);

      const provider = createTokenMarketProvider(
        () => mockDexScreener,
        () => null,
        () => null,
        () => mockCache,
        config,
      );

      await provider.get(createContext({ address: '0xToken', chainId: 'ethereum' }));

      expect(mockDexScreener.getBestPair).toHaveBeenCalledWith('0xToken', 'ethereum');
    });

    it('should return error when token not found', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockDexScreener.getBestPair).mockResolvedValue(null);

      const provider = createTokenMarketProvider(
        () => mockDexScreener,
        () => null,
        () => null,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({ address: '0xNonExistent' }));

      expect(result.success).toBe(false);
      expect(result.error).toBe('Token not found on DEX');
    });

    it('should include CoinGecko supply data when available', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockDexScreener.getBestPair).mockResolvedValue({
        marketCap: 1000000,
        liquidity: { usd: 200000 },
      } as any);
      jest.mocked(mockCoinGecko.getTokenInfo).mockResolvedValue({
        market_data: {
          circulating_supply: 500000,
          total_supply: 1000000,
          max_supply: 2000000,
          market_cap: { usd: 1500000 },
          fully_diluted_valuation: { usd: 3000000 },
        },
      } as any);

      const provider = createTokenMarketProvider(
        () => mockDexScreener,
        () => mockCoinGecko,
        () => null,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({ address: '0xToken' }));

      expect(result.success).toBe(true);
      expect(result.data?.circulatingSupply).toBe(500000);
      expect(result.data?.totalSupply).toBe(1000000);
      expect(result.data?.maxSupply).toBe(2000000);
      expect(result.data?.marketCap).toBe(1500000); // CoinGecko overwrites
      expect(result.data?.fullyDilutedValuation).toBe(3000000);
    });

    it('should handle CoinGecko errors gracefully', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockDexScreener.getBestPair).mockResolvedValue({
        marketCap: 1000000,
        liquidity: { usd: 200000 },
      } as any);
      jest.mocked(mockCoinGecko.getTokenInfo).mockRejectedValue(new Error('CoinGecko error'));

      const provider = createTokenMarketProvider(
        () => mockDexScreener,
        () => mockCoinGecko,
        () => null,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({ address: '0xToken' }));

      // Should still return DexScreener data
      expect(result.success).toBe(true);
      expect(result.data?.marketCap).toBe(1000000);
    });

    it('should fetch holders when includeHolders is true', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockDexScreener.getBestPair).mockResolvedValue({
        marketCap: 1000000,
        liquidity: { usd: 200000 },
      } as any);
      jest.mocked(mockMoralis.getTokenOwners).mockResolvedValue({
        result: [{ owner_address: '0xHolder1' }],
      } as any);

      const provider = createTokenMarketProvider(
        () => mockDexScreener,
        () => null,
        () => mockMoralis,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({
        address: '0xToken',
        includeHolders: true,
      }));

      expect(result.success).toBe(true);
      expect(mockMoralis.getTokenOwners).toHaveBeenCalledWith('base', '0xToken', { limit: 1 });
    });

    it('should handle Moralis errors gracefully', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockDexScreener.getBestPair).mockResolvedValue({
        marketCap: 1000000,
        liquidity: { usd: 200000 },
      } as any);
      jest.mocked(mockMoralis.getTokenOwners).mockRejectedValue(new Error('Moralis error'));

      const provider = createTokenMarketProvider(
        () => mockDexScreener,
        () => null,
        () => mockMoralis,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({
        address: '0xToken',
        includeHolders: true,
      }));

      // Should still return DexScreener data
      expect(result.success).toBe(true);
      expect(result.data?.marketCap).toBe(1000000);
    });

    it('should cache result after fetching', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockDexScreener.getBestPair).mockResolvedValue({
        marketCap: 1000000,
        liquidity: { usd: 200000 },
      } as any);

      const provider = createTokenMarketProvider(
        () => mockDexScreener,
        () => null,
        () => null,
        () => mockCache,
        config,
      );

      await provider.get(createContext({ address: '0xToken' }));

      expect(mockCache.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ marketCap: 1000000 }),
        30000,
      );
    });

    it('should not use cache when disabled', async () => {
      const noCacheConfig: TokenDataPluginConfig = {
        ...config,
        enableCache: false,
      };

      jest.mocked(mockDexScreener.getBestPair).mockResolvedValue({
        marketCap: 1000000,
        liquidity: { usd: 200000 },
      } as any);

      const provider = createTokenMarketProvider(
        () => mockDexScreener,
        () => null,
        () => null,
        () => mockCache,
        noCacheConfig,
      );

      await provider.get(createContext({ address: '0xToken' }));

      expect(mockCache.get).not.toHaveBeenCalled();
      expect(mockCache.set).not.toHaveBeenCalled();
    });

    it('should handle DexScreener errors', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockDexScreener.getBestPair).mockRejectedValue(new Error('API Error'));

      const provider = createTokenMarketProvider(
        () => mockDexScreener,
        () => null,
        () => null,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({ address: '0xToken' }));

      expect(result.success).toBe(false);
      expect(result.error).toBe('API Error');
    });
  });
});
