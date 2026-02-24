/**
 * Token metadata provider tests
 */


import { createTokenMetadataProvider } from './metadata.js';
import type { TokenDataPluginConfig, TokenData } from '../types/index.js';
import type { DexScreenerClient } from '../utils/dexscreener.js';
import type { CoinGeckoClient } from '../utils/coingecko.js';
import type { MoralisClient } from '../utils/moralis.js';
import type { Cache } from '../utils/cache.js';
import type { ProviderContext } from '@samterminal/core';

describe('TokenMetadataProvider', () => {
  let mockDexScreener: DexScreenerClient;
  let mockCoinGecko: CoinGeckoClient;
  let mockMoralis: MoralisClient;
  let mockCache: Cache<TokenData>;
  let config: TokenDataPluginConfig;

  beforeEach(() => {
    mockDexScreener = {
      getBestPair: jest.fn(),
    } as unknown as DexScreenerClient;

    mockCoinGecko = {
      getTokenInfo: jest.fn(),
    } as unknown as CoinGeckoClient;

    mockMoralis = {
      getTokenMetadata: jest.fn(),
    } as unknown as MoralisClient;

    mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      has: jest.fn(),
      delete: jest.fn(),
      clear: jest.fn(),
    } as unknown as Cache<TokenData>;

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
      const provider = createTokenMetadataProvider(
        () => mockDexScreener,
        () => mockCoinGecko,
        () => mockMoralis,
        () => mockCache,
        config,
      );

      expect(provider.name).toBe('tokendata:metadata');
      expect(provider.type).toBe('token');
    });
  });

  describe('get', () => {
    it('should return error when address is missing', async () => {
      const provider = createTokenMetadataProvider(
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
      const cachedMetadata: TokenData = {
        address: '0xToken',
        chainId: 'base',
        name: 'Test Token',
        symbol: 'TEST',
        decimals: 18,
        logoUrl: 'https://logo.com/test.png',
      };

      jest.mocked(mockCache.get).mockReturnValue(cachedMetadata);

      const provider = createTokenMetadataProvider(
        () => mockDexScreener,
        () => mockCoinGecko,
        () => mockMoralis,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({ address: '0xToken' }));

      expect(result.success).toBe(true);
      expect(result.cached).toBe(true);
      expect(result.data).toEqual(cachedMetadata);
      expect(mockDexScreener.getBestPair).not.toHaveBeenCalled();
    });

    it('should fetch metadata from DexScreener', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockDexScreener.getBestPair).mockResolvedValue({
        baseToken: {
          name: 'DexScreener Token',
          symbol: 'DST',
        },
        info: {
          imageUrl: 'https://logo.com/dst.png',
          websites: [{ url: 'https://example.com' }],
          socials: [
            { type: 'twitter', url: 'https://twitter.com/token' },
            { type: 'telegram', url: 'https://t.me/token' },
          ],
        },
      } as any);

      const provider = createTokenMetadataProvider(
        () => mockDexScreener,
        () => null,
        () => null,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({ address: '0xToken' }));

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('DexScreener Token');
      expect(result.data?.symbol).toBe('DST');
      expect(result.data?.logoUrl).toBe('https://logo.com/dst.png');
      expect(result.data?.website).toBe('https://example.com');
      expect(result.data?.twitter).toBe('https://twitter.com/token');
      expect(result.data?.telegram).toBe('https://t.me/token');
      expect(result.data?.decimals).toBe(18); // Default
    });

    it('should use query chainId over default', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockDexScreener.getBestPair).mockResolvedValue({
        baseToken: { name: 'Token', symbol: 'TK' },
      } as any);

      const provider = createTokenMetadataProvider(
        () => mockDexScreener,
        () => null,
        () => null,
        () => mockCache,
        config,
      );

      await provider.get(createContext({ address: '0xToken', chainId: 'ethereum' }));

      expect(mockDexScreener.getBestPair).toHaveBeenCalledWith('0xToken', 'ethereum');
    });

    it('should enrich with CoinGecko data', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockDexScreener.getBestPair).mockResolvedValue({
        baseToken: { name: 'Token', symbol: 'TK' },
      } as any);
      jest.mocked(mockCoinGecko.getTokenInfo).mockResolvedValue({
        id: 'coingecko-token',
        name: 'CoinGecko Token',
        symbol: 'CGT',
        image: { large: 'https://logo.com/cgt.png' },
        description: { en: 'Token description' },
        detail_platforms: {
          base: { decimal_place: 8 },
        },
        links: {
          homepage: ['https://coingecko-token.com'],
          twitter_screen_name: 'cgtoken',
          telegram_channel_identifier: 'cgtoken_channel',
        },
      } as any);

      const provider = createTokenMetadataProvider(
        () => mockDexScreener,
        () => mockCoinGecko,
        () => null,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({ address: '0xToken' }));

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('CoinGecko Token');
      expect(result.data?.symbol).toBe('CGT');
      expect(result.data?.decimals).toBe(8);
      expect(result.data?.logoUrl).toBe('https://logo.com/cgt.png');
      expect(result.data?.description).toBe('Token description');
      expect(result.data?.website).toBe('https://coingecko-token.com');
      expect(result.data?.twitter).toBe('https://twitter.com/cgtoken');
      expect(result.data?.telegram).toBe('https://t.me/cgtoken_channel');
      expect(result.data?.coingeckoId).toBe('coingecko-token');
    });

    it('should handle CoinGecko errors gracefully', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockDexScreener.getBestPair).mockResolvedValue({
        baseToken: { name: 'Token', symbol: 'TK' },
        info: { imageUrl: 'https://logo.com/tk.png' },
      } as any);
      jest.mocked(mockCoinGecko.getTokenInfo).mockRejectedValue(new Error('CoinGecko error'));

      const provider = createTokenMetadataProvider(
        () => mockDexScreener,
        () => mockCoinGecko,
        () => null,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({ address: '0xToken' }));

      // Should return DexScreener data
      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('Token');
      expect(result.data?.logoUrl).toBe('https://logo.com/tk.png');
    });

    it('should fetch logo from Moralis if missing', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockDexScreener.getBestPair).mockResolvedValue({
        baseToken: { name: 'Token', symbol: 'TK' },
        // No info.imageUrl
      } as any);
      jest.mocked(mockMoralis.getTokenMetadata).mockResolvedValue([
        {
          logo: 'https://logo.com/moralis.png',
          decimals: '6',
        },
      ] as any);

      const provider = createTokenMetadataProvider(
        () => mockDexScreener,
        () => null,
        () => mockMoralis,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({ address: '0xToken' }));

      expect(result.success).toBe(true);
      expect(result.data?.logoUrl).toBe('https://logo.com/moralis.png');
      expect(result.data?.decimals).toBe(6);
    });

    it('should use thumbnail if logo is missing', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockDexScreener.getBestPair).mockResolvedValue({
        baseToken: { name: 'Token', symbol: 'TK' },
      } as any);
      jest.mocked(mockMoralis.getTokenMetadata).mockResolvedValue([
        {
          thumbnail: 'https://logo.com/thumbnail.png',
          decimals: '18',
        },
      ] as any);

      const provider = createTokenMetadataProvider(
        () => mockDexScreener,
        () => null,
        () => mockMoralis,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({ address: '0xToken' }));

      expect(result.success).toBe(true);
      expect(result.data?.logoUrl).toBe('https://logo.com/thumbnail.png');
    });

    it('should handle Moralis errors gracefully', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockDexScreener.getBestPair).mockResolvedValue({
        baseToken: { name: 'Token', symbol: 'TK' },
      } as any);
      jest.mocked(mockMoralis.getTokenMetadata).mockRejectedValue(new Error('Moralis error'));

      const provider = createTokenMetadataProvider(
        () => mockDexScreener,
        () => null,
        () => mockMoralis,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({ address: '0xToken' }));

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('Token');
    });

    it('should return error when token not found', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockDexScreener.getBestPair).mockResolvedValue(null);

      const provider = createTokenMetadataProvider(
        () => mockDexScreener,
        () => null,
        () => null,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({ address: '0xNonExistent' }));

      expect(result.success).toBe(false);
      expect(result.error).toBe('Token not found');
    });

    it('should cache result after fetching', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockDexScreener.getBestPair).mockResolvedValue({
        baseToken: { name: 'Token', symbol: 'TK' },
      } as any);

      const provider = createTokenMetadataProvider(
        () => mockDexScreener,
        () => null,
        () => null,
        () => mockCache,
        config,
      );

      await provider.get(createContext({ address: '0xToken' }));

      expect(mockCache.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ name: 'Token' }),
        30000,
      );
    });

    it('should not use cache when disabled', async () => {
      const noCacheConfig: TokenDataPluginConfig = {
        ...config,
        enableCache: false,
      };

      jest.mocked(mockDexScreener.getBestPair).mockResolvedValue({
        baseToken: { name: 'Token', symbol: 'TK' },
      } as any);

      const provider = createTokenMetadataProvider(
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

      const provider = createTokenMetadataProvider(
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
