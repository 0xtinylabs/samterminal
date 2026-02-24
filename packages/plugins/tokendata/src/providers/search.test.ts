/**
 * Token search provider tests
 */


import { createTokenSearchProvider } from './search.js';
import type { TokenDataPluginConfig } from '../types/index.js';
import type { DexScreenerClient } from '../utils/dexscreener.js';
import type { CoinGeckoClient } from '../utils/coingecko.js';
import type { ProviderContext } from '@samterminal/core';

describe('TokenSearchProvider', () => {
  let mockDexScreener: DexScreenerClient;
  let mockCoinGecko: CoinGeckoClient;
  let config: TokenDataPluginConfig;

  beforeEach(() => {
    mockDexScreener = {
      searchTokens: jest.fn(),
    } as unknown as DexScreenerClient;

    mockCoinGecko = {
      search: jest.fn(),
    } as unknown as CoinGeckoClient;

    config = {
      defaultChain: 'base',
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
      const provider = createTokenSearchProvider(
        () => mockDexScreener,
        () => mockCoinGecko,
        config,
      );

      expect(provider.name).toBe('tokendata:search');
      expect(provider.type).toBe('token');
    });
  });

  describe('get', () => {
    it('should return error when query is missing', async () => {
      const provider = createTokenSearchProvider(
        () => mockDexScreener,
        () => mockCoinGecko,
        config,
      );

      const result = await provider.get(createContext({}));

      expect(result.success).toBe(false);
      expect(result.error).toBe('Search query must be at least 2 characters');
    });

    it('should return error when query is too short', async () => {
      const provider = createTokenSearchProvider(
        () => mockDexScreener,
        () => mockCoinGecko,
        config,
      );

      const result = await provider.get(createContext({ query: 'a' }));

      expect(result.success).toBe(false);
      expect(result.error).toBe('Search query must be at least 2 characters');
    });

    it('should search DexScreener and return results', async () => {
      jest.mocked(mockDexScreener.searchTokens).mockResolvedValue([
        {
          chainId: 'base',
          baseToken: { address: '0xToken1', name: 'Token One', symbol: 'TK1' },
          priceUsd: '1.5',
          volume: { h24: 100000 },
          liquidity: { usd: 500000 },
          marketCap: 1000000,
          info: { imageUrl: 'https://logo.com/tk1.png' },
        },
      ] as any);

      const provider = createTokenSearchProvider(
        () => mockDexScreener,
        () => null,
        config,
      );

      const result = await provider.get(createContext({ query: 'token' }));

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual({
        address: '0xToken1',
        chainId: 'base',
        name: 'Token One',
        symbol: 'TK1',
        logoUrl: 'https://logo.com/tk1.png',
        priceUsd: 1.5,
        volume24h: 100000,
        liquidity: 500000,
        marketCap: 1000000,
        source: 'dexscreener',
      });
    });

    it('should deduplicate results by address', async () => {
      jest.mocked(mockDexScreener.searchTokens).mockResolvedValue([
        {
          chainId: 'base',
          baseToken: { address: '0xToken1', name: 'Token', symbol: 'TK' },
          priceUsd: '1.0',
        },
        {
          chainId: 'base',
          baseToken: { address: '0xToken1', name: 'Token', symbol: 'TK' },
          priceUsd: '1.1', // Same token, different pair
        },
        {
          chainId: 'ethereum',
          baseToken: { address: '0xToken1', name: 'Token', symbol: 'TK' },
          priceUsd: '1.0', // Same address but different chain
        },
      ] as any);

      const provider = createTokenSearchProvider(
        () => mockDexScreener,
        () => null,
        config,
      );

      const result = await provider.get(createContext({ query: 'token' }));

      expect(result.data).toHaveLength(2); // One per chain
    });

    it('should respect limit parameter', async () => {
      const mockPairs = Array.from({ length: 30 }, (_, i) => ({
        chainId: 'base',
        baseToken: { address: `0xToken${i}`, name: `Token ${i}`, symbol: `TK${i}` },
        priceUsd: '1.0',
      }));

      jest.mocked(mockDexScreener.searchTokens).mockResolvedValue(mockPairs as any);

      const provider = createTokenSearchProvider(
        () => mockDexScreener,
        () => null,
        config,
      );

      const result = await provider.get(createContext({ query: 'token', limit: 10 }));

      expect(result.data).toHaveLength(10);
    });

    it('should use default limit of 20', async () => {
      const mockPairs = Array.from({ length: 30 }, (_, i) => ({
        chainId: 'base',
        baseToken: { address: `0xToken${i}`, name: `Token ${i}`, symbol: `TK${i}` },
        priceUsd: '1.0',
      }));

      jest.mocked(mockDexScreener.searchTokens).mockResolvedValue(mockPairs as any);

      const provider = createTokenSearchProvider(
        () => mockDexScreener,
        () => null,
        config,
      );

      const result = await provider.get(createContext({ query: 'token' }));

      expect(result.data).toHaveLength(20);
    });

    it('should include CoinGecko results when DexScreener has fewer results', async () => {
      jest.mocked(mockDexScreener.searchTokens).mockResolvedValue([
        {
          chainId: 'base',
          baseToken: { address: '0xDex', name: 'Dex Token', symbol: 'DEX' },
          priceUsd: '1.0',
        },
      ] as any);

      jest.mocked(mockCoinGecko.search).mockResolvedValue({
        coins: [
          {
            id: 'coingecko-token',
            name: 'CoinGecko Token',
            symbol: 'cg',
            large: 'https://logo.com/cg.png',
          },
        ],
      } as any);

      const provider = createTokenSearchProvider(
        () => mockDexScreener,
        () => mockCoinGecko,
        config,
      );

      const result = await provider.get(createContext({ query: 'token', limit: 10 }));

      expect(result.data).toHaveLength(2);
      expect(result.data[1]).toEqual({
        address: 'coingecko-token',
        chainId: 'unknown',
        name: 'CoinGecko Token',
        symbol: 'CG',
        logoUrl: 'https://logo.com/cg.png',
        source: 'coingecko',
      });
    });

    it('should not include duplicate CoinGecko results', async () => {
      jest.mocked(mockDexScreener.searchTokens).mockResolvedValue([
        {
          chainId: 'base',
          baseToken: { address: '0xToken', name: 'Test Token', symbol: 'TEST' },
          priceUsd: '1.0',
        },
      ] as any);

      jest.mocked(mockCoinGecko.search).mockResolvedValue({
        coins: [
          {
            id: 'test-token',
            name: 'Test Token', // Same name
            symbol: 'test', // Same symbol (case insensitive)
            large: 'https://logo.com/test.png',
          },
        ],
      } as any);

      const provider = createTokenSearchProvider(
        () => mockDexScreener,
        () => mockCoinGecko,
        config,
      );

      const result = await provider.get(createContext({ query: 'test' }));

      expect(result.data).toHaveLength(1);
      expect(result.data[0].source).toBe('dexscreener');
    });

    it('should handle CoinGecko errors gracefully', async () => {
      jest.mocked(mockDexScreener.searchTokens).mockResolvedValue([
        {
          chainId: 'base',
          baseToken: { address: '0xToken', name: 'Token', symbol: 'TK' },
          priceUsd: '1.0',
        },
      ] as any);

      jest.mocked(mockCoinGecko.search).mockRejectedValue(new Error('CoinGecko error'));

      const provider = createTokenSearchProvider(
        () => mockDexScreener,
        () => mockCoinGecko,
        config,
      );

      const result = await provider.get(createContext({ query: 'token' }));

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });

    it('should handle DexScreener errors', async () => {
      jest.mocked(mockDexScreener.searchTokens).mockRejectedValue(new Error('Search failed'));

      const provider = createTokenSearchProvider(
        () => mockDexScreener,
        () => mockCoinGecko,
        config,
      );

      const result = await provider.get(createContext({ query: 'token' }));

      expect(result.success).toBe(false);
      expect(result.error).toBe('Search failed');
    });

    it('should work without CoinGecko client', async () => {
      jest.mocked(mockDexScreener.searchTokens).mockResolvedValue([
        {
          chainId: 'base',
          baseToken: { address: '0xToken', name: 'Token', symbol: 'TK' },
          priceUsd: '1.0',
        },
      ] as any);

      const provider = createTokenSearchProvider(
        () => mockDexScreener,
        () => null,
        config,
      );

      const result = await provider.get(createContext({ query: 'token' }));

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });

    it('should not call CoinGecko when DexScreener fills limit', async () => {
      const mockPairs = Array.from({ length: 10 }, (_, i) => ({
        chainId: 'base',
        baseToken: { address: `0xToken${i}`, name: `Token ${i}`, symbol: `TK${i}` },
        priceUsd: '1.0',
      }));

      jest.mocked(mockDexScreener.searchTokens).mockResolvedValue(mockPairs as any);

      const provider = createTokenSearchProvider(
        () => mockDexScreener,
        () => mockCoinGecko,
        config,
      );

      await provider.get(createContext({ query: 'token', limit: 10 }));

      expect(mockCoinGecko.search).not.toHaveBeenCalled();
    });
  });
});
