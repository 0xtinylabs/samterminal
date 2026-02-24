/**
 * Token pools provider tests
 */


import { createTokenPoolsProvider } from './pools.js';
import type { TokenDataPluginConfig, PoolData } from '../types/index.js';
import type { DexScreenerClient } from '../utils/dexscreener.js';
import type { Cache } from '../utils/cache.js';
import type { ProviderContext } from '@samterminal/core';

describe('TokenPoolsProvider', () => {
  let mockDexScreener: DexScreenerClient;
  let mockCache: Cache<PoolData[]>;
  let config: TokenDataPluginConfig;

  beforeEach(() => {
    mockDexScreener = {
      getBestPair: jest.fn(),
      getTokenPairs: jest.fn(),
      getPairByAddress: jest.fn(),
    } as unknown as DexScreenerClient;

    mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      has: jest.fn(),
      delete: jest.fn(),
      clear: jest.fn(),
    } as unknown as Cache<PoolData[]>;

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
      const provider = createTokenPoolsProvider(
        () => mockDexScreener,
        () => mockCache,
        config,
      );

      expect(provider.name).toBe('tokendata:pools');
      expect(provider.type).toBe('token');
    });
  });

  describe('get', () => {
    it('should return error when both addresses are missing', async () => {
      const provider = createTokenPoolsProvider(
        () => mockDexScreener,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({}));

      expect(result.success).toBe(false);
      expect(result.error).toBe('Token address or pool address is required');
    });

    it('should return cached data when available', async () => {
      const cachedPools: PoolData[] = [
        {
          address: '0xPool1',
          chainId: 'base',
          dex: 'uniswap',
          poolType: 'uniswap_v2',
          token0: { address: '0xToken0', symbol: 'TK0', reserve: '1000' },
          token1: { address: '0xToken1', symbol: 'TK1', reserve: '2000' },
          liquidity: '100000',
          lastUpdated: new Date().toISOString(),
        },
      ];

      jest.mocked(mockCache.get).mockReturnValue(cachedPools);

      const provider = createTokenPoolsProvider(
        () => mockDexScreener,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({ tokenAddress: '0xToken' }));

      expect(result.success).toBe(true);
      expect(result.cached).toBe(true);
      expect(result.data).toEqual(cachedPools);
      expect(mockDexScreener.getTokenPairs).not.toHaveBeenCalled();
    });

    it('should fetch pools by token address', async () => {
      (mockCache.get as ReturnType<typeof jest.fn>).mockReturnValue(undefined);
      (mockDexScreener.getTokenPairs as ReturnType<typeof jest.fn>).mockResolvedValue([
        {
          pairAddress: '0xPool1',
          chainId: 'base',
          dexId: 'uniswap',
          baseToken: { address: '0xToken', symbol: 'TK' },
          quoteToken: { address: '0xWETH', symbol: 'WETH' },
          priceUsd: '1.5',
          liquidity: { usd: 100000, base: 50000, quote: 50000 },
          volume: { h24: 25000 },
          txns: { h24: { buys: 100, sells: 80 } },
          pairCreatedAt: 1700000000000, // Numeric timestamp
        },
      ] as any);

      const provider = createTokenPoolsProvider(
        () => mockDexScreener,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({ tokenAddress: '0xToken' }));

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual(expect.objectContaining({
        address: '0xPool1',
        chainId: 'base',
        dex: 'uniswap',
        poolType: 'uniswap_v2',
        liquidity: '100000',
        liquidityUsd: 100000,
        volume24h: 25000,
        txCount24h: 180,
      }));
    });

    it('should fetch pool by pool address', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockDexScreener.getPairByAddress).mockResolvedValue({
        pairAddress: '0xPool1',
        chainId: 'base',
        dexId: 'aerodrome',
        baseToken: { address: '0xToken', symbol: 'TK' },
        quoteToken: { address: '0xUSDC', symbol: 'USDC' },
        priceUsd: '2.0',
        liquidity: { usd: 500000 },
      } as any);

      const provider = createTokenPoolsProvider(
        () => mockDexScreener,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({ poolAddress: '0xPool1' }));

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(mockDexScreener.getPairByAddress).toHaveBeenCalledWith('base', '0xPool1');
    });

    it('should use query chainId over default', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockDexScreener.getTokenPairs).mockResolvedValue([]);

      const provider = createTokenPoolsProvider(
        () => mockDexScreener,
        () => mockCache,
        config,
      );

      await provider.get(createContext({
        tokenAddress: '0xToken',
        chainId: 'ethereum',
      }));

      expect(mockDexScreener.getTokenPairs).toHaveBeenCalledWith('0xToken', 'ethereum');
    });

    it('should filter by DEX', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockDexScreener.getTokenPairs).mockResolvedValue([
        {
          pairAddress: '0xPool1',
          chainId: 'base',
          dexId: 'uniswap',
          baseToken: { address: '0xToken', symbol: 'TK' },
          quoteToken: { address: '0xWETH', symbol: 'WETH' },
          priceUsd: '1.5',
          liquidity: { usd: 100000 },
        },
        {
          pairAddress: '0xPool2',
          chainId: 'base',
          dexId: 'aerodrome',
          baseToken: { address: '0xToken', symbol: 'TK' },
          quoteToken: { address: '0xUSDC', symbol: 'USDC' },
          priceUsd: '1.5',
          liquidity: { usd: 200000 },
        },
      ] as any);

      const provider = createTokenPoolsProvider(
        () => mockDexScreener,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({
        tokenAddress: '0xToken',
        dex: 'aerodrome',
      }));

      expect(result.data).toHaveLength(1);
      expect(result.data[0].dex).toBe('aerodrome');
    });

    it('should sort by liquidity and respect limit', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockDexScreener.getTokenPairs).mockResolvedValue([
        {
          pairAddress: '0xPool1',
          chainId: 'base',
          dexId: 'uniswap',
          baseToken: { address: '0xToken', symbol: 'TK' },
          quoteToken: { address: '0xWETH', symbol: 'WETH' },
          priceUsd: '1.0',
          liquidity: { usd: 50000 },
        },
        {
          pairAddress: '0xPool2',
          chainId: 'base',
          dexId: 'aerodrome',
          baseToken: { address: '0xToken', symbol: 'TK' },
          quoteToken: { address: '0xUSDC', symbol: 'USDC' },
          priceUsd: '1.0',
          liquidity: { usd: 200000 },
        },
        {
          pairAddress: '0xPool3',
          chainId: 'base',
          dexId: 'sushiswap',
          baseToken: { address: '0xToken', symbol: 'TK' },
          quoteToken: { address: '0xDAI', symbol: 'DAI' },
          priceUsd: '1.0',
          liquidity: { usd: 100000 },
        },
      ] as any);

      const provider = createTokenPoolsProvider(
        () => mockDexScreener,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({
        tokenAddress: '0xToken',
        limit: 2,
      }));

      expect(result.data).toHaveLength(2);
      expect(result.data[0].address).toBe('0xPool2'); // Highest liquidity
      expect(result.data[1].address).toBe('0xPool3'); // Second highest
    });

    it('should use default limit of 10', async () => {
      const mockPairs = Array.from({ length: 15 }, (_, i) => ({
        pairAddress: `0xPool${i}`,
        chainId: 'base',
        dexId: 'uniswap',
        baseToken: { address: '0xToken', symbol: 'TK' },
        quoteToken: { address: `0xQuote${i}`, symbol: `Q${i}` },
        priceUsd: '1.0',
        liquidity: { usd: (15 - i) * 10000 },
      }));

      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockDexScreener.getTokenPairs).mockResolvedValue(mockPairs as any);

      const provider = createTokenPoolsProvider(
        () => mockDexScreener,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({ tokenAddress: '0xToken' }));

      expect(result.data).toHaveLength(10);
    });

    it('should map DEX IDs to pool types', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockDexScreener.getTokenPairs).mockResolvedValue([
        {
          pairAddress: '0xPool1',
          chainId: 'base',
          dexId: 'uniswapv3',
          baseToken: { address: '0xToken', symbol: 'TK' },
          quoteToken: { address: '0xWETH', symbol: 'WETH' },
          priceUsd: '1.0',
          liquidity: { usd: 100000 },
        },
        {
          pairAddress: '0xPool2',
          chainId: 'base',
          dexId: 'aerodrome',
          baseToken: { address: '0xToken', symbol: 'TK' },
          quoteToken: { address: '0xUSDC', symbol: 'USDC' },
          priceUsd: '1.0',
          liquidity: { usd: 100000 },
        },
        {
          pairAddress: '0xPool3',
          chainId: 'base',
          dexId: 'unknown_dex',
          baseToken: { address: '0xToken', symbol: 'TK' },
          quoteToken: { address: '0xDAI', symbol: 'DAI' },
          priceUsd: '1.0',
          liquidity: { usd: 100000 },
        },
      ] as any);

      const provider = createTokenPoolsProvider(
        () => mockDexScreener,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({ tokenAddress: '0xToken' }));

      expect(result.data[0].poolType).toBe('uniswap_v3');
      expect(result.data[1].poolType).toBe('aerodrome');
      expect(result.data[2].poolType).toBe('unknown');
    });

    it('should return empty array when pool not found', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockDexScreener.getPairByAddress).mockResolvedValue(null);

      const provider = createTokenPoolsProvider(
        () => mockDexScreener,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({ poolAddress: '0xNonExistent' }));

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should cache result after fetching', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockDexScreener.getTokenPairs).mockResolvedValue([
        {
          pairAddress: '0xPool1',
          chainId: 'base',
          dexId: 'uniswap',
          baseToken: { address: '0xToken', symbol: 'TK' },
          quoteToken: { address: '0xWETH', symbol: 'WETH' },
          priceUsd: '1.0',
          liquidity: { usd: 100000 },
        },
      ] as any);

      const provider = createTokenPoolsProvider(
        () => mockDexScreener,
        () => mockCache,
        config,
      );

      await provider.get(createContext({ tokenAddress: '0xToken' }));

      expect(mockCache.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Array),
        30000,
      );
    });

    it('should not use cache when disabled', async () => {
      const noCacheConfig: TokenDataPluginConfig = {
        ...config,
        enableCache: false,
      };

      jest.mocked(mockDexScreener.getTokenPairs).mockResolvedValue([]);

      const provider = createTokenPoolsProvider(
        () => mockDexScreener,
        () => mockCache,
        noCacheConfig,
      );

      await provider.get(createContext({ tokenAddress: '0xToken' }));

      expect(mockCache.get).not.toHaveBeenCalled();
      expect(mockCache.set).not.toHaveBeenCalled();
    });

    it('should handle DexScreener errors', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockDexScreener.getTokenPairs).mockRejectedValue(new Error('API Error'));

      const provider = createTokenPoolsProvider(
        () => mockDexScreener,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({ tokenAddress: '0xToken' }));

      expect(result.success).toBe(false);
      expect(result.error).toBe('API Error');
    });

    it('should calculate token reserves correctly', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockDexScreener.getTokenPairs).mockResolvedValue([
        {
          pairAddress: '0xPool1',
          chainId: 'base',
          dexId: 'uniswap',
          baseToken: { address: '0xToken', symbol: 'TK' },
          quoteToken: { address: '0xWETH', symbol: 'WETH' },
          priceUsd: '2.0',
          liquidity: { usd: 100000, base: 25000, quote: 25 },
        },
      ] as any);

      const provider = createTokenPoolsProvider(
        () => mockDexScreener,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({ tokenAddress: '0xToken' }));

      expect(result.data[0].token0).toEqual({
        address: '0xToken',
        symbol: 'TK',
        reserve: '25000',
        reserveUsd: 50000, // 25000 * 2.0
      });
      expect(result.data[0].token1).toEqual({
        address: '0xWETH',
        symbol: 'WETH',
        reserve: '25',
        reserveUsd: 25,
      });
    });
  });
});
