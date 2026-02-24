/**
 * Wallet tokens provider tests
 */


import { createWalletTokensProvider } from './tokens.js';
import type { WalletDataPluginConfig, WalletToken } from '../types/index.js';
import type { MoralisWalletClient } from '../utils/moralis.js';
import type { Cache } from '../utils/cache.js';
import type { ProviderContext } from '@samterminal/core';

describe('WalletTokensProvider', () => {
  let mockMoralis: MoralisWalletClient;
  let mockCache: Cache<WalletToken[]>;
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
    } as unknown as Cache<WalletToken[]>;

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
      const provider = createWalletTokensProvider(
        () => mockMoralis,
        () => mockCache,
        config,
      );

      expect(provider.name).toBe('walletdata:tokens');
      expect(provider.type).toBe('wallet');
    });
  });

  describe('get', () => {
    it('should return error when address is missing', async () => {
      const provider = createWalletTokensProvider(
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

      const provider = createWalletTokensProvider(
        () => null,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({ address: '0xWallet' }));

      expect(result.success).toBe(false);
      expect(result.error).toBe('Moralis API key required for wallet tokens');
    });

    it('should return cached data when available', async () => {
      const cachedTokens: WalletToken[] = [
        {
          address: '0xToken1',
          chainId: 'base',
          name: 'Token 1',
          symbol: 'TK1',
          decimals: 18,
          balance: '1000000000000000000',
          balanceFormatted: 1,
          priceUsd: 100,
          valueUsd: 100,
        },
      ];

      jest.mocked(mockCache.get).mockReturnValue(cachedTokens);

      const provider = createWalletTokensProvider(
        () => mockMoralis,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({ address: '0xWallet' }));

      expect(result.success).toBe(true);
      expect(result.cached).toBe(true);
      expect(result.data).toEqual(cachedTokens);
    });

    it('should fetch tokens from Moralis', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockMoralis.getWalletTokens).mockResolvedValue({
        result: [
          {
            native_token: false,
            token_address: '0xToken1',
            name: 'Token 1',
            symbol: 'TK1',
            decimals: 18,
            balance: '1000000000000000000',
            balance_formatted: '1.0',
            usd_price: 100,
            usd_value: 100,
            logo: 'https://logo.com/tk1.png',
            usd_price_24hr_percent_change: 5.5,
            possible_spam: false,
            verified_contract: true,
          },
          {
            native_token: true, // Should be excluded
            balance: '1000000000000000000',
            balance_formatted: '1.0',
            usd_value: 3000,
          },
        ],
      } as any);

      const provider = createWalletTokensProvider(
        () => mockMoralis,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({ address: '0xWallet' }));

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1); // Native token excluded
      expect(result.data[0]).toEqual(expect.objectContaining({
        address: '0xToken1',
        symbol: 'TK1',
        valueUsd: 100,
        priceChange24h: 5.5,
        isVerified: true,
      }));
    });

    it('should sort tokens by value descending', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockMoralis.getWalletTokens).mockResolvedValue({
        result: [
          {
            native_token: false,
            token_address: '0xToken1',
            name: 'Token 1',
            symbol: 'TK1',
            decimals: 18,
            balance: '1',
            balance_formatted: '1',
            usd_value: 100,
          },
          {
            native_token: false,
            token_address: '0xToken2',
            name: 'Token 2',
            symbol: 'TK2',
            decimals: 18,
            balance: '1',
            balance_formatted: '1',
            usd_value: 500,
          },
          {
            native_token: false,
            token_address: '0xToken3',
            name: 'Token 3',
            symbol: 'TK3',
            decimals: 18,
            balance: '1',
            balance_formatted: '1',
            usd_value: 200,
          },
        ],
      } as any);

      const provider = createWalletTokensProvider(
        () => mockMoralis,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({ address: '0xWallet' }));

      expect(result.data[0].valueUsd).toBe(500);
      expect(result.data[1].valueUsd).toBe(200);
      expect(result.data[2].valueUsd).toBe(100);
    });

    it('should filter by minValueUsd', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockMoralis.getWalletTokens).mockResolvedValue({
        result: [
          { native_token: false, token_address: '0xToken1', decimals: 18, balance: '1', balance_formatted: '1', usd_value: 100 },
          { native_token: false, token_address: '0xToken2', decimals: 18, balance: '1', balance_formatted: '1', usd_value: 50 },
          { native_token: false, token_address: '0xToken3', decimals: 18, balance: '1', balance_formatted: '1', usd_value: 200 },
        ],
      } as any);

      const provider = createWalletTokensProvider(
        () => mockMoralis,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({
        address: '0xWallet',
        minValueUsd: 75,
      }));

      expect(result.data).toHaveLength(2);
      expect(result.data.every((t: any) => t.valueUsd >= 75)).toBe(true);
    });

    it('should respect limit parameter', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockMoralis.getWalletTokens).mockResolvedValue({
        result: Array.from({ length: 20 }, (_, i) => ({
          native_token: false,
          token_address: `0xToken${i}`,
          decimals: 18,
          balance: '1',
          balance_formatted: '1',
          usd_value: 100 - i,
        })),
      } as any);

      const provider = createWalletTokensProvider(
        () => mockMoralis,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({
        address: '0xWallet',
        limit: 5,
      }));

      expect(result.data).toHaveLength(5);
    });

    it('should apply filters to cached data', async () => {
      const cachedTokens: WalletToken[] = [
        { address: '0xToken1', valueUsd: 500 } as WalletToken,
        { address: '0xToken2', valueUsd: 100 } as WalletToken,
        { address: '0xToken3', valueUsd: 50 } as WalletToken,
      ];

      jest.mocked(mockCache.get).mockReturnValue(cachedTokens);

      const provider = createWalletTokensProvider(
        () => mockMoralis,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({
        address: '0xWallet',
        minValueUsd: 75,
        limit: 1,
      }));

      expect(result.data).toHaveLength(1);
      expect(result.data[0].valueUsd).toBe(500);
    });

    it('should cache full result before filtering', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockMoralis.getWalletTokens).mockResolvedValue({
        result: [
          { native_token: false, token_address: '0xToken1', decimals: 18, balance: '1', balance_formatted: '1', usd_value: 500 },
          { native_token: false, token_address: '0xToken2', decimals: 18, balance: '1', balance_formatted: '1', usd_value: 100 },
        ],
      } as any);

      const provider = createWalletTokensProvider(
        () => mockMoralis,
        () => mockCache,
        config,
      );

      await provider.get(createContext({
        address: '0xWallet',
        limit: 1, // Only want 1 token
      }));

      // Cache should have both tokens (full result)
      expect(mockCache.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([
          expect.objectContaining({ address: '0xToken1' }),
          expect.objectContaining({ address: '0xToken2' }),
        ]),
        30000,
      );
    });

    it('should handle Moralis errors', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockMoralis.getWalletTokens).mockRejectedValue(new Error('API Error'));

      const provider = createWalletTokensProvider(
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

      const provider = createWalletTokensProvider(
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
